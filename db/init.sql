-- ============================================================
-- 第三只眼 · 数据库初始化脚本
-- 依据：《新版prd文档.md》第 11 章数据实体 + 前端高保真原型字段
-- 目标库：MySQL 8.0+
-- 字符集：utf8mb4（支持中文与 emoji）
-- 执行方式：mysql -uroot -p < init.sql
--           或放入 docker-entrypoint-initdb.d 由容器首次启动自动执行
-- 说明：全部使用 CREATE TABLE IF NOT EXISTS，可重复执行，不会清空已有数据
-- ============================================================

CREATE DATABASE IF NOT EXISTS third_eye
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE third_eye;

SET NAMES utf8mb4;

-- ------------------------------------------------------------
-- 1. 用户（PRD 11.1 User）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  username      VARCHAR(50)     NOT NULL                COMMENT '登录名',
  password_hash VARCHAR(255)    NOT NULL                COMMENT '密码哈希，禁止存明文',
  nickname      VARCHAR(50)     NOT NULL                COMMENT '昵称',
  email         VARCHAR(120)    DEFAULT NULL            COMMENT '邮箱',
  role          ENUM('student','teacher','admin') NOT NULL DEFAULT 'student'
                                                        COMMENT '角色：师范生/指导教师/管理员',
  timezone      VARCHAR(50)     NOT NULL DEFAULT 'Asia/Shanghai'
                                                        COMMENT '时区，打卡按此时区计算自然日',
  avatar_url    VARCHAR(255)    DEFAULT NULL            COMMENT '头像地址',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='用户';

-- ------------------------------------------------------------
-- 2. 课程（PRD 11.1 Course / F-04）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title      VARCHAR(150)    NOT NULL                   COMMENT '课程名',
  subject    VARCHAR(30)     NOT NULL                   COMMENT '学科：语文/信息技术/通识…',
  category   ENUM('必修','专项','竞赛') NOT NULL DEFAULT '必修'
                                                        COMMENT '课程类型',
  summary    TEXT            DEFAULT NULL               COMMENT '课程简介',
  cover_url  VARCHAR(255)    DEFAULT NULL               COMMENT '封面图地址',
  status     ENUM('draft','published','archived') NOT NULL DEFAULT 'published'
                                                        COMMENT '发布状态',
  created_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_courses_subject (subject),
  KEY idx_courses_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='课程';

-- ------------------------------------------------------------
-- 3. 章节（PRD 11.1 Lesson）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lessons (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id        BIGINT UNSIGNED NOT NULL             COMMENT '所属课程',
  title            VARCHAR(150)    NOT NULL             COMMENT '章节名',
  video_url        VARCHAR(500)    DEFAULT NULL         COMMENT '课堂录像地址',
  duration_seconds INT UNSIGNED    NOT NULL DEFAULT 0   COMMENT '视频时长（秒）',
  sort_order       INT             NOT NULL DEFAULT 0   COMMENT '章节顺序',
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lessons_course (course_id, sort_order),
  CONSTRAINT fk_lessons_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='课程章节';

-- ------------------------------------------------------------
-- 4. 学习进度（PRD 11.1 LearningProgress / F-04-04）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_progress (
  user_id             BIGINT UNSIGNED NOT NULL,
  lesson_id           BIGINT UNSIGNED NOT NULL,
  watched_seconds     INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '累计有效观看秒数，拖进度条不计',
  last_position_seconds INT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '上次播放位置',
  status              ENUM('not_started','in_progress','completed') NOT NULL DEFAULT 'not_started',
  updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id),
  CONSTRAINT fk_progress_user   FOREIGN KEY (user_id)   REFERENCES users (id)   ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id) REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='学习进度';

-- ------------------------------------------------------------
-- 5. 有效学习行为（PRD 11.1 LearningEvent / 5.3.3 打卡资格判定）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS learning_events (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     BIGINT UNSIGNED NOT NULL,
  kind        ENUM('course_watch','observation_submit','plan_review_submit') NOT NULL
                              COMMENT '有效学习类型：课程观看/课堂观察提交/教案评价提交',
  ref_type    VARCHAR(30)     DEFAULT NULL COMMENT '关联对象类型：lesson/observation_task/plan_submission',
  ref_id      BIGINT UNSIGNED DEFAULT NULL COMMENT '关联对象主键',
  detail      JSON            DEFAULT NULL COMMENT '补充信息，如观看秒数',
  occurred_at DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_events_user_time (user_id, occurred_at),
  KEY idx_events_kind (kind),
  CONSTRAINT fk_events_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='有效学习行为记录，用于打卡资格判定';

-- ------------------------------------------------------------
-- 6. 每日打卡（PRD 11.1 DailyCheckIn / 5.3.5）
--    同一用户同一自然日只能有一条记录
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS daily_checkins (
  id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id             BIGINT UNSIGNED NOT NULL,
  local_date          DATE            NOT NULL           COMMENT '账户时区下的自然日',
  qualifying_event_id BIGINT UNSIGNED DEFAULT NULL       COMMENT '触发打卡资格的学习行为',
  checked_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_checkin_user_date (user_id, local_date),
  CONSTRAINT fk_checkin_user  FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_checkin_event FOREIGN KEY (qualifying_event_id)
    REFERENCES learning_events (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='每日学习打卡';

-- ------------------------------------------------------------
-- 7. 课堂观察任务（PRD 11.1 ObservationTask / 5.5）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS observation_tasks (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  lesson_id        BIGINT UNSIGNED NOT NULL             COMMENT '对应的课堂录像章节',
  title            VARCHAR(150)    NOT NULL             COMMENT '观察任务名',
  instructions     TEXT            DEFAULT NULL         COMMENT '任务说明',
  duration_seconds INT UNSIGNED    NOT NULL DEFAULT 0   COMMENT '视频时长，用于校验时间戳上限',
  status           ENUM('draft','published','archived') NOT NULL DEFAULT 'published',
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_tasks_lesson (lesson_id),
  CONSTRAINT fk_tasks_lesson FOREIGN KEY (lesson_id)
    REFERENCES lessons (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='课堂观察任务';

-- ------------------------------------------------------------
-- 8. 教学事件标注（PRD 11.1 ObservationAnnotation / 5.5.3）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS observation_annotations (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id        BIGINT UNSIGNED NOT NULL,
  user_id        BIGINT UNSIGNED NOT NULL,
  video_second   INT UNSIGNED    NOT NULL                COMMENT '视频时间点（秒）',
  event_type     ENUM('教师提问','学生回应','师生互动','小组合作','教师反馈','课堂组织','其他')
                                 NOT NULL DEFAULT '其他' COMMENT '事件类型（单选）',
  fact_text      VARCHAR(600)    NOT NULL                COMMENT '观察事实，10—300 字',
  interpretation TEXT            DEFAULT NULL            COMMENT '初步解释，选填',
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ann_task_time (task_id, video_second),
  KEY idx_ann_user (user_id),
  CONSTRAINT fk_ann_task FOREIGN KEY (task_id)
    REFERENCES observation_tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_ann_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='教学事件标注';

-- ------------------------------------------------------------
-- 9. 评课稿（PRD 11.1 ObservationReview / 5.6.1）
--    三段结构：事实 → 解释 → 建议
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS observation_reviews (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  task_id       BIGINT UNSIGNED NOT NULL,
  user_id       BIGINT UNSIGNED NOT NULL,
  fact_text     TEXT            DEFAULT NULL COMMENT '观察到的事实',
  analysis_text TEXT            DEFAULT NULL COMMENT '教育学解释',
  suggestion_text TEXT          DEFAULT NULL COMMENT '改进建议',
  status        ENUM('draft','submitted') NOT NULL DEFAULT 'draft',
  submitted_at  DATETIME        DEFAULT NULL,
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reviews_task_user (task_id, user_id),
  CONSTRAINT fk_reviews_task FOREIGN KEY (task_id)
    REFERENCES observation_tasks (id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='评课稿';

-- ------------------------------------------------------------
-- 10. 观察能力报告（PRD 5.6.2 三维框架）
--     分数为 0—100；NULL 表示证据不足，不得默认显示高分
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS observation_reports (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  review_id        BIGINT UNSIGNED NOT NULL             COMMENT '对应评课稿',
  noticing_score   TINYINT UNSIGNED DEFAULT NULL        COMMENT '注意 Noticing',
  reasoning_score  TINYINT UNSIGNED DEFAULT NULL        COMMENT '推理 Reasoning',
  expressing_score TINYINT UNSIGNED DEFAULT NULL        COMMENT '表述 Expressing',
  strengths        TEXT            DEFAULT NULL         COMMENT '优势',
  improvements     TEXT            DEFAULT NULL         COMMENT '待提升项',
  evidence         JSON            DEFAULT NULL         COMMENT '支撑结论的证据（标注 ID、时间戳等）',
  generated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_report_review (review_id),
  CONSTRAINT fk_report_review FOREIGN KEY (review_id)
    REFERENCES observation_reviews (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='课堂观察三维能力报告';

-- ------------------------------------------------------------
-- 11. 教案提交（PRD 11.1 LessonPlanSubmission / 5.7.2 / 5.7.8 版本管理）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_plan_submissions (
  id                 BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id            BIGINT UNSIGNED NOT NULL,
  grade              VARCHAR(20)     NOT NULL           COMMENT '学段：小学/初中/高中/其他',
  subject            VARCHAR(30)     NOT NULL           COMMENT '学科',
  plan_title         VARCHAR(100)    NOT NULL           COMMENT '教案主题',
  lesson_title       VARCHAR(100)    NOT NULL           COMMENT '教学课题',
  concern            VARCHAR(255)    DEFAULT NULL       COMMENT '用户关注的检查点',
  text_content       MEDIUMTEXT      DEFAULT NULL       COMMENT '教案正文（粘贴或解析所得）',
  file_name          VARCHAR(255)    DEFAULT NULL       COMMENT '原始文件名',
  file_path          VARCHAR(500)    DEFAULT NULL       COMMENT '文件存储路径（不存二进制）',
  char_count         INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '正文字数',
  version            INT UNSIGNED    NOT NULL DEFAULT 1 COMMENT '版本号',
  prev_submission_id BIGINT UNSIGNED DEFAULT NULL       COMMENT '上一版本，首版为 NULL',
  status             ENUM('draft','pending','analyzing','completed','failed') NOT NULL DEFAULT 'pending',
  submitted_at       DATETIME        DEFAULT NULL,
  created_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_plan_user_time (user_id, created_at),
  KEY idx_plan_status (status),
  CONSTRAINT fk_plan_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_plan_prev FOREIGN KEY (prev_submission_id)
    REFERENCES lesson_plan_submissions (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='教案提交（仅本人可见，由应用层控制可见性）';

-- ------------------------------------------------------------
-- 12. 教案评价报告（PRD 11.1 LessonPlanReport / 5.7.5 / 5.7.7）
--     报告必须绑定量表版本，历史评分不随量表调整而改变
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lesson_plan_reports (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  submission_id    BIGINT UNSIGNED NOT NULL,
  rubric_version   VARCHAR(20)     NOT NULL             COMMENT '评价量表版本，如 v1.0',
  status           ENUM('pending','analyzing','completed','failed') NOT NULL DEFAULT 'pending',
  total_score      DECIMAL(5,2)    DEFAULT NULL         COMMENT '加权总分；信息不足时为 NULL',
  dimension_results JSON           DEFAULT NULL         COMMENT '六个维度的得分与依据',
  text_evidence    JSON            DEFAULT NULL         COMMENT '原文依据（标题/段落/原句）',
  missing_items    JSON            DEFAULT NULL         COMMENT '关键缺项',
  suggestions      JSON            DEFAULT NULL         COMMENT '按优先级排序的修改建议',
  generated_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_plan_report_submission (submission_id),
  CONSTRAINT fk_plan_report_submission FOREIGN KEY (submission_id)
    REFERENCES lesson_plan_submissions (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='教案评价报告';

-- ------------------------------------------------------------
-- 13. 个性化推荐（PRD 11.1 Recommendation / 5.8）
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recommendations (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       BIGINT UNSIGNED NOT NULL,
  source_type   ENUM('observation','plan_review') NOT NULL COMMENT '推荐来源',
  source_id     BIGINT UNSIGNED DEFAULT NULL             COMMENT '来源记录 ID',
  target_ability ENUM('noticing','reasoning','expressing','plan_design') NOT NULL
                                                         COMMENT '针对的能力维度',
  resource_type VARCHAR(30)     DEFAULT NULL             COMMENT '资源类型：course/lesson/task',
  resource_id   BIGINT UNSIGNED DEFAULT NULL             COMMENT '资源 ID',
  reason        VARCHAR(500)    DEFAULT NULL             COMMENT '推荐理由',
  status        ENUM('new','accepted','dismissed') NOT NULL DEFAULT 'new',
  created_at    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_rec_user (user_id, status),
  CONSTRAINT fk_rec_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='个性化学习推荐';

-- ------------------------------------------------------------
-- 14. xAPI Statement（课程技术主线：学习行为 → xAPI → LRS）
--     本表即课程项目中的轻量 LRS，后续可替换为独立 LRS 服务
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xapi_statements (
  id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  statement_id CHAR(36)       NOT NULL                   COMMENT 'xAPI statement UUID',
  actor_id    BIGINT UNSIGNED NOT NULL                   COMMENT '发起行为的用户',
  verb        VARCHAR(80)     NOT NULL                   COMMENT '动作，如 experienced/answered/completed',
  object_type VARCHAR(50)     DEFAULT NULL               COMMENT '对象类型：activity/lesson/plan',
  object_id   VARCHAR(100)    DEFAULT NULL               COMMENT '对象标识',
  result      JSON            DEFAULT NULL               COMMENT '结果，如 completion/score/duration',
  context     JSON            DEFAULT NULL               COMMENT '上下文，如 task/视频时间点',
  stored_at   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_xapi_statement (statement_id),
  KEY idx_xapi_actor_time (actor_id, stored_at),
  KEY idx_xapi_verb (verb),
  CONSTRAINT fk_xapi_actor FOREIGN KEY (actor_id)
    REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='xAPI Statement 存储（LRS 简表）';

-- ============================================================
-- 演示数据（可选）：只插入课程与章节，便于在 Navicat 中查看结构
-- 使用显式主键 + INSERT IGNORE，重复执行不会产生重复行
-- ============================================================
INSERT IGNORE INTO courses (id, title, subject, category, summary) VALUES
  (1, '中学语文教学设计与课堂观察方法论', '语文', '必修', '从观察到评课的完整方法论训练。'),
  (2, '课堂观察框架与师生言语互动分析（FIAS 升级版）', '通识', '专项', '用结构化量表拆解课堂言语互动。'),
  (3, '课堂录像的多模态观察：从时间戳到能力画像', '信息技术', '专项', '时间戳标注与证据链构建。');

INSERT IGNORE INTO lessons (id, course_id, title, video_url, duration_seconds, sort_order) VALUES
  (1, 1, '第一章 课堂观察的基本立场', NULL, 1800, 1),
  (2, 1, '第二章 从观察到证据', NULL, 2100, 2),
  (3, 2, '第一章 FIAS 编码体系入门', NULL, 2400, 1);

INSERT IGNORE INTO observation_tasks (id, lesson_id, title, instructions, duration_seconds) VALUES
  (1, 1, '小学语文《背影》课堂观察训练',
   '观看课堂录像，边看边打点：选择事件类型、记录可观察的事实，最后撰写评课稿。', 1800);
