#!/usr/bin/env python3
"""
Wait until the LIVE site is serving the build on this Mac, then say so.

    python3 _verify_live.py              # wait up to 3 minutes
    python3 _verify_live.py --once       # look once and report

WHY THIS EXISTS
    On 2026-08-15 a fix was pushed, GitHub reported success, and the fix did not reach the
    phone. Everything I checked said it had shipped: the commit was pushed, the Pages build
    ran, curl fetched the new file. What none of that established is the thing that matters —
    that the page a phone downloads carries the build we just wrote.

    "Pushed" is not "live". Pages takes up to a couple of minutes to publish, and until it
    does, the old file is what the world gets.

WHAT IT PROVES, AND WHAT IT DOES NOT
    It proves the origin now serves this build. It does NOT prove any particular phone is
    running it — a phone can hold its own copy for ten minutes (cache-control: max-age=600),
    which is the whole reason the page checks build.txt for itself.
"""
import os
import re
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
SITE = 'https://myday.artonusnailsroom.com'
DEADLINE = 180


def fetch(path):
    """Always past every cache between here and GitHub: a unique query, and no-cache asked for."""
    url = '%s/%s?cb=%d' % (SITE, path, time.time_ns())
    req = urllib.request.Request(url, headers={'Cache-Control': 'no-cache', 'Pragma': 'no-cache'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode('utf-8', 'replace')


want = open(os.path.join(HERE, 'build.txt'), encoding='utf-8').read().strip()
print('  this Mac is on build %s' % want)

started = time.time()
while True:
    try:
        stamp = fetch('build.txt').strip()
        page = fetch('index.html')
        in_page = re.search(r"var BUILD = '([^']*)';", page)
        in_page = in_page.group(1) if in_page else '(none)'
    except Exception as e:                      # noqa: BLE001 - any failure is just "not yet"
        stamp, in_page = '(unreachable: %s)' % e, '(unreachable)'

    if stamp == want and in_page == want:
        print('  LIVE — build.txt and the served page both say %s' % want)
        print('  Phones update within 3 minutes of opening, or when the app is next opened.')
        sys.exit(0)

    waited = int(time.time() - started)
    print('  not yet (%ds) — live build.txt=%s  page=%s' % (waited, stamp, in_page))
    if '--once' in sys.argv or waited > DEADLINE:
        print('  GIVING UP. The site is NOT serving this build. Do not tell anyone it shipped.')
        sys.exit(1)
    time.sleep(10)
