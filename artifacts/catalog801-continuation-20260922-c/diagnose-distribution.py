"""One owner-authorized diagnostic retry; shared Jev admission remains authoritative."""
import hashlib
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, 'C:/Users/Dom/plugins/jev-reflex/scripts')
from reflex import Service, provider_transport, SNAPSHOT

ROOT = Path(__file__).resolve().parents[2]
plan_bytes = (ROOT / 'data/quarry-intake-2026-09-21-catalog801/jev-requests.jsonl').read_bytes()
assert hashlib.sha256(plan_bytes).hexdigest() == 'c1274fdcf5a54a023a3415e00bb1e813073251659e85c9a004acb6efb0915edb'
original = json.loads(plan_bytes.decode().splitlines()[27])
request = dict(original, request_id=original['request_id'] + '-diagnostic-1')
out_path = Path(__file__).with_name('diagnostic-retry.json')
if out_path.exists():
    raise SystemExit('Existing diagnostic receipt; do not redispatch')
diagnostics = []

def observed_transport(wire):
    raw = provider_transport(wire)
    if isinstance(raw, dict) and raw.get('model') == SNAPSHOT and raw.get('provider') == 'TypeSafe':
        answers = raw.get('answers')
        if isinstance(answers, dict):
            for i in range(len(original['items'])):
                a = answers.get(f'q{i}', {})
                ps = a.get('probabilities') if isinstance(a, dict) else None
                if isinstance(ps, dict) and ps and all(type(p) in (int, float) and math.isfinite(p) for p in ps.values()):
                    total = math.fsum(ps.values())
                    diagnostics.append(dict(itemIndex=i, optionCount=len(ps), total=total,
                        deviation=total-1, minimum=min(ps.values()), maximum=max(ps.values())))
    return raw

service = Service(transport=observed_transport)
status = service.status()
assert status['status'] == 'ready' and status['pending_or_uncertain_calls'] == 0 and not status['accounting_stop']
response = service.judge(**request)
receipt = dict(originalRequestId=original['request_id'], request_id=request['request_id'],
    snapshot_id=request['snapshot_id'], authorization='Owner explicitly requested fix and retry after stopped run',
    receivedAt=datetime.now(timezone.utc).isoformat(), diagnostics=diagnostics,
    result=response, classificationIntegration='none; diagnostic retry is outside frozen request plan')
with out_path.open('x', encoding='utf-8') as output:
    json.dump(receipt, output, indent=2, allow_nan=False)
    output.write('\n')
print(json.dumps(dict(status=response['status'], reason=response.get('reason'), diagnostics=diagnostics,
    accountedMicrousd=response.get('accounted_microusd'), reportedMicrousd=response.get('reported_microusd'),
    replayed=response.get('replayed'), receipt=str(out_path))))
