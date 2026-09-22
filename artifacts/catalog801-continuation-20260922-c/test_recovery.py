import importlib.util
from pathlib import Path
import unittest
import json
import tempfile
from contextlib import closing

spec=importlib.util.spec_from_file_location('recovery',Path(__file__).with_name('recovery.py'))
recovery=importlib.util.module_from_spec(spec)
spec.loader.exec_module(recovery)

class RecoveryTests(unittest.TestCase):
    def test_admission_delay_reads_ledger_without_changing_it(self):
        import sqlite3
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'ledger.sqlite'
            with closing(sqlite3.connect(path)) as db:
                db.executescript("CREATE TABLE meta(name TEXT,value REAL); CREATE TABLE calls(state TEXT); INSERT INTO meta VALUES ('last_time',100),('next_start',102),('active_until',0),('stopped',0);")
            before=path.read_bytes()
            self.assertAlmostEqual(recovery.admission_delay(path,101),1.05)
            self.assertEqual(recovery.admission_delay(path,103),0)
            self.assertEqual(path.read_bytes(),before)
            with self.assertRaisesRegex(ValueError,'clock-rewind'):
                recovery.admission_delay(path,99)
            with closing(sqlite3.connect(path)) as db:
                db.execute("INSERT INTO calls VALUES ('pending')");db.commit()
            with self.assertRaisesRegex(ValueError,'pending-or-uncertain'):
                recovery.admission_delay(path,103)

    def test_admission_delay_preserves_stop_and_lease(self):
        import sqlite3
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'ledger.sqlite'
            with closing(sqlite3.connect(path)) as db:
                db.executescript("CREATE TABLE meta(name TEXT,value REAL); CREATE TABLE calls(state TEXT); INSERT INTO meta VALUES ('last_time',100),('next_start',102),('active_until',130),('stopped',0);")
            with self.assertRaisesRegex(ValueError,'busy'):recovery.admission_delay(path,101)
            with closing(sqlite3.connect(path)) as db:
                db.execute("UPDATE meta SET value=1 WHERE name='stopped'");db.commit()
            with self.assertRaisesRegex(ValueError,'accounting-stop'):recovery.admission_delay(path,140)

    def exercise(self, responses):
        called=[];saved=[]
        def judge(req):
            called.append(req)
            return responses[len(called)-1]
        outcome=recovery.execute_request({'request_id':'original','snapshot_id':'frozen','items':[]},judge,lambda req,out:saved.append((req,out)))
        return outcome,called,saved

    def test_valid_abstention_does_not_retry(self):
        outcome,calls,saved=self.exercise([{'status':'ok','results':{'x':{'status':'abstain'}}}])
        self.assertEqual(outcome,'complete');self.assertEqual(len(calls),1);self.assertEqual(len(saved),1)

    def test_malformed_distribution_gets_one_recorded_retry(self):
        outcome,calls,saved=self.exercise([{'status':'unavailable','reason':'distribution-sum','request_digest':'bound','snapshot_id':'frozen','model_calls_this_invocation':1},{'status':'ok'}])
        self.assertEqual(outcome,'complete');self.assertEqual(len(saved),2)
        self.assertEqual(calls[1]['request_id'],'original-retry-1')
        self.assertEqual(calls[1]['snapshot_id'],'frozen')

    def test_repeated_malformed_output_is_quarantined_not_looped(self):
        bad={'status':'unavailable','reason':'distribution-sum','request_digest':'bound','snapshot_id':'frozen','model_calls_this_invocation':1}
        outcome,calls,saved=self.exercise([bad,bad])
        self.assertEqual(outcome,'quarantined');self.assertEqual(len(calls),2)

    def test_argmax_is_retried_once_without_accepting_or_repairing_invalid_label(self):
        bad={'status':'unavailable','reason':'argmax','request_digest':'bound','snapshot_id':'frozen','model_calls_this_invocation':1}
        outcome,calls,saved=self.exercise([bad,{'status':'ok'}])
        self.assertEqual(outcome,'complete');self.assertEqual(len(calls),2)
        self.assertEqual(saved[0][1],bad)
        outcome,calls,saved=self.exercise([bad,bad])
        self.assertEqual(outcome,'quarantined');self.assertEqual(len(calls),2)
        sum_bad=dict(bad,reason='distribution-sum')
        outcome,calls,saved=self.exercise([sum_bad,bad])
        self.assertEqual(outcome,'quarantined');self.assertEqual(len(calls),2)

    def test_limits_uncertainty_and_other_failures_stop_without_retry(self):
        for reason in ['daily-budget','context-call-limit','paced','busy','transport-uncertain','settlement-uncertain','returned-model','distribution-keys']:
            outcome,calls,saved=self.exercise([{'status':'unavailable','reason':reason}])
            self.assertEqual(outcome,'stop');self.assertEqual(len(calls),1)

    def test_unbound_distribution_error_is_not_retryable(self):
        outcome,calls,saved=self.exercise([{'status':'unavailable','reason':'distribution-sum'}])
        self.assertEqual(outcome,'stop');self.assertEqual(len(calls),1)

    def test_persistence_failure_prevents_retry(self):
        calls=[]
        def judge(req):
            calls.append(req)
            return {'status':'unavailable','reason':'distribution-sum','request_digest':'bound','snapshot_id':'frozen','model_calls_this_invocation':1}
        def fail(*args):raise OSError('disk full')
        with self.assertRaises(OSError):recovery.execute_request({'request_id':'original','snapshot_id':'frozen'},judge,fail)
        self.assertEqual(len(calls),1)

    def test_retry_refusal_cannot_rewind_original_attempt_progress(self):
        original={'status':'unavailable','reason':'distribution-sum','model_calls_this_invocation':1}
        self.assertEqual(recovery.next_unattempted(50,original),51)
        self.assertEqual(recovery.next_unattempted(50,{'status':'unavailable','reason':'context-call-limit'}),50)
        self.assertEqual(recovery.next_unattempted(50,{'status':'ok','replayed':True,'model_calls_this_invocation':0}),51)

    def test_saved_receipt_replay_never_dispatches_and_rejects_changed_binding(self):
        request={'request_id':'one','snapshot_id':'frozen'}
        out={'status':'ok','request_digest':'bound'}
        calls=[]
        def dispatch(req):calls.append(req);return out
        with tempfile.TemporaryDirectory() as folder:
            path=Path(folder)/'one.json'
            self.assertEqual(recovery.judge_or_replay(request,path,'bound',dispatch),(out,False))
            record={**request,'result':{'content':[{'type':'text','text':json.dumps(out)}]}}
            path.write_text(json.dumps(record),encoding='utf-8')
            before=path.read_bytes()
            self.assertEqual(recovery.judge_or_replay(request,path,'bound',dispatch),(out,True))
            self.assertEqual(len(calls),1)
            self.assertEqual(path.read_bytes(),before)
            for changed in [{'request_id':'two','snapshot_id':'frozen'},{'request_id':'one','snapshot_id':'changed'}]:
                with self.assertRaises(AssertionError):recovery.judge_or_replay(changed,path,'bound',dispatch)
            with self.assertRaises(AssertionError):recovery.judge_or_replay(request,path,'foreign',dispatch)
            path.write_text('{broken',encoding='utf-8')
            with self.assertRaises(ValueError):recovery.judge_or_replay(request,path,'bound',dispatch)
            self.assertEqual(len(calls),1)

if __name__=='__main__':unittest.main()
