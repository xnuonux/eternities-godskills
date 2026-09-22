"""Owner-authorized, single-retry recovery for settled malformed distributions only.

Task-local runner, not universal product or a changed shared Jev policy.
Never retries admission refusals, uncertain calls, transport or identity failures.
"""
def retryable(out, request):
    return (out.get('status') == 'unavailable' and out.get('reason') in ('distribution-sum', 'argmax')
        and bool(out.get('request_digest')) and out.get('snapshot_id') == request['snapshot_id']
        and (out.get('model_calls_this_invocation') == 1 or out.get('replayed') is True))

def execute_request(request, judge, persist):
    out = judge(request)
    persist(request, out)
    if out.get('status') == 'ok':
        return 'complete'
    if not retryable(out, request):
        return 'stop'
    retry = dict(request, request_id=request['request_id'] + '-retry-1')
    out = judge(retry)
    persist(retry, out)
    if out.get('status') == 'ok':
        return 'complete'
    return 'quarantined' if retryable(out, retry) else 'stop'

def next_unattempted(index, original_result):
    # A retry's local refusal does not undo the original provider attempt.
    return index+1 if original_result.get('model_calls_this_invocation') or original_result.get('replayed') else index

def judge_or_replay(request, path, bound_digest, dispatch):
    import json
    if not path.exists():
        return dispatch(request), False
    record = json.loads(path.read_text('utf-8'))
    assert record['request_id'] == request['request_id'] and record['snapshot_id'] == request['snapshot_id']
    out = json.loads(record['result']['content'][0]['text'])
    if 'request_digest' in out:
        assert out['request_digest'] == bound_digest
    return out, True

def admission_delay(ledger_path, now):
    """Read scheduling state only; never reserve, clear, or retry a call."""
    import sqlite3
    from contextlib import closing
    with closing(sqlite3.connect(ledger_path.as_uri()+'?mode=ro',uri=True)) as db:
        db.execute('BEGIN')
        meta=dict(db.execute('SELECT name,value FROM meta'))
        pending=db.execute("SELECT COUNT(*) FROM calls WHERE state='pending'").fetchone()[0]
    if meta['stopped']:raise ValueError('accounting-stop')
    if pending:raise ValueError('pending-or-uncertain')
    if now < meta['last_time']:raise ValueError('clock-rewind')
    if now < meta['active_until']:raise ValueError('busy')
    return max(0,meta['next_start']-now+.05) if now < meta['next_start'] else 0

def main(start=28, folder_name='bulk-receipts', status_name='bulk-status.json'):
    import hashlib
    import json
    import math
    import sys
    import time
    from datetime import datetime, timezone
    from pathlib import Path

    sys.path.insert(0, 'C:/Users/Dom/plugins/jev-reflex/scripts')
    from reflex import Service, provider_transport, SNAPSHOT, build
    directory = Path(__file__).resolve().parent
    root = directory.parents[1]
    plan_bytes = (root / 'data/quarry-intake-2026-09-21-catalog801/jev-requests.jsonl').read_bytes()
    assert hashlib.sha256(plan_bytes).hexdigest() == 'c1274fdcf5a54a023a3415e00bb1e813073251659e85c9a004acb6efb0915edb'
    plan = [json.loads(line) for line in plan_bytes.decode().splitlines()]
    assert start in (28, 181) and folder_name in ('bulk-receipts', 'unlimited-receipts')
    assert status_name in ('bulk-status.json', 'unlimited-status.json')
    folder = directory / folder_name
    folder.mkdir(exist_ok=True)
    status_path = directory / status_name
    diagnostics = []

    def observed_transport(wire):
        diagnostics.clear()
        raw = provider_transport(wire)
        if isinstance(raw, dict) and raw.get('model') == SNAPSHOT and raw.get('provider') == 'TypeSafe':
            answers = raw.get('answers')
            if isinstance(answers, dict):
                for i in range(len(wire['questions'])):
                    answer = answers.get(f'q{i}')
                    ps = answer.get('probabilities') if isinstance(answer, dict) else None
                    if isinstance(ps, dict) and ps and all(type(p) in (int, float) and math.isfinite(p) for p in ps.values()):
                        total = math.fsum(ps.values())
                        if abs(total - 1) > 1e-5:
                            diagnostics.append(dict(itemIndex=i, optionCount=len(ps), total=total, deviation=total-1))
                        chosen = answer.get('choice')
                        if chosen in ps and max(ps.values()) - ps[chosen] > 1e-7:
                            diagnostics.append(dict(itemIndex=i, mismatch='argmax', chosenProbability=ps[chosen], maximumProbability=max(ps.values())))
        return raw

    service = Service(transport=observed_transport)
    status = service.status()
    assert status['status'] == 'ready' and status['pending_or_uncertain_calls'] == 0 and not status['accounting_stop']
    totals = dict(originals=0, complete=0, quarantined=0, calls=0, replayed=0, stop=None)
    last = [None]
    original_out = [None]
    index = start

    def path_for(request):
        return folder / (request['request_id'] + '.json')

    def judge(request):
        diagnostics.clear()
        path = path_for(request)
        def dispatch(req):
            time.sleep(2.2)
            try:
                delay=admission_delay(service.path,time.time())
            except ValueError as error:
                return dict(status='unavailable',authority='none',may_execute=False,reason=str(error))
            if delay>30:
                return dict(status='unavailable',authority='none',may_execute=False,reason='admission-delay-excessive')
            if delay:time.sleep(delay)
            # Service remains the atomic authority; a race refusal still stops.
            return service.judge(**req)
        out, replayed = judge_or_replay(request, path, build(**request)[1], dispatch)
        if replayed:
            totals['replayed'] += 1
        else:
            totals['calls'] += out.get('model_calls_this_invocation', 0)
        last[0] = out
        if request['request_id'] == plan[index]['request_id']:
            original_out[0] = out
        return out

    def persist(request, out):
        path = path_for(request)
        if path.exists():
            return
        record = dict(request_id=request['request_id'], snapshot_id=request['snapshot_id'],
            requestIndex=index, receivedAt=datetime.now(timezone.utc).isoformat(),
            diagnostics=list(diagnostics), result=dict(content=[dict(type='text',text=json.dumps(out))],isError=False))
        if request['request_id'] != plan[index]['request_id']:
            record['originalRequestId'] = plan[index]['request_id']
        with path.open('x', encoding='utf-8') as output:
            json.dump(record, output, indent=2, allow_nan=False)
            output.write('\n')

    for index in range(start, len(plan)):
        outcome = execute_request(plan[index], judge, persist)
        totals['originals'] += 1
        if outcome == 'stop':
            totals['stop'] = last[0].get('reason','unexpected-status')
        else:
            totals[outcome] += 1
        next_index = next_unattempted(index, original_out[0])
        checkpoint = dict(totals, lastRequestIndex=index, nextNeverAttemptedIndex=next_index,
            classificationComplete=False, updatedAt=datetime.now(timezone.utc).isoformat())
        temporary = status_path.with_suffix('.tmp')
        temporary.write_text(json.dumps(checkpoint,indent=2)+'\n',encoding='utf-8')
        temporary.replace(status_path)
        if totals['originals'] % 10 == 0 or outcome != 'complete':
            print(json.dumps(checkpoint),flush=True)
        if outcome == 'stop':
            break
    print(json.dumps(dict(final=True,**checkpoint)),flush=True)

if __name__ == '__main__':
    main()
