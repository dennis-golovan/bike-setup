ADJUSTERS = {'LSR', 'HSR', 'LSC', 'HSC'}


def low(r):
    return r[0] if r[0] is not None else r[1]


def check_ascending(rows, key, where, problems):
    for a, b in zip(rows, rows[1:]):
        if low(a[key]) is not None and low(b[key]) is not None and low(b[key]) < low(a[key]):
            problems.append(f'{where}: {key} not ascending at {a[key]} -> {b[key]}')


def check_non_increasing(rows, adjuster, where, problems):
    values = [low(r[adjuster]) for r in rows if r.get(adjuster)]
    for a, b in zip(values, values[1:]):
        if a is not None and b is not None and b > a:
            problems.append(f'{where}: {adjuster} grows with load {a} -> {b}')


def validate(catalog):
    problems = []
    ids = set()
    for m in catalog['models']:
        where = m['id']
        if m['id'] in ids:
            problems.append(f'{where}: duplicate id')
        ids.add(m['id'])
        if m['kind'] not in ('FORK', 'SHOCK') or m['yearFrom'] > m['yearTo']:
            problems.append(f'{where}: bad kind or years')
        for s in m['springs']:
            rows = s.get('pressureByWeight', [])
            check_ascending(rows, 'kg', f'{where}/{s["id"]}', problems)
            for a, b in zip(rows, rows[1:]):
                if a['kg'][1] != b['kg'][0]:
                    problems.append(f'{where}/{s["id"]}: weight ranges not contiguous {a["kg"]} {b["kg"]}')
                if b['psi'][0] < a['psi'][0]:
                    problems.append(f'{where}/{s["id"]}: pressure drops with weight {a} {b}')
            for t in s.get('tokens', []):
                if t['factory'] is not None and t['factory'] > t['max']:
                    problems.append(f'{where}/{s["id"]}: factory tokens above max {t}')
        for d in m['dampers']:
            dw = f'{where}/{d["id"]}'
            if not set(d['adjusters']) <= ADJUSTERS:
                problems.append(f'{dw}: unknown adjuster')
            for adj, value in d.get('compressionStart', {}).items():
                if adj not in d['adjusters']:
                    problems.append(f'{dw}: start for missing adjuster {adj}')
                limit = d.get('maxClicks', {}).get(adj)
                if limit is not None and value > limit:
                    problems.append(f'{dw}: start {adj}={value} above max {limit}')
            if 'reboundByWeight' in d:
                rows = d['reboundByWeight']
                check_ascending(rows, 'kg', dw, problems)
                for adj in ('LSR', 'HSR'):
                    if any(adj in r for r in rows) and adj not in d['adjusters']:
                        problems.append(f'{dw}: table has {adj} but damper does not')
                    check_non_increasing(rows, adj, dw, problems)
            for spring, rows in d.get('reboundByPressure', {}).items():
                check_ascending(rows, 'psi', f'{dw}/{spring}', problems)
                for adj in ('LSR', 'HSR'):
                    check_non_increasing(rows, adj, f'{dw}/{spring}', problems)
            if 'damping' in d:
                rows = d['damping']['rows']
                key = d['damping']['by']
                check_ascending(rows, key, dw, problems)
                for adj in ('LSR', 'HSR'):
                    check_non_increasing(rows, adj, dw, problems)
    return problems
