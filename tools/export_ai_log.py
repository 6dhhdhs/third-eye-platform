# -*- coding: utf-8 -*-
"""
从 Claude Code 会话 jsonl 中提取「真人提问 + AI 文字回复」，
用于整理课程作业要求的「AI 对话交互界面」记录。

用法：
    python export_ai_log.py <session.jsonl> <out.md> [--tools]

要点（踩过的坑，见 memory/chat-archive-setup）：
  - jsonl 里 type=user 的条目远不止真人发言：工具结果、压缩摘要、任务通知
    都是 user 条目。只有 origin.kind == 'human'（或 turnOrigin == 'human'）才是真人。
  - 工具输出可能夹带 NUL 等控制字符，会污染输出文件，必须过滤。
  - 一律显式 UTF-8 读写，不依赖控制台编码。
"""
import json
import io
import re
import sys
import os

CTRL = re.compile(r'[\x00-\x08\x0b-\x1f\x7f-\x9f]')


def strip_control(s):
    return CTRL.sub('', s) if s else s


def blocks_to_text(content, want):
    """把 message.content 规整成纯文本；want 取 'human' 或 'assistant'。"""
    if isinstance(content, str):
        return content.strip()
    if not isinstance(content, list):
        return ''
    out = []
    for b in content:
        if not isinstance(b, dict):
            continue
        t = b.get('type')
        if t == 'text':
            out.append(b.get('text', ''))
        elif t == 'tool_use' and want == 'assistant':
            out.append('\x00TOOLUSE\x00' + json.dumps(
                {'name': b.get('name'), 'input': b.get('input')}, ensure_ascii=False))
        elif t == 'tool_result' and want == 'human':
            out.append('\x00TOOLRESULT\x00' + str(b.get('content'))[:400])
    return '\n'.join(x for x in out if x).strip()


def is_human(o):
    if o.get('type') != 'user':
        return False
    if o.get('isCompactSummary'):
        return False
    if (o.get('origin') or {}).get('kind') == 'human':
        return True
    if o.get('turnOrigin') == 'human':
        return True
    return False


def main():
    src = sys.argv[1]
    dst = sys.argv[2]
    with_tools = '--tools' in sys.argv

    turns = []
    with io.open(src, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                o = json.loads(line)
            except Exception:
                continue
            t = o.get('type')
            ts = (o.get('timestamp') or '')[11:19]

            if is_human(o):
                txt = blocks_to_text((o.get('message') or {}).get('content'), 'human')
                if txt:
                    turns.append(('H', ts, txt))
            elif t == 'assistant' and not o.get('isSidechain'):
                txt = blocks_to_text((o.get('message') or {}).get('content'), 'assistant')
                if not txt:
                    continue
                if not with_tools:
                    parts = [p for p in txt.split('\x00TOOLUSE\x00')
                             if p and not p.startswith('{')]
                    txt = '\n'.join(parts).strip()
                    if not txt:
                        continue
                turns.append(('A', ts, txt))

    hi = 0
    with io.open(dst, 'w', encoding='utf-8') as g:
        g.write(u'# AI 对话记录提取\n\n')
        g.write(u'- 来源：`%s`\n' % os.path.basename(src))
        g.write(u'- 真人提问 %d 轮，AI 文字回复 %d 段\n\n---\n\n'
                % (sum(1 for r, _, _ in turns if r == 'H'),
                   sum(1 for r, _, _ in turns if r == 'A')))
        for role, ts, txt in turns:
            if role == 'H':
                hi += 1
                g.write(u'\n## 【提问 %d】 %s\n\n' % (hi, ts))
                g.write(u'```\n%s\n```\n\n' % strip_control(txt))
            else:
                g.write(u'### AI 回复 %s\n\n%s\n\n' % (ts, strip_control(txt)))
    print('wrote %s  (%d turns)' % (dst, len(turns)))


if __name__ == '__main__':
    main()
