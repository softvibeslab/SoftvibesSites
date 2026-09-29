"""Behavior checks using isolated in-memory databases, never real opportunities."""
import json
import sqlite3
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import pipeline as p


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.row_factory = sqlite3.Row
        self.db.execute('PRAGMA foreign_keys=ON')
        self.db.executescript(p.SCHEMA)
        self.addCleanup(self.db.close)

    def item(self, identifier='one', **overrides):
        return dict(platform='workana', external_id=identifier, title='Same project title',
                    client='Anonymous', posting='An actual problem description', **overrides)

    def add(self, identifier='one'):
        return p.ingest(self.db, self.item(identifier))[0]['key']

    def event(self, key, stage, day=1, event_id=None):
        return p.record(self.db, key, dict(event_id=event_id or f'{key}-{stage}-{day}',
                        stage=stage, occurred_at=f'2026-01-{day:02}T10:00:00-05:00',
                        evidence='Isolated fixture: human reported this fact'))

    def test_reimport_does_not_duplicate_or_reset_events(self):
        key = self.add()
        self.event(key, 'sent')
        p.ingest(self.db, self.item())
        self.assertEqual(p.summary(self.db)['opportunities'], 1)
        self.assertEqual(p.summary(self.db)['confirmed_stages']['sent'], 1)
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM snapshots').fetchone()[0], 1)

    def test_distinct_ids_keep_same_title_and_client_separate(self):
        self.assertNotEqual(self.add('one'), self.add('two'))
        self.assertEqual(p.summary(self.db)['opportunities'], 2)

    def test_url_tracking_dedup_preserves_identity_query(self):
        base = self.item()
        base.pop('external_id')
        a = dict(base, url='https://example.com/job?id=1&utm_source=search')
        b = dict(base, url='https://example.com/job?id=1#body')
        c = dict(base, url='https://example.com/job?id=2')
        self.assertEqual(p.opportunity(a)[0], p.opportunity(b)[0])
        self.assertNotEqual(p.opportunity(a)[0], p.opportunity(c)[0])

    def test_identity_change_rejected_and_import_transaction_rolls_back(self):
        original = self.item(url='https://example.com/job/one')
        p.ingest(self.db, original)
        self.db.commit()
        conflicting = dict(original, external_id='changed')
        with self.assertRaises(ValueError), self.db:
            p.ingest(self.db, [self.item('two'), conflicting])
        self.assertEqual(p.summary(self.db)['opportunities'], 1)

    def test_unavailable_keeps_archive_and_never_expires(self):
        key = self.add()
        self.event(key, 'sent')
        unavailable = self.item(retrieval='unavailable')
        unavailable.pop('posting')
        p.ingest(self.db, unavailable)
        row = p.row_for(self.db, key)
        self.assertTrue(json.loads(row['payload'])['posting'])
        self.assertEqual(row['retrieval'], 'unavailable')
        self.assertEqual(p.listing(self.db, 5)['rows'][0]['stage'], 'sent')
        self.assertEqual(p.summary(self.db)['confirmed_stages']['expired'], 0)

    def test_changed_posting_invalidates_score_and_preserves_snapshot(self):
        key = self.add()
        self.db.execute('UPDATE opportunities SET evaluation=? WHERE key=?', ('{"score":4}', key))
        changed = self.item()
        changed['posting'] = 'Changed project requirements'
        p.ingest(self.db, changed)
        self.assertIsNone(p.row_for(self.db, key)['evaluation'])
        self.assertEqual(self.db.execute('SELECT COUNT(*) FROM snapshots').fetchone()[0], 2)

    def test_unknowns_do_not_score_and_blockers_veto(self):
        data = dict(answers=['yes'] * 4 + ['unknown'], reasons=['Source evidence'] * 5,
                    next_action='Clarify budget')
        result = p.score(data)
        self.assertEqual((result['score'], result['unknown'], result['verdict']), (4, 1, 'prioritize'))
        self.assertEqual(p.score(dict(data, blockers=['Mexico explicitly excluded']))['verdict'], 'discard')
        self.assertEqual(p.score(dict(data, answers=['unknown'] * 5))['verdict'], 'needs_info')

    def test_events_idempotent_and_conflicts_rejected(self):
        key = self.add()
        self.assertTrue(self.event(key, 'sent', event_id='same')['recorded'])
        self.assertFalse(self.event(key, 'sent', event_id='same')['recorded'])
        with self.assertRaises(ValueError):
            self.event(key, 'replied', event_id='same')

    def test_summary_uses_history_and_excludes_drafts(self):
        a, b = self.add('a'), self.add('b')
        self.event(a, 'drafted')
        self.event(b, 'drafted')
        self.assertIsNone(p.summary(self.db)['reply_rate_among_sent'])
        self.event(a, 'sent', 2)
        self.event(a, 'replied', 3)
        self.event(a, 'lost', 4)
        result = p.summary(self.db)
        self.assertEqual(result['confirmed_stages']['drafted'], 2)
        self.assertEqual(result['reply_rate_among_sent'], 1)
        self.assertEqual(p.listing(self.db, 10)['rows'][0]['stage'], 'lost')

    def test_partial_history_does_not_invent_stages(self):
        key = self.add()
        self.event(key, 'audit_paid')
        result = p.summary(self.db)
        self.assertEqual(result['confirmed_stages']['call'], 0)
        self.assertEqual(result['outcomes_without_recorded_send'], 1)
        self.assertIsNone(result['audit_paid_rate_among_sent'])

    def test_late_recording_uses_event_date_and_draft_does_not_regress(self):
        key = self.add()
        self.event(key, 'replied', 3)
        self.event(key, 'sent', 2)
        self.event(key, 'drafted', 4)
        self.assertEqual(p.listing(self.db, 5)['rows'][0]['stage'], 'replied')

    def test_cli_persists_across_processes_and_init_is_idempotent(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            profile = root / 'source_jobs/squad/profile-canonical.yaml'
            profile.parent.mkdir(parents=True)
            profile.write_text('identity: {}\n', encoding='utf-8')

            def run(*args):
                process = subprocess.run([sys.executable, str(Path(p.__file__)), '--root',
                                          str(root), *args], capture_output=True, text=True)
                self.assertEqual(process.returncode, 0, process.stderr)
                return json.loads(process.stdout)

            run('init')
            source = root / 'input.json'
            source.write_text(json.dumps(self.item()), encoding='utf-8')
            key = run('import', '--file', str(source))[0]['key']
            run('init')
            self.assertEqual(run('summary')['opportunities'], 1)
            self.assertEqual(run('show', key)['payload']['posting'], self.item()['posting'])
            source.write_text(json.dumps(dict(event_id='cli-send', stage='sent',
                                              occurred_at='2026-01-01T10:00:00-05:00',
                                              evidence='Isolated test confirmation')), encoding='utf-8')
            run('record', key, '--file', str(source))
            self.assertFalse(run('record', key, '--file', str(source))['recorded'])
            self.assertEqual(run('summary')['confirmed_stages']['sent'], 1)
            self.assertEqual(run('list')['rows'][0]['stage'], 'sent')


if __name__ == '__main__':
    unittest.main()
