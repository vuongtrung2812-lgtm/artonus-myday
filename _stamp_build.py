#!/usr/bin/env python3
"""
Stamp this page with a build id, and write the same id into build.txt.

    python3 _stamp_build.py            # stamp, using the content's own hash
    python3 _stamp_build.py --check    # verify the two agree; write nothing

WHY THIS EXISTS
    The page asks build.txt whether it is out of date. If the two ever disagree by accident,
    every phone reloads for ever, or none of them ever reloads. Neither is something to find
    out on a technician's phone mid-service, so they are written together, by this, and never
    by hand.

WHY THE ID IS A HASH, NOT A DATE OR A COUNTER
    A hash of the page's own content cannot be forgotten. Re-running this after a change
    always produces a new id, and re-running it with nothing changed always produces the same
    one — so a stray run cannot make every phone in the salon reload for no reason. A counter
    has to be remembered; a date changes when nothing did.

    The BUILD line is blanked before hashing, or the hash would be an input to itself.

RUN IT BEFORE EVERY PUSH of index.html. `_verify_live.py` refuses to accept a deploy whose
served page does not carry the id in build.txt, which is the check that would have caught the
2026-08-15 stale-page morning.
"""
import hashlib
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = os.path.join(HERE, 'index.html')
STAMP = os.path.join(HERE, 'build.txt')
LINE = re.compile(r"^var BUILD = '([^']*)';", re.M)


def read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def build_id(html):
    """The id of this page's content, with the stamp line itself taken out of the input."""
    neutral = LINE.sub("var BUILD = '';", html)
    return hashlib.sha256(neutral.encode('utf-8')).hexdigest()[:12]


html = read(PAGE)
found = LINE.search(html)
if not found:
    sys.exit("index.html has no `var BUILD = '...';` line to stamp. Put it back.")

want = build_id(html)
have = found.group(1)
on_disk = read(STAMP).strip() if os.path.exists(STAMP) else ''

if '--check' in sys.argv:
    problems = []
    if have != want:
        problems.append('index.html is stamped %r but its content hashes to %r' % (have, want))
    if on_disk != want:
        problems.append('build.txt says %r, the page hashes to %r' % (on_disk, want))
    if problems:
        print('  STALE STAMP:')
        for p in problems:
            print('    ' + p)
        print('  run: python3 _stamp_build.py')
        sys.exit(1)
    print('  build %s — page and build.txt agree' % want)
    sys.exit(0)

if have == want and on_disk == want:
    print('  build %s — already stamped, nothing to do' % want)
    sys.exit(0)

with open(PAGE, 'w', encoding='utf-8') as fh:
    fh.write(LINE.sub("var BUILD = '%s';" % want, html, count=1))
with open(STAMP, 'w', encoding='utf-8') as fh:
    fh.write(want + '\n')
print('  build %s  (was %s)' % (want, have or 'unstamped'))
