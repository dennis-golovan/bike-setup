import html
import json
import re
import sys
import time
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import fox_tables

INDEX = 'https://tech.ridefox.com/bike/list/owners-manuals'
FIRST_YEAR = 2016

FORK_DAMPERS = {
    'FIT4': {'label': 'FIT4', 'adjusters': ['LSR', 'LSC'], 'maxClicks': {'LSC': 22}},
    'RC2': {'label': 'FIT HSC/LSC (RC2)', 'adjusters': ['LSR', 'LSC', 'HSC']},
    'GRIP': {'label': 'GRIP', 'adjusters': ['LSR']},
    'GRIP_SL': {'label': 'GRIP SL', 'adjusters': ['LSR']},
    'GRIP2': {'label': 'GRIP2', 'adjusters': ['LSR', 'HSR', 'LSC', 'HSC'], 'maxClicks': {'HSC': 16}},
    'GRIP_X': {'label': 'GRIP X', 'adjusters': ['LSR', 'LSC', 'HSC']},
    'GRIP_X2': {'label': 'GRIP X2', 'adjusters': ['LSR', 'HSR', 'LSC', 'HSC']},
}
SPRINGS = {
    'FLOAT': 'FLOAT',
    'FLOAT_EBIKE': 'FLOAT E-Bike+',
    'RHYTHM': 'Rhythm',
    'RHYTHM_EBIKE': 'Rhythm E-Bike+',
    'TALAS': 'TALAS',
}
SHOCKS = {
    'FLOAT X2': {'adjusters': ['LSR', 'HSR', 'LSC', 'HSC']},
    'DHX2': {'adjusters': ['LSR', 'HSR', 'LSC', 'HSC']},
    'DHX': {'adjusters': ['LSR']},
    'VAN': {'adjusters': ['LSR']},
    'FLOAT X': {'adjusters': ['LSR']},
    'FLOAT DPX2': {'adjusters': ['LSR']},
    'FLOAT DPS': {'adjusters': ['LSR']},
    'FLOAT SL': {'adjusters': ['LSR']},
}


def fetch(url, cache):
    path = cache / (re.sub(r'[^A-Za-z0-9]+', '_', url)[-120:] + '.html')
    if not path.exists():
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (bike-setup catalog builder)'})
        path.write_bytes(urllib.request.urlopen(req, timeout=60).read())
        time.sleep(1)
    return path


def clean(text):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', text))).strip()


def manuals(cache):
    page = fetch(INDEX, cache).read_text(encoding='utf-8', errors='replace')
    result = []
    for href, label in sorted(set(re.findall(r'href="([^"]*owners-manuals/\d+/[^"]+)"[^>]*>(.*?)</a>', page, re.S))):
        name = clean(label)
        low = name.lower()
        year = int(re.search(r'(20\d\d)', name).group(1)) if re.search(r'(20\d\d)', name) else 0
        if year < FIRST_YEAR or 'live valve' in low or 'speed-ped' in low:
            continue
        is_fork = low.startswith('fork') and re.search(r'\b3[68](mm|sl)', low)
        is_shock = low.startswith('shock') and any(k in low for k in ['x2', 'float x', 'dhx', 'dpx2', 'dps', 'coil', 'float sl'])
        if is_fork or is_shock:
            result.append({'year': year, 'name': name, 'url': 'https://tech.ridefox.com/' + href.lstrip('/'), 'fork': bool(is_fork)})
    return result


def to_int(text):
    m = re.search(r'\d+', text or '')
    return int(m.group(0)) if m else None


def range_of(text):
    t = (text or '').strip().replace('–', '-')
    if not t:
        return None
    if t.startswith('<'):
        return [None, to_int(t)]
    if t.startswith('>'):
        return [to_int(t), None]
    m = re.match(r'^(\d+)\s*\+$', t)
    if m:
        return [int(m.group(1)), None]
    m = re.match(r'^(\d+)\s*-\s*(open)$', t, re.I)
    if m:
        return [int(m.group(1)), None]
    m = re.match(r'^(\d+)(?:\s*psi)?\s*-\s*(\d+)', t)
    if m:
        return [int(m.group(1)), int(m.group(2))]
    n = to_int(t)
    return [n, n] if n is not None else None


def spring_of(label):
    low = label.lower()
    ebike = 'e-bike' in low or 'e-opt' in low
    if 'talas' in low:
        return ['TALAS']
    if 'rhythm' in low and 'float' in low:
        return ['FLOAT', 'RHYTHM'] if not ebike else ['FLOAT_EBIKE']
    if 'float and e-bike' in low or 'float/e-bike' in low or 'float/ e-bike' in low:
        return ['FLOAT', 'FLOAT_EBIKE']
    if 'rhythm' in low:
        return ['RHYTHM_EBIKE' if ebike else 'RHYTHM']
    if ebike:
        return ['FLOAT_EBIKE']
    if 'float' in low:
        return ['FLOAT']
    return []


def damper_of(label):
    low = label.lower().replace('/', ' ')
    rules = [('grip x2', 'GRIP_X2'), ('grip x', 'GRIP_X'), ('grip2', 'GRIP2'), ('grip sl', 'GRIP_SL'), ('fit hsc', 'RC2'),
             ('grip rc2', 'GRIP+RC2'), ('fit4', 'FIT4'), ('grip', 'GRIP')]
    for key, value in rules:
        if key in low:
            return value.split('+')
    return []


def family_of(title, page_fork_names):
    t = title.lower()
    if '36sl' in t:
        return ['36SL']
    found = [f for f in ('36', '38') if re.search(rf'\b{f}(mm)?\b', t) or t.startswith(f)]
    return found or page_fork_names


DATA_CELL = re.compile(r'^[<>]?\s*\d+(?:\.\d+)?(?:\s*[-–]\s*\d+)?\s*(?:\+|mm|psi|lbs|"|in)?(?:\s*\(.*\))?(?:\s*stroke)?$', re.I)


def is_data_row(row):
    first = row[0]['t'] if row else ''
    return bool(row) and len({c['t'] for c in row}) > 1 and bool(DATA_CELL.match(first.split('/')[0].strip()))


def header_rows(grid):
    rows = []
    for row in grid:
        if is_data_row(row):
            break
        rows.append(row)
    return rows


def data_rows(grid):
    return [row for row in grid if is_data_row(row)]


def column_labels(grid):
    heads = header_rows(grid)[1:] or header_rows(grid)
    width = max(len(r) for r in grid)
    labels = []
    for i in range(width):
        parts = []
        for r in heads:
            if i < len(r) and r[i]['t'] not in parts:
                parts.append(r[i]['t'])
        labels.append(' '.join(parts))
    return labels


def kg_range(row, labels):
    for i, label in enumerate(labels):
        if 'kg' in label.lower():
            return range_of(row[i]['t'])
    return None


def parse_fork(manual, tables, text):
    names = ['36SL'] if '36sl' in manual['name'].lower() else [f for f in ('36', '38') if f + 'mm' in manual['name'].lower()]
    forks = {name: {'springs': {}, 'dampers': {}} for name in names}
    sag = None
    for t in tables:
        grid = t['grid']
        title = grid[0][0]['t'] if grid and grid[0] else ''
        labels = column_labels(grid)
        if 'Sag Measurements' in title:
            sag = [to_int(x) for x in re.findall(r'(\d+)%', ' '.join(labels))]
            continue
        if 'Spacer' in title:
            if 'speed-ped' in title.lower():
                continue
            fams = family_of(title, names)
            for spring in spring_of(title.replace('Rhythm', 'RHYTHM')) or ['FLOAT']:
                rows = []
                for row in data_rows(grid):
                    vals = [c['t'] for c in row]
                    if '(' in vals[0]:
                        continue
                    if len(vals) == 3:
                        rows.append({'travelMm': to_int(vals[0]), 'factory': to_int(vals[1]), 'max': to_int(vals[2])})
                    elif len(vals) >= 5:
                        rows.append({'travelMm': to_int(vals[0]), 'factory': None,
                                     'factoryNote': f'10cc: {vals[1]}, 5cc: {vals[2]}', 'max': to_int(vals[3])})
                for fam in fams:
                    forks.setdefault(fam, {'springs': {}, 'dampers': {}})['springs'].setdefault(spring, {})['tokens'] = rows
            continue
        joined = ' '.join(labels)
        if 'Rider Weight' in joined and 'Rebound' not in joined and not damper_of(joined):
            fams = family_of(title, names)
            groups = spring_of(title) if 'Air Pressure' in joined else None
            for i, label in enumerate(labels):
                springs = groups if groups else spring_of(label)
                if not springs or 'bar' in label.lower() and 'psi' not in label.lower() or (groups and '(psi)' not in label):
                    continue
                rows = []
                for row in data_rows(grid):
                    kg = kg_range(row, labels)
                    psi = range_of(row[i]['t'])
                    if kg and psi:
                        rows.append({'kg': kg, 'psi': psi})
                for fam in fams:
                    for spring in springs:
                        forks.setdefault(fam, {'springs': {}, 'dampers': {}})['springs'].setdefault(spring, {})['pressureByWeight'] = rows
            continue
        if damper_of(joined) or 'Rebound' in title:
            by_weight = 'Rider Weight' in joined
            keys = [i for i, l in enumerate(labels) if ('kg' in l.lower()) or ('pressure' in l.lower() and 'psi' in l.lower())]
            for i, label in enumerate(labels):
                if i in keys or 'lbs' in label.lower():
                    continue
                dampers = damper_of(label) or damper_of(' '.join(c['t'] for c in grid[0][i:i + 1]))
                adjuster = 'HSR' if label.strip().endswith('HSR') else 'LSR'
                for key in keys if not by_weight else [keys[0]]:
                    spring_keys = spring_of(labels[key]) if not by_weight else [None]
                    rows = []
                    for row in data_rows(grid):
                        key_range = range_of(row[key]['t'])
                        value = range_of(row[i]['t'])
                        if key_range and value:
                            rows.append({'kg' if by_weight else 'psi': key_range, adjuster: value})
                    for damper in dampers:
                        for fam in names:
                            d = forks[fam]['dampers'].setdefault(damper, {})
                            table_key = 'reboundByWeight' if by_weight else 'reboundByPressure'
                            target = d.setdefault(table_key, {}) if not by_weight else d
                            if by_weight:
                                merge(target.setdefault('reboundByWeight', []), rows, 'kg')
                            else:
                                for sk in spring_keys or ['FLOAT']:
                                    merge(target.setdefault(sk, []), rows, 'psi')
    starts = compression_starts(text, manual['year'])
    for fam, data in forks.items():
        for damper_id, start in starts.items():
            if damper_id in data['dampers'] or damper_id in ('GRIP2', 'GRIP_X', 'GRIP_X2', 'RC2', 'FIT4'):
                data['dampers'].setdefault(damper_id, {})['compressionStart'] = start
    return forks, sag


def merge(existing, rows, key):
    if not existing:
        existing.extend(rows)
        return
    by_key = {json.dumps(r[key]): r for r in existing}
    for r in rows:
        by_key.setdefault(json.dumps(r[key]), {key: r[key]}).update({k: v for k, v in r.items() if k != key})
    existing[:] = list(by_key.values())


def compression_starts(text, year):
    starts = {}
    sections = {
        'GRIP_X2': r'Adjusting Grip X2 Compression',
        'GRIP_X': r'Adjusting Grip X Compression',
        'GRIP2': r'GRIP2 Compression Adjusters',
        'RC2': r'Factory Series HSC/LSC Compression Adjusters',
        'FIT4': r'FIT4 Compression Adjusters',
    }
    for damper, pattern in sections.items():
        for m in re.finditer(pattern, text, re.I):
            found = section_start(text, m)
            if found:
                starts[damper] = found
                break
    return starts


def section_start(text, m):
    if True:
        seg = text[m.end(): m.end() + 1400]
        nxt = re.search(r'Adjusting [A-Z]|Performance (?:Elite )?(?:Series )?LSC|Remote Installation', seg[20:])
        seg = seg[: 20 + nxt.start()] if nxt else seg
        each = re.search(r'(\d+) clicks each for High-speed and Low-speed', seg) or \
            re.search(r'High-speed and Low-speed compression set (\d+) clicks', seg)
        hs = re.search(r'(\d+) clicks for High-speed', seg) or re.search(r'High-speed compression set (\d+) clicks', seg)
        ls = re.search(r'(\d+) clicks for Low-speed', seg) or re.search(r'Low-speed compression set (\d+) clicks', seg)
        om = re.search(r'Open mode adjust set to (\d+) clicks', seg, re.I)
        if each:
            return {'HSC': int(each.group(1)), 'LSC': int(each.group(1))}
        if hs and ls:
            return {'HSC': int(hs.group(1)), 'LSC': int(ls.group(1))}
        if om:
            return {'LSC': int(om.group(1))}
    return None


def parse_shock(manual, tables):
    name = manual['name'].upper()
    if 'FLOAT X2' in name:
        families = ['FLOAT X2']
    elif 'ALL COIL' in name:
        families = ['DHX2', 'VAN'] if 'VAN' in name else ['DHX2', 'DHX']
    elif re.search(r'\bDHX2\b', name):
        families = ['DHX2']
    elif re.search(r'\bDHX\b', name):
        families = ['DHX']
    else:
        families = [f for f in ['FLOAT DPS', 'FLOAT DPX2', 'FLOAT X', 'FLOAT SL']
                    if re.search(rf'\b{f.split()[1]}\b', name)]
    sag = None
    damping = None
    for t in tables:
        grid = t['grid']
        title = grid[0][0]['t'] if grid and grid[0] else ''
        labels = column_labels(grid) if 'Sag' in title else [c['t'] for c in grid[0]]
        if 'Sag Measurements' in title:
            sag = [to_int(x) for x in re.findall(r'(\d+)%', ' '.join(labels))]
        elif labels and labels[0].lower() in ('air pressure', 'sring rate', 'spring rate'):
            key = 'psi' if 'pressure' in labels[0].lower() else 'springLbs'
            rows = []
            for row in data_rows(grid):
                r = {key: range_of(row[0]['t'])}
                for i, label in enumerate(labels[1:], start=1):
                    r[label.strip()] = range_of(row[i]['t'])
                rows.append(r)
            damping = {'by': key, 'rows': rows}
    return families, sag, damping


def build(cache):
    models = []
    for m in manuals(cache):
        raw = fetch(m['url'], cache).read_text(encoding='utf-8', errors='replace')
        tables = fox_tables.parse_html(raw)
        text = clean(re.sub(r'<table.*?</table>', ' ', raw, flags=re.S))
        if m['fork']:
            forks, sag = parse_fork(m, tables, text)
            for fam, data in forks.items():
                dampers = []
                for did, d in data['dampers'].items():
                    meta = FORK_DAMPERS[did]
                    dampers.append({'id': did, 'label': meta['label'], 'adjusters': meta['adjusters'],
                                    'maxClicks': meta.get('maxClicks', {}), **d})
                springs = [{'id': sid, 'label': SPRINGS[sid], **s} for sid, s in data['springs'].items()]
                models.append({'id': f'fox-{fam.lower()}-{m["year"]}', 'brand': 'Fox', 'family': fam, 'kind': 'FORK',
                               'year': m['year'], 'source': m['url'],
                               'sag': {'min': min(sag), 'max': max(sag)} if sag else None,
                               'springs': springs, 'dampers': sorted(dampers, key=lambda d: list(FORK_DAMPERS).index(d['id']))})
        else:
            families, sag, damping = parse_shock(m, tables)
            for fam in families:
                models.append({'id': f'fox-{fam.lower().replace(" ", "-")}-{m["year"]}', 'brand': 'Fox', 'family': fam,
                               'kind': 'SHOCK', 'year': m['year'], 'source': m['url'],
                               'sag': {'min': min(sag), 'max': max(sag)} if sag else None,
                               'springs': [],
                               'dampers': [{'id': 'STANDARD', 'label': fam, 'adjusters': SHOCKS[fam]['adjusters'], 'maxClicks': {},
                                            **({'damping': damping} if damping and (fam == 'FLOAT X2' or (fam == 'DHX2' and damping['by'] == 'springLbs')) else {})}]})
    return models


if __name__ == '__main__':
    cache = Path(sys.argv[1])
    out = Path(sys.argv[2])
    cache.mkdir(parents=True, exist_ok=True)
    models = sorted(build(cache), key=lambda m: (m['kind'], m['family'], m['year']))
    out.write_text(json.dumps({'schema': 1, 'brand': 'Fox', 'models': models}, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(len(models), 'models')
