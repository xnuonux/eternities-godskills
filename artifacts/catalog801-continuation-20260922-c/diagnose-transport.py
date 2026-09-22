"""One owner-authorized, never-dispatched batch with secret-free HTTP diagnostics."""
import hashlib,json,os,subprocess,sys,time
from pathlib import Path
from datetime import datetime,timezone

if '--transport' in sys.argv:
    from urllib.request import Request,build_opener,ProxyHandler,HTTPRedirectHandler
    from urllib.error import HTTPError
    class NoRedirect(HTTPRedirectHandler):
        def redirect_request(self,*args,**kwargs):return None
    wire=sys.stdin.buffer.read(16385)
    if len(wire)>16384:raise SystemExit(1)
    try:
        req=Request('https://openrouter.ai/api/alpha/decisions',data=wire,headers={
            'Authorization':'Bearer '+os.environ['OPENROUTER_API_KEY'],'Content-Type':'application/json'})
        with build_opener(NoRedirect(),ProxyHandler({})).open(req,timeout=15) as response:
            data=response.read(131073)
        if len(data)>131072:raise SystemExit(1)
        sys.stdout.buffer.write(data)
    except HTTPError as error:
        print(json.dumps({'httpStatus':error.code}),file=sys.stderr)
        raise SystemExit(1)
    except Exception as error:
        print(json.dumps({'exceptionType':type(error).__name__}),file=sys.stderr)
        raise SystemExit(1)
    raise SystemExit(0)

sys.path.insert(0,'C:/Users/Dom/plugins/jev-reflex/scripts')
from reflex import Service,credential,packed,strict_json,ReflexError
from recovery import admission_delay
directory=Path(__file__).resolve().parent
plan_bytes=(directory.parents[1]/'data/quarry-intake-2026-09-21-catalog801/jev-requests.jsonl').read_bytes()
assert hashlib.sha256(plan_bytes).hexdigest()=='c1274fdcf5a54a023a3415e00bb1e813073251659e85c9a004acb6efb0915edb'
request=json.loads(plan_bytes.decode().splitlines()[752])
path=directory/'unlimited-receipts'/(request['request_id']+'.json')
assert not path.exists(),'Never replace a saved attempt'
diagnostics={}
def transport(wire):
    env=dict(os.environ,OPENROUTER_API_KEY=credential())
    run=subprocess.run([sys.executable,str(Path(__file__)),'--transport'],input=packed(wire).encode(),
        stdout=subprocess.PIPE,stderr=subprocess.PIPE,env=env,timeout=20,creationflags=subprocess.CREATE_NO_WINDOW)
    if run.returncode:
        if run.stderr:
            detail=strict_json(run.stderr)
            assert set(detail)<= {'httpStatus','exceptionType'}
            diagnostics.update(detail)
        raise ReflexError('transport')
    return strict_json(run.stdout)
service=Service(transport=transport)
status=service.status()
assert status['status']=='ready' and status['pending_or_uncertain_calls']==0 and not status['accounting_stop']
delay=admission_delay(service.path,time.time())
assert delay<30
if delay:time.sleep(delay)
out=service.judge(**request)
record={'request_id':request['request_id'],'snapshot_id':request['snapshot_id'],'requestIndex':752,
    'receivedAt':datetime.now(timezone.utc).isoformat(),'diagnostics':diagnostics,
    'result':{'content':[{'type':'text','text':json.dumps(out)}],'isError':False}}
with path.open('x',encoding='utf-8') as output:json.dump(record,output,indent=2);output.write('\n')
print(json.dumps({'requestIndex':752,'resultStatus':out['status'],'reason':out.get('reason'),'diagnostics':diagnostics,'modelCalls':out.get('model_calls_this_invocation',0)}))
