"""Quick edge-case harness for the backend engine (run from backend/)."""
import sys
sys.path.insert(0, ".")

from services.transit_engine import process_transit_query

CASES = [
    # Happy paths
    "Fare from Safoora to Tower",
    "CP 6 to Hawksbay Sheraz bus",
    "safora to tower",
    "Malir Halt to Dolmen Mall",
    "Safoora se Tower tak kitna kiraya hai",
    "Mujhay malir cantt se ned jana hai mai kesai ja skti",
    # Edge cases
    "Tower to Tower",
    "kharadar to kharadar",
    "Tower to Malir Halt",
    "Safoora to Star Gate",
    "Blahblah to Tower",
    "Tower to Xyzabc",
    "xyz to abc",
    "Tower",
    "from Safoora",
    # Info queries
    "List all Sheraz Coach stops",
    "list ev1 stops",
    "Sheraz Coach timings",
    "EV-1 kab tak chalti hai",
    "hello",
    "shukriya",
    "help",
    "asdkjhqwe zzz",
]

for q in CASES:
    try:
        r = process_transit_query(q)
        card = r.get("journey_card") or {}
        clar = r.get("clarify")
        clars = f" [clarify:{clar['field']} → {' | '.join(clar['options'][:2])}]" if clar else ""
        print(f"✓ \"{q}\"")
        print(f"    status={card.get('status')} route={card.get('primary_route_name')} fare={card.get('estimated_fare')}{clars}")
        print(f"    reply: {(r.get('response') or '')[:110]}")
    except Exception as e:
        import traceback
        print(f"✗ \"{q}\" → CRASH: {e}")
        traceback.print_exc()

print("\nDone.")
