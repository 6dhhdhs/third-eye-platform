# -*- coding: utf-8 -*-
"""一次性迁移脚本：把 Stitch 导出的单文件页面整理为多页面工程。
运行后不再需要，保留在 archive/ 中作为改动记录。
"""
import re
import os

SRC = r"D:/我做的/智能教育平台开发/第三只眼/_stitch_raw/stitch_"
DST = r"D:/我做的/智能教育平台开发/第三只眼/stitch_"

PAGES = {
    "_1": ("home.html", "home", "首页学习工作台",
           "第三只眼首页学习工作台：继续学习、今日打卡与核心实训入口。"),
    "_2": ("observe-workbench.html", "observe", "课堂观察工作台",
           "课堂观察工作台：课堂录像时间戳标注、评课撰写与证据引用。"),
    "ai_1": ("speaking-report.html", "speaking", "说课评价报告",
             "AI 说课实训评价报告：五维形成性诊断与可定位证据。"),
}

# 图片：按 alt 语义替换为本地 SVG，避免依赖境外图床
IMAGE_RULES = [
    ("Logo", "favicon.svg"),
    ("Profile", "avatar.svg"),
    ("A modern university classroom", "course-observation.svg"),
    ("A preservice teacher standing", "course-competition.svg"),
    ("An organized desk", "course-lesson-plan.svg"),
    ("岳阳楼记", "poster-classroom.svg"),
    ("说课现场回放", "poster-speaking.svg"),
]

LINK_RULES = {
    "返回任务列表": "observe.html",
    "返回任务": "observe.html",
    "返回说课实训列表": "speaking.html",
    "查看完整学习日历与成长档案": "profile.html#calendar",
    "进入课堂观察工作台": "observe-workbench.html",
    "发起新说课演练 / 上传视频": "speaking.html#new",
    "查看同侪互评详情": "#peer",
}

# 需要跳转、但不是 <a> 的按钮
DATA_HREF_RULES = {
    "继续学习该章节": "course-learn.html",
    "查看课程目录": "course-learn.html#chapters",
    "重新练习 / 再次录制说课": "speaking.html#new",
    "发起新说课演练 / 上传视频": "speaking.html#new",
}


def strip_tags(html):
    return re.sub(r"<[^>]+>", " ", html)


def text_of(inner):
    return re.sub(r"\s+", " ", strip_tags(inner)).strip()


def rewrite_images(html):
    def repl(m):
        tag = m.group(0)
        alt = re.search(r'alt="([^"]*)"', tag)
        alt = alt.group(1) if alt else ""
        for key, asset in IMAGE_RULES:
            if key in alt:
                return re.sub(r'src="[^"]*"', 'src="../assets/img/%s"' % asset, tag)
        return tag
    return re.sub(r"<img\b[^>]*>", repl, html)


def rewrite_links(html):
    def repl(m):
        whole, attrs, inner = m.group(0), m.group(1), m.group(2)
        if 'href="#"' not in attrs:
            return whole
        label = text_of(inner)
        for key, target in LINK_RULES.items():
            if key in label:
                attrs = attrs.replace('href="#"', 'href="%s"' % target)
                return "<a%s>%s</a>" % (attrs, inner)
        return whole
    return re.sub(r"<a\b([^>]*)>(.*?)</a>", repl, html, flags=re.S)


def add_data_href(html):
    def repl(m):
        tag, inner = m.group(0), m.group(2)
        label = text_of(inner)
        for key, target in DATA_HREF_RULES.items():
            if key in label and "data-href" not in tag:
                return tag.replace("<button", '<button data-href="%s"' % target, 1)
        return tag
    return re.sub(r"<button\b([^>]*)>(.*?)</button>", repl, html, flags=re.S)


def migrate(src_key, filename, page_key, title, description):
    raw = open(os.path.join(SRC, src_key, "code.html"), encoding="utf-8").read()

    body_attrs = re.search(r"<body([^>]*)>", raw).group(1)
    body_class = re.search(r'class="([^"]*)"', body_attrs)
    body_class = body_class.group(1) if body_class else ""

    inner = raw.split("<body", 1)[1].split(">", 1)[1].rsplit("</body>", 1)[0]
    inner = re.sub(r"<header\b.*?</header>", "", inner, flags=re.S)
    inner = re.sub(r"<footer\b.*?</footer>", "", inner, flags=re.S)
    # 去掉原页的内联脚本，脚本已迁移至 assets/js/pages/
    inner = re.sub(r"<script\b(?![^>]*src=)[^>]*>.*?</script>", "", inner, flags=re.S)
    # 去掉原页的 tailwind CDN 相关 head 之外残留（如有）
    inner = rewrite_images(inner)
    inner = rewrite_links(inner)
    inner = add_data_href(inner)
    inner = inner.strip()

    html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{description}" />
  <title>{title} · 第三只眼</title>
  <link rel="icon" type="image/svg+xml" href="../assets/img/favicon.svg" />
  <link rel="stylesheet" href="../assets/css/app.css" />
</head>
<body class="{body_class}" data-root=".." data-page="{page_key}">
{inner}
  <script src="../assets/js/ui.js"></script>
  <script src="../assets/js/layout.js"></script>
  <script src="../assets/js/pages/{js_name}.js"></script>
</body>
</html>
""".format(description=description, title=title, body_class=body_class,
           page_key=page_key, inner=inner, js_name=filename.replace(".html", ""))

    out = os.path.join(DST, "pages", filename)
    open(out, "w", encoding="utf-8").write(html)
    print("written", out, len(html))


for key, meta in PAGES.items():
    migrate(key, *meta)
