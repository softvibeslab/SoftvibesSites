#!/usr/bin/env python3
"""Local, transactional opportunity register. No network or external actions."""
import argparse
import hashlib
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

STAGES = ('drafted', 'sent', 'replied', 'call', 'audit_paid', 'implementation',
          'retainer', 'testimonial', 'lost', 'no_response', 'withdrawn', 'expired')
SCHEMA = """
CREATE TABLE IF NOT EXISTS opportunities (
 key TEXT PRIMARY KEY, platform TEXT NOT NULL, title TEXT NOT NULL,
 payload TEXT NOT NULL, retrieval TEXT NOT NULL, evaluation TEXT,
 first_seen TEXT NOT NULL, last_seen TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS snapshots (
 key TEXT NOT NULL REFERENCES opportunities(key), hash TEXT NOT NULL,
 payload TEXT NOT NULL, captured_at TEXT NOT NULL, PRIMARY KEY(key, hash)
);
CREATE TABLE IF NOT EXISTS events (
 event_id TEXT PRIMARY KEY, key TEXT NOT NULL REFERENCES opportunities(key),
 stage TEXT NOT NULL, occurred_at TEXT NOT NULL, recorded_at TEXT NOT NULL,
 evidence TEXT NOT NULL
);
"""


def now():
    return datetime.now(timezone.utc).isoformat()


def dump(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True)


def read_json(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def required(value, label):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{label} must be a nonempty string')
    return value.strip()


def normalize_url(url):
    parsed = urlsplit(url)
    if parsed.scheme not in ('https', 'http') or not parsed.hostname or parsed.username:
        raise ValueError('url must be a public http(s) reference without credentials')
    query = [(k, v) for k, v in parse_qsl(parsed.query, keep_blank_values=True)
             if not k.lower().startswith('utm_') and k.lower() not in ('fbclid', 'gclid')]
    return urlunsplit((parsed.scheme.lower(), parsed.netloc.lower(),
                       parsed.path.rstrip('/') or '/', urlencode(sorted(query)), ''))


def opportunity(data):
    if not isinstance(data, dict):
        raise ValueError('opportunity must be an object')
    data = dict(data)
    platform = required(data.get('platform'), 'platform').lower()
    if not re.fullmatch('[a-z0-9-]+', platform):
        raise ValueError('platform must contain lowercase letters, digits or hyphens')
    data['platform'] = platform
    data['title'] = required(data.get('title'), 'title')
    retrieval = data.get('retrieval', 'fetched')
    if retrieval not in ('fetched', 'pasted', 'unavailable'):
        raise ValueError('retrieval must be fetched, pasted or unavailable')
    data['retrieval'] = retrieval
    if retrieval != 'unavailable':
        required(data.get('posting'), 'posting')
    if data.get('url'):
        data['url'] = normalize_url(required(data['url'], 'url'))
    external = data.get('external_id')
    if external is not None:
        external = required(external, 'external_id')
        data['external_id'] = external
    identity = ('id:' + external) if external else ('url:' + data['url']) if data.get('url') else None
    if identity is None:
        raise ValueError('provide external_id or a stable posting url')
    key = platform + '-' + hashlib.sha256(identity.encode()).hexdigest()[:24]
    return key, data


def row_for(db, key):
    row = db.execute('SELECT * FROM opportunities WHERE key=?', (key,)).fetchone()
    if row is None:
        raise ValueError(f'unknown opportunity: {key}')
    return row


def score(data):
    if not isinstance(data, dict):
        raise ValueError('evaluation must be an object')
    answers = data.get('answers')
    reasons = data.get('reasons')
    if not isinstance(answers, list) or len(answers) != 5 or any(
            answer not in ('yes', 'no', 'unknown') for answer in answers):
        raise ValueError('answers must contain five yes/no/unknown values')
    if not isinstance(reasons, list) or len(reasons) != 5:
        raise ValueError('provide five supporting reasons')
    for reason in reasons:
        required(reason, 'reason')
    blockers = data.get('blockers', [])
    if not isinstance(blockers, list) or any(not isinstance(x, str) or not x.strip() for x in blockers):
        raise ValueError('blockers must be an array of nonempty strings')
    required(data.get('next_action'), 'next_action')
    total = answers.count('yes')
    unknown = answers.count('unknown')
    verdict = 'discard' if blockers else 'prioritize' if total >= 4 else 'save' if total == 3 else 'needs_info' if unknown else 'discard'
    return dict(data, score=total, unknown=unknown, verdict=verdict, evaluated_at=now())


def ingest(db, items):
    if not isinstance(items, list):
        items = [items]
    validated = [opportunity(item) for item in items]
    result = []
    for key, data in validated:
        old = db.execute('SELECT * FROM opportunities WHERE key=?', (key,)).fetchone()
        previous = json.loads(old['payload']) if old else {}
        # Changing identity conventions must not silently create a duplicate.
        if data.get('url'):
            for other in db.execute('SELECT key, payload FROM opportunities WHERE platform=?', (data['platform'],)):
                if other['key'] != key and json.loads(other['payload']).get('url') == data['url']:
                    raise ValueError(f"url already registered as {other['key']}; reuse its original external_id/url identity")
        stamp = now()
        merged = dict(previous, **data)
        if data['retrieval'] == 'unavailable' and previous.get('posting'):
            merged['posting'] = previous['posting']
        changed = old and {k: v for k, v in previous.items() if k != 'retrieval'} != {k: v for k, v in merged.items() if k != 'retrieval'}
        evaluation = None if changed else old['evaluation'] if old else None
        db.execute('INSERT INTO opportunities VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(key) DO UPDATE SET '
                   'title=excluded.title,payload=excluded.payload,retrieval=excluded.retrieval,'
                   'evaluation=excluded.evaluation,last_seen=excluded.last_seen',
                   (key, data['platform'], merged['title'], dump(merged), data['retrieval'], evaluation,
                    old['first_seen'] if old else stamp, stamp))
        payload = dump(data)
        digest = hashlib.sha256(payload.encode()).hexdigest()
        db.execute('INSERT OR IGNORE INTO snapshots VALUES(?,?,?,?)', (key, digest, payload, stamp))
        result.append({'key': key, 'created': old is None, 'evaluation_invalidated': bool(changed)})
    return result


def record(db, key, data):
    row_for(db, key)
    event_id = required(data.get('event_id'), 'event_id')
    stage = data.get('stage')
    if stage not in STAGES:
        raise ValueError('unknown stage')
    occurred = datetime.fromisoformat(required(data.get('occurred_at'), 'occurred_at').replace('Z', '+00:00'))
    if occurred.tzinfo is None:
        raise ValueError('occurred_at requires timezone, e.g. -05:00')
    occurred = occurred.astimezone(timezone.utc).isoformat()
    if occurred > now():
        raise ValueError('a reported event cannot be in the future')
    evidence = required(data.get('evidence'), 'evidence')
    old = db.execute('SELECT * FROM events WHERE event_id=?', (event_id,)).fetchone()
    if old:
        if (old['key'], old['stage'], old['occurred_at'], old['evidence']) != (key, stage, occurred, evidence):
            raise ValueError('event_id already exists with different content')
        return {'recorded': False, 'event_id': event_id}
    db.execute('INSERT INTO events VALUES(?,?,?,?,?,?)', (event_id, key, stage, occurred, now(), evidence))
    return {'recorded': True, 'event_id': event_id}


def listing(db, limit):
    output = []
    for row in db.execute('SELECT * FROM opportunities ORDER BY first_seen, key'):
        evaluation = json.loads(row['evaluation']) if row['evaluation'] else {}
        payload = json.loads(row['payload'])
        latest = db.execute("SELECT stage, occurred_at FROM events WHERE key=? ORDER BY (stage='drafted'), occurred_at DESC, recorded_at DESC LIMIT 1", (row['key'],)).fetchone()
        output.append({'key': row['key'], 'platform': row['platform'], 'title': row['title'],
                       'url': payload.get('url'), 'retrieval': row['retrieval'],
                       'score': evaluation.get('score'), 'unknown': evaluation.get('unknown'),
                       'verdict': evaluation.get('verdict'), 'next_action': evaluation.get('next_action'),
                       'stage': latest['stage'] if latest else 'new',
                       'last_event_at': latest['occurred_at'] if latest else None})
    output.sort(key=lambda x: (x['stage'] != 'new', x['verdict'] == 'discard',
                                -(x['score'] if x['score'] is not None else -1)))
    return {'total': len(output), 'shown': min(limit, len(output)), 'rows': output[:limit]}


def summary(db):
    sets = {stage: {row[0] for row in db.execute('SELECT DISTINCT key FROM events WHERE stage=?', (stage,))}
            for stage in STAGES}
    sent = sets['sent']
    return {'opportunities': db.execute('SELECT COUNT(*) FROM opportunities').fetchone()[0],
            'confirmed_stages': {stage: len(keys) for stage, keys in sets.items()},
            'reply_rate_among_sent': len(sets['replied'] & sent) / len(sent) if sent else None,
            'audit_paid_rate_among_sent': len(sets['audit_paid'] & sent) / len(sent) if sent else None,
            'outcomes_without_recorded_send': len(set().union(*(sets[s] for s in STAGES if s != 'drafted')) - sent)}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', required=True, type=Path, help='RogerVibes repository root')
    commands = parser.add_subparsers(dest='command', required=True)
    commands.add_parser('init')
    commands.add_parser('summary')
    p = commands.add_parser('list')
    p.add_argument('--limit', type=int, default=10)
    p = commands.add_parser('import')
    p.add_argument('--file', required=True)
    for command in ('show', 'evaluate', 'record'):
        p = commands.add_parser(command)
        p.add_argument('key')
        if command != 'show':
            p.add_argument('--file', required=True)
    args = parser.parse_args()
    root = args.root.expanduser().resolve()
    if not (root / 'source_jobs/squad/profile-canonical.yaml').is_file():
        parser.error('root does not contain the canonical profile')
    folder = root / 'source_jobs/squad/pilot'
    path = folder / 'pipeline.sqlite3'
    if args.command == 'init':
        folder.mkdir(parents=True, exist_ok=True)
        ignore = folder / '.gitignore'
        if not ignore.exists():
            ignore.write_text('*\n!.gitignore\n', encoding='utf-8')
        for name in ('digests', 'opportunities'):
            (folder / name).mkdir(exist_ok=True)
    elif not path.is_file():
        parser.error('pipeline is not initialized; run init')
    try:
        with sqlite3.connect(path) as db:
            db.row_factory = sqlite3.Row
            db.execute('PRAGMA foreign_keys=ON')
            if args.command == 'init':
                db.executescript(SCHEMA)
                result = {'database': str(path), 'initialized': True}
            elif args.command == 'import':
                result = ingest(db, read_json(args.file))
            elif args.command == 'evaluate':
                row = row_for(db, args.key)
                if not json.loads(row['payload']).get('posting'):
                    raise ValueError('cannot evaluate without archived posting text')
                result = score(read_json(args.file))
                db.execute('UPDATE opportunities SET evaluation=? WHERE key=?', (dump(result), args.key))
            elif args.command == 'record':
                result = record(db, args.key, read_json(args.file))
            elif args.command == 'show':
                row = dict(row_for(db, args.key))
                row['payload'] = json.loads(row['payload'])
                row['evaluation'] = json.loads(row['evaluation']) if row['evaluation'] else None
                row['events'] = [dict(r) for r in db.execute('SELECT * FROM events WHERE key=? ORDER BY occurred_at, recorded_at', (args.key,))]
                row['snapshots'] = [dict(r) for r in db.execute('SELECT * FROM snapshots WHERE key=? ORDER BY captured_at', (args.key,))]
                result = row
            elif args.command == 'list':
                if args.limit < 1:
                    raise ValueError('limit must be positive')
                result = listing(db, args.limit)
            else:
                result = summary(db)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (ValueError, TypeError, AttributeError, OSError, sqlite3.Error) as exc:
        parser.exit(1, f'error: {exc}\n')


if __name__ == '__main__':
    main()
