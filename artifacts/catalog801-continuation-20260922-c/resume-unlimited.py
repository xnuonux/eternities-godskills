"""Resume the undispatched plan after the owner's explicit quota removal."""
import json
import sys
from pathlib import Path
sys.path.insert(0,'C:/Users/Dom/plugins/jev-reflex/scripts')
from reflex import Service
from recovery import main

directory=Path(__file__).resolve().parent
stopped=json.loads((directory/'bulk-status.json').read_text('utf-8'))
assert stopped['stop']=='context-call-limit' and stopped['nextNeverAttemptedIndex']==181
status=Service().status()
assert all(status[k] is None for k in ('daily_limit_microusd','max_daily_calls','max_context_daily_calls'))
assert status['pending_or_uncertain_calls']==0 and not status['accounting_stop']
main(start=181,folder_name='unlimited-receipts',status_name='unlimited-status.json')
