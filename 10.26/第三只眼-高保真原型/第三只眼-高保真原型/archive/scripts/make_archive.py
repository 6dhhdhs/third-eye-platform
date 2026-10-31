# -*- coding: utf-8 -*-
"""归档脚本：把未采用的 Stitch 备选稿整理到 archive/originals/。

只保留视觉结构，统一接入本地样式与「归档」提示条，
便于答辩时对照说明「为什么选这一版」。
"""
import os
import re

SRC = r"D:/我做的/智能教育平台开发/第三只眼/_stitch_raw/stitch_"
DST = r"D:/我做的/智能教育平台开发/第三只眼/stitch_/archive/originals"

VARIANTS = [
    ("_3", "home-alt-1.html", "首页备选方案 A",
     "首页的另一种信息组织方式：以能力仪表盘为主视觉。"),
    ("_5", "home-alt-2.html", "首页备选方案 B",
     "首页的另一种视觉方向：更强调品牌叙事与留白。"),
    ("_4", "observe-workbench-alt.html", "观察台备选方案",
     "观察工作台的早期布局：单列证据流，未分栏。"),
    ("ai_2", "speaking-report-alt.html", "说课报告备选方案",
     "说课报告的早期布局：以雷达图为主，证据列表靠后。"),
]

IMAGE_RULES = [
    ("Logo", "favicon.svg"),
    ("Profile", "avatar.svg"),
    ("林思齐", "avatar.svg"),
    ("A modern university classroom", "course-observation.svg"),
    ("A preservice teacher standing", "course-competition.svg"),
    ("An organized desk", "course-lesson-plan.svg"),
    ("课堂观察实验室", "course-observation.svg"),
    ("师范技能竞赛", "course-competition.svg"),
    ("教学设计案头", "course-lesson-plan.svg"),
    ("岳阳楼记", "poster-classroom.svg"),
    ("说课现场回放", "poster-speaking.svg"),
]

BANNER = """  <div class="border-b border-outline-variant/60 bg-secondary-container/60">
    <div class="mx-auto flex w-full max-w-[1240px] flex-wrap items-center justify-between gap-3 px-margin-mobile py-2.5 lg:px-margin">
      <p class="flex items-center gap-2 font-label-sm text-label-sm text-on-secondary-container">
        <span class="material-symbols-outlined text-[18px]">inventory_2</span>
        <span><strong class="font-semibold">设计归档</strong> · Stitch 原始备选方案，仅作对照，不是现行版本。</span>
      </p>
      <div class="flex items-center gap-2">
        <a href="../../index.html" class="rounded-lg px-2.5 py-1 font-label-sm text-label-sm text-on-secondary-container underline-offset-2 hover:underline">原型总览</a>
        <a href="../../pages/home.html" class="rounded-lg bg-primary px-2.5 py-1 font-label-sm text-label-sm text-on-primary">查看现行版本</a>
      </div>
    </div>
  </div>
"""


def rewrite_images(html, prefix):
    def repl(m):
        tag = m.group(0)
        alt = re.search(r'alt="([^"]*)"', tag)
        alt = alt.group(1) if alt else ""
        for key, asset in IMAGE_RULES:
            if key in alt:
                return re.sub(r'src="[^"]*"', 'src="%sassets/img/%s"' % (prefix, asset), tag)
        return tag
    return re.sub(r"<img\b[^>]*>", repl, html)


def migrate(key, filename, title, description):
    raw = open(os.path.join(SRC, key, "code.html"), encoding="utf-8").read()
    body_attrs = re.search(r"<body([^>]*)>", raw).group(1)
    body_class = re.search(r'class="([^"]*)"', body_attrs)
    body_class = body_class.group(1) if body_class else ""

    inner = raw.split("<body", 1)[1].split(">", 1)[1].rsplit("</body>", 1)[0]
    inner = re.sub(r"<header\b.*?</header>", "", inner, flags=re.S)
    inner = re.sub(r"<footer\b.*?</footer>", "", inner, flags=re.S)
    inner = re.sub(r"<script\b(?![^>]*src=)[^>]*>.*?</script>", "", inner, flags=re.S)
    inner = rewrite_images(inner, "../../")
    # 归档稿不承担导航职责，把页内死链统一指向现行页面，避免点击无反应
    inner = inner.replace('href="#"', 'href="../../pages/home.html"')
    inner = inner.strip()

    html = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="{description}（设计归档）" />
  <meta name="robots" content="noindex" />
  <title>{title} · 设计归档 · 第三只眼</title>
  <link rel="icon" type="image/svg+xml" href="../../assets/img/favicon.svg" />
  <link rel="stylesheet" href="../../assets/css/app.css" />
</head>
<body class="{body_class}" data-root="../.." data-page="archive" data-layout="bare">
{banner}
{inner}
</body>
</html>
""".format(description=description, title=title, body_class=body_class,
           banner=BANNER, inner=inner)

    out = os.path.join(DST, filename)
    open(out, "w", encoding="utf-8").write(html)
    print("written", out, len(html))


os.makedirs(DST, exist_ok=True)
for v in VARIANTS:
    migrate(*v)
