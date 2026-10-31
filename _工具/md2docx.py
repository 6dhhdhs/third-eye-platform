# -*- coding: utf-8 -*-
"""
极简 Markdown -> .docx 转换器（零依赖，直接拼 WordprocessingML 再打成 zip）。

为什么手搓：本机 pip 装不了 python-docx（PyPI 被网络阻断），也没装 pandoc，
而 .docx 本质就是一个装着 XML 的 zip，自己拼反而最省事。

支持的 Markdown 子集：
    # / ## / ### / ####   标题
    > 引用                （用于 AI 提问原文）
    ``` 围栏              代码/文件树
    - 列表
    | a | b |            表格（第二行 |---| 作分隔）
    ---                  分隔线
    其余                 正文段落
行内 **加粗** 支持。

用法：python md2docx.py <in.md> <out.docx>
"""
import io
import re
import sys
import zipfile

NS = ('xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
      'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"')


def esc(s):
    return (s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def runs(text):
    """把一行文本转成若干个 w:r，处理 **加粗**。

    注意：这里不要用 `rpr += A if cond else B` —— 那会解析成
    `rpr += (A if cond else B)`，在 else 分支上把已拼好的 rpr 再追加一遍，
    生成重复的 <w:rPr> 导致 Word 报"标签不匹配"。老老实实写 if。
    """
    out = []
    for i, seg in enumerate(re.split(r'\*\*', text)):
        if not seg:
            continue
        rpr = '<w:rPr>'
        if i % 2 == 1:          # 奇数段是被 ** 包起来的部分
            rpr += '<w:b/>'
        rpr += '</w:rPr>'
        out.append('<w:r>%s<w:t xml:space="preserve">%s</w:t></w:r>' % (rpr, esc(seg)))
    return ''.join(out) or '<w:r><w:t/></w:r>'


def para(text, style=None, align=None):
    ppr = '<w:pPr>'
    if style:
        ppr += '<w:pStyle w:val="%s"/>' % style
    if align:
        ppr += '<w:jc w:val="%s"/>' % align
    ppr += '</w:pPr>'
    return '<w:p>%s%s</w:p>' % (ppr, runs(text))


def code_para(text):
    """代码块段落：等宽字体 + 浅底纹 + 不换行缩进。"""
    ppr = ('<w:pPr><w:pStyle w:val="CodeBlock"/>'
           '<w:shd w:val="clear" w:color="auto" w:fill="F5F7FA"/>'
           '<w:spacing w:before="0" w:after="0" w:line="240" w:lineRule="auto"/></w:pPr>')
    r = ('<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas" w:eastAsia="宋体"/>'
         '<w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">%s</w:t></w:r>' % esc(text))
    return '<w:p>%s%s</w:p>' % (ppr, r)


def table(rows):
    ncol = max(len(r) for r in rows)
    grid = ''.join('<w:gridCol w:w="%d"/>' % (9000 // ncol) for _ in range(ncol))
    borders = ('<w:tblBorders>'
               + ''.join('<w:%s w:val="single" w:sz="4" w:space="0" w:color="BFCBD6"/>' % s
                         for s in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'))
               + '</w:tblBorders>')
    xml = ['<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/>%s</w:tblPr>'
           '<w:tblGrid>%s</w:tblGrid>' % (borders, grid)]
    for ri, row in enumerate(rows):
        cells = []
        for ci in range(ncol):
            txt = row[ci] if ci < len(row) else ''
            # 表头行加浅底纹。<w:shd> 在 pPr 里合法，<w:rFonts> 不合法（那是 rPr 的东西），别放进来
            shade = '<w:shd w:val="clear" w:color="auto" w:fill="EDF3F8"/>' if ri == 0 else ''
            ppr = '<w:pPr>%s<w:spacing w:before="30" w:after="30"/></w:pPr>' % shade
            tcpr = '<w:tcPr>%s<w:vAlign w:val="center"/></w:tcPr>' % shade
            cells.append('<w:tc>%s<w:p>%s%s</w:p></w:tc>' % (tcpr, ppr, runs(txt)))
        xml.append('<w:tr>%s</w:tr>' % ''.join(cells))
    xml.append('</w:tbl>')
    # Word 要求表格后必须跟一个空段落
    xml.append('<w:p/>')
    return ''.join(xml)


def parse(md):
    body = []
    lines = md.split('\n')
    i = 0
    while i < len(lines):
        ln = lines[i]
        s = ln.strip()

        if s.startswith('```'):
            i += 1
            buf = []
            while i < len(lines) and not lines[i].strip().startswith('```'):
                buf.append(lines[i])
                i += 1
            i += 1
            if buf:
                body.append(code_para(' ' + buf[0]))
                for extra in buf[1:]:
                    body.append(code_para(' ' + extra))
                body.append('<w:p><w:pPr><w:spacing w:after="0"/></w:pPr></w:p>')
            continue

        if s.startswith('|') and i + 1 < len(lines) and re.match(r'^\|[\s:|-]+\|$', lines[i + 1].strip()):
            rows = []
            hdr = [c.strip() for c in s.strip('|').split('|')]
            rows.append(hdr)
            i += 2
            while i < len(lines) and lines[i].strip().startswith('|'):
                rows.append([c.strip() for c in lines[i].strip().strip('|').split('|')])
                i += 1
            body.append(table(rows))
            continue

        if re.match(r'^-{3,}$', s):
            body.append('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" '
                        'w:space="1" w:color="BFCBD6"/></w:pBdr></w:pPr></w:p>')
            i += 1
            continue

        m = re.match(r'^(#{1,4})\s+(.*)$', s)
        if m:
            lvl = len(m.group(1))
            body.append(para(m.group(2), style='Heading%d' % lvl))
            i += 1
            continue

        if s.startswith('> '):
            buf = []
            while i < len(lines) and lines[i].strip().startswith('>'):
                buf.append(lines[i].strip()[1:].strip())
                i += 1
            for b in buf:
                body.append(para(b if b else ' ', style='Quote'))
            continue

        if s.startswith('- '):
            while i < len(lines) and lines[i].strip().startswith('- '):
                body.append(para('• ' + lines[i].strip()[2:], style='ListPara'))
                i += 1
            continue

        if not s:
            i += 1
            continue

        body.append(para(s))
        i += 1
    return ''.join(body)


DOC = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
       '<w:document %s><w:body>%s'
       '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>'
       '<w:pgMar w:top="1440" w:right="1247" w:bottom="1440" w:left="1247" '
       'w:header="851" w:footer="992" w:gutter="0"/></w:sectPr>'
       '</w:body></w:document>')


def styles():
    def st(sid, name, sz, bold=False, based='Normal', color=None,
           before=0, after=120, line=320, ppr_extra='', ppr_tail=''):
        """ppr_extra 插在 spacing 之前，ppr_tail 插在 spacing 之后，共同保证 CT_PPr 的元素顺序。"""
        rpr = '<w:rPr><w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:eastAsia="微软雅黑"/>'
        if bold:
            rpr += '<w:b/>'
        if color:
            rpr += '<w:color w:val="%s"/>' % color
        rpr += '<w:sz w:val="%d"/><w:szCs w:val="%d"/></w:rPr>' % (sz, sz)
        return ('<w:style w:type="paragraph" w:styleId="%s"><w:name w:val="%s"/>'
                '<w:basedOn w:val="%s"/><w:qFormat/>'
                '<w:pPr>%s<w:spacing w:before="%d" w:after="%d" w:line="%d" w:lineRule="auto"/>%s</w:pPr>'
                '%s</w:style>' % (sid, name, based, ppr_extra, before, after, line, ppr_tail, rpr))

    normal = ('<w:style w:type="paragraph" w:default="1" w:styleId="Normal">'
              '<w:name w:val="Normal"/><w:qFormat/>'
              '<w:pPr><w:spacing w:before="0" w:after="140" w:line="340" w:lineRule="auto"/></w:pPr>'
              '<w:rPr><w:rFonts w:ascii="Segoe UI" w:hAnsi="Segoe UI" w:eastAsia="宋体"/>'
              '<w:sz w:val="21"/><w:szCs w:val="21"/></w:rPr></w:style>')

    # 引用样式：左侧竖线 + 浅底纹。CT_PPr 要求 pBdr 在 shd 之前、ind 在 spacing 之后，
    # 顺序错了 Word 会判定文档损坏。
    quote_extra = ('<w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="8FAFC8"/></w:pBdr>'
                   '<w:shd w:val="clear" w:color="auto" w:fill="F7FAFC"/>')

    parts = [normal,
             st('Heading1', 'heading 1', 36, True, color='253B4A', before=320, after=180),
             st('Heading2', 'heading 2', 28, True, color='253B4A', before=280, after=140),
             st('Heading3', 'heading 3', 24, True, color='395A73', before=240, after=120),
             st('Heading4', 'heading 4', 22, True, color='526778', before=200, after=100),
             st('Quote', 'Quote', 20, color='3D5566', before=60, after=60, line=300,
                ppr_extra=quote_extra, ppr_tail='<w:ind w:left="240" w:right="120"/>'),
             st('ListPara', 'List Paragraph', 21, based='Normal', before=0, after=60),
             st('CodeBlock', 'Code Block', 18, before=0, after=0, line=240)]

    return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
            '<w:styles %s>%s</w:styles>' % (NS, ''.join(parts)))


CT = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
      '<Default Extension="xml" ContentType="application/xml"/>'
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
      '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
      '</Types>')

RELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
        '</Relationships>')

DRELS = ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
         '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
         '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
         '</Relationships>')


def main():
    src, dst = sys.argv[1], sys.argv[2]
    with io.open(src, encoding='utf-8') as f:
        md = f.read()
    doc = DOC % (NS, parse(md))
    with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr('[Content_Types].xml', CT)
        z.writestr('_rels/.rels', RELS)
        z.writestr('word/_rels/document.xml.rels', DRELS)
        z.writestr('word/styles.xml', styles())
        z.writestr('word/document.xml', doc)
    print('wrote %s' % dst)


if __name__ == '__main__':
    main()
