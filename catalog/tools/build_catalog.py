import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import build_fox
import validate

ROOT = Path(__file__).resolve().parent.parent


def main(cache: Path) -> None:
    cache.mkdir(parents=True, exist_ok=True)
    fox = sorted(build_fox.build(cache), key=lambda m: (m['kind'], m['family'], m['year']))
    for model in fox:
        model['yearFrom'] = model['yearTo'] = model.pop('year')
    rockshox = json.loads((ROOT / 'rockshox.json').read_text())['models']
    catalog = {'schema': 1, 'models': fox + rockshox}
    problems = validate.validate(catalog)
    if problems:
        print('\n'.join(problems))
        raise SystemExit(1)
    (ROOT / 'dist' / 'catalog.json').write_text(json.dumps(catalog, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(len(catalog['models']), 'models written')


if __name__ == '__main__':
    main(Path(sys.argv[1]))
