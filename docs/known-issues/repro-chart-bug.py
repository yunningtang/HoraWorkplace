"""
Reproduction script for the CherryPy chart service bug.
Run from horosa-skill project: `uv run python repro-chart-bug.py`

Expected: /bazi/birth OK (Java-only), /chart ERR (goes through 8899).
"""
from horosa_skill.engine.client import HorosaApiClient

c = HorosaApiClient("http://127.0.0.1:9999")
params = {
    "date": "1990-06-15",
    "time": "14:30:00",
    "zone": "+08:00",
    "lat": "31n14",
    "lon": "121e28",
    "ad": 1,
}

print("Testing /bazi/birth (pure Java path):")
try:
    r = c.call("/bazi/birth", params)
    print("  OK:", list(r.keys())[:5])
except Exception as e:
    print("  ERR:", e)

print("\nTesting /chart (routes through Python 8899):")
try:
    r = c.call("/chart", {**params, "hsys": 0, "zodiacal": 0, "asporb": 1.0, "predictive": True})
    print("  OK:", list(r.keys())[:5])
except Exception as e:
    print("  ERR:", e)

print("\n-> Check astropy.stderr.log for the real traceback:")
print("   C:\\Users\\<user>\\AppData\\Local\\Horosa\\runtime\\current\\Horosa-Web\\.horosa-local-logs\\<latest>\\astropy.stderr.log")
