import html, json, re, sys
from html.parser import HTMLParser

class P(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.tables = []; self.stack = []; self.text = []; self.last_heading = ''
        self.cell = None; self.in_heading = False; self.heading_buf = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ('h1', 'h2', 'h3', 'h4', 'strong', 'b') and not self.stack:
            self.in_heading = True; self.heading_buf = []
        if tag == 'table':
            self.stack.append({'rows': [], 'heading': self.last_heading, 'context': ' '.join(self.text[-40:])[-400:]})
        elif tag == 'tr' and self.stack:
            self.stack[-1]['rows'].append([])
        elif tag in ('td', 'th') and self.stack:
            self.cell = {'text': [], 'colspan': int(a.get('colspan', 1) or 1), 'rowspan': int(a.get('rowspan', 1) or 1),
                         'header': tag == 'th' or 'tableheader' in (a.get('class') or '')}
        elif tag == 'br' and self.cell is not None:
            self.cell['text'].append(' ')
    def handle_endtag(self, tag):
        if tag in ('h1', 'h2', 'h3', 'h4', 'strong', 'b') and self.in_heading:
            t = re.sub(r'\s+', ' ', ''.join(self.heading_buf)).strip()
            if t: self.last_heading = t
            self.in_heading = False
        if tag in ('td', 'th') and self.cell is not None and self.stack:
            c = self.cell; c['text'] = re.sub(r'\s+', ' ', ''.join(c['text'])).strip()
            if self.stack[-1]['rows']: self.stack[-1]['rows'][-1].append(c)
            self.cell = None
        elif tag == 'table' and self.stack:
            self.tables.append(self.stack.pop())
    def handle_data(self, data):
        if self.cell is not None: self.cell['text'].append(data)
        elif not self.stack:
            self.text.append(data.strip())
            if self.in_heading: self.heading_buf.append(data)

def grid(rows):
    out = []; pending = {}
    for r, row in enumerate(rows):
        line = []; col = 0; it = iter(row)
        cells = list(row); i = 0
        while i < len(cells) or (r, col) in pending:
            if (r, col) in pending:
                line.append(pending.pop((r, col))); col += 1; continue
            c = cells[i]; i += 1
            for k in range(c['colspan']):
                v = {'t': c['text'], 'h': c['header']}
                line.append(v)
                for dr in range(1, c['rowspan']): pending[(r + dr, col)] = v
                col += 1
        out.append(line)
    return out

def parse(path):
    return parse_html(open(path, encoding='utf-8', errors='replace').read())


def parse_html(raw):
    p = P(); p.feed(raw)
    return [{'heading': t['heading'], 'context': t['context'], 'grid': grid(t['rows'])} for t in p.tables]

if __name__ == '__main__':
    for path in sys.argv[1:]:
        for t in parse(path):
            g = t['grid']
            print(f"{path.split('/')[-1]} | {t['heading'][:60]!r} | {len(g)}x{max((len(r) for r in g), default=0)} | " +
                  ' || '.join(' | '.join(c['t'] for c in row) for row in g[:2])[:220])
