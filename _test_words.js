/* ══════════════════════ THE WORDS TEST ══════════════════════
 *
 * Trung, 17 August: 'the language of the reminder is robotic, again I told you to remove
 * unnecessary sub header, and use 5th grade writing, and be direct, why cant you stop you
 * using litotes? Merlin, lock this shit down do not make the same mistake again, AND I MEAN
 * NEVER LET IT HAPPEN AGAIN.'
 *
 * He had told me before. A promise is not a control — this is. It reads every string either
 * app puts on a screen and fails the build on the four things he has now asked for more than
 * once. Comments are exempt: they are for whoever maintains this, not for the salon.
 */
const fs = require('fs'), path = require('path');
const APPS = path.join(__dirname, '..');
const FILES = ['artonus-myday-web/index.html', 'artonus-client-book/index.html'];

let pass = 0, fail = 0;
const bad = [];
function check(name, fn) {
  let r; try { r = fn(); } catch (e) { r = 'threw: ' + e.message; }
  if (r === true) { pass++; console.log('  PASS  ' + name); }
  else { fail++; console.log('  FAIL  ' + name + '  → ' + r); }
}

/**
 * Comments out, CODE INTACT.
 *
 * The plain `/*` ... `*` `/` strip is wrong on this codebase and it was quietly weakening every
 * check in this file. `accept = 'image/*'` contains the two characters that open a comment, so
 * the stripper treated the rest of the line as comment text and ran to the next real close —
 * swallowing whatever code sat between. It is how a deliberately reintroduced `capture` passed
 * a test written to catch exactly that.
 *
 * A real comment opens at the start of a line or after whitespace or punctuation. Inside
 * `image/*` the slash follows a letter, so requiring that boundary is enough.
 */
function stripComments(src) {
  return src.replace(/(^|[\s;{}()=,])\/\*[\s\S]*?\*\//g, '$1').replace(/^\s*\/\/.*$/gm, '');
}

/* Strings a person actually reads. Comments stripped; class names, ids, selectors and event
   names skipped — they are code that happens to be quoted. */
function copy(file) {
  let src = fs.readFileSync(path.join(APPS, file), 'utf8');
  src = stripComments(src);
  const out = [];
  const push = (t) => {
    if (!/[a-z]{2}\s+[a-z]{2}/i.test(t)) return;          // not a sentence
    /* A selector has selector CHARACTERS in it. This used to skip anything made only of word
       characters and spaces — which is every plain English sentence without punctuation, i.e.
       exactly the headings this file exists to police. It passed a regression I had put in on
       purpose, which is the only reason I found it. */
    if (/[.#\[\]>]/.test(t) && !/[.!?]$/.test(t) && t.split(/\s+/).length <= 4) return;
    if (/^[a-z]+(-[a-z]+)*$/i.test(t)) return;            // one bare token: a class or a key
    if (/^(data-|aria-|http|image\/|text\/|application\/)/.test(t)) return;
    out.push(t);
  };
  (src.match(/'(?:[^'\\\n]|\\.)*'/g) || []).forEach((m) => push(m.slice(1, -1)));
  (src.match(/"(?:[^"\\\n]|\\.)*"/g) || []).forEach((m) => push(m.slice(1, -1)));
  return out;
}
const words = (t) => t.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ')
                      .replace(/\s+/g, ' ').trim();

/* ── 1. NO LITOTES. Saying a thing by denying its opposite. ── */
const LITOTES = [
  /\bnot just\b/i, /\bnot only\b/i, /\bnot merely\b/i, /\bno small\b/i,
  /\bnot un\w+/i, /\bnever without\b/i, /\bnot without\b/i, /\bis not a\b/i,
  /\bare not the\b/i, /\bnothing is more\b/i, /\bnot the only\b/i,
];
check('⭐ no litotes anywhere a person can read it', () => {
  const hits = [];
  FILES.forEach((f) => copy(f).forEach((t) => {
    const w = words(t);
    LITOTES.forEach((re) => { if (re.test(w)) hits.push(f.split('/')[0] + ': ' + w.slice(0, 90)); });
  }));
  return hits.length === 0 || hits.length + ' found — ' + hits.slice(0, 4).join(' | ');
});

/* ── 2. NO EXPLANATORY SUB-HEADER. A heading followed immediately by a paragraph explaining
       the heading. He has asked for this three times. ── */
check('⭐ no heading is followed by a paragraph explaining itself', () => {
  const hits = [];
  FILES.forEach((f) => {
    let src = fs.readFileSync(path.join(APPS, f), 'utf8')
                .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    src = src.replace(/\s*\+\s*/g, '');                    // join concatenated markup
    /* STATIC prose only. A paragraph that carries a live value — an error message, a count,
       a loading line — is the card's CONTENT, not a gloss on its own heading. The smell he
       keeps crossing out is a fixed sentence explaining a fixed heading. */
    /* A dynamic heading is built from a ternary, so allow a longer run between the tags; and
       joining the concatenation leaves a RUN of quote characters, not one. Both of those let
       the exact sentence Trung objected to slip straight through the first version.

       AND THE `s` FLAG. Markup here is built across several lines, so a heading or a
       paragraph regularly contains a newline — and without dotAll the pattern stops dead at
       it. That alone let his sentence through a second time, after I had already widened
       everything else. Both misses were found by putting the real regression back and
       watching the test pass, which is the only way to know a guard guards anything. */
    const re = /<h3>(?:(?!<\/h3>).){3,300}<\/h3>(?:['"\s]{0,8})<p class="(?:lede|hint)"[^>]*>((?:(?!<\/p>).){0,400}?)<\/p>/gs;
    let m; while ((m = re.exec(src))) {
      const body = m[1];
      if (/esc\(|\$\{/.test(body)) continue;                 // a live value, not a gloss

      /* LENGTH, NOT JUDGEMENT. Whether a line is 'necessary' is an argument; whether it is a
         paragraph is a fact. A short line under a heading tells her what to do next and earns
         its place — 'Tap when they sit down.' The ones Trung keeps striking out are the ones
         that go on: the reminder's was twenty-four words explaining a heading that had already
         said it. Sixteen is the line. */
      const n = words(body).split(/\s+/).filter(Boolean).length;
      if (n <= 16) continue;
      hits.push(f.split('/')[0] + ': ' + n + 'w under "'
                + words(m[0]).replace(/^<h3>/, '').split('<')[0].slice(0, 40) + '"');
    }
  });
  return hits.length === 0 || hits.length + ' found — ' + hits.slice(0, 3).join(' | ');
});

/* ── 3. PLAIN WORDS. The ones he has actually crossed out. ── */
const STIFF = {
  'straight away': 'right away', 'at once': 'right away', 'the moment you': 'when you',
  'is recorded': 'is saved', 'append-only': 'nothing is deleted', 'superseded': 'replaced',
  'acknowledge': 'read', 'outstanding': 'still needed', 'per visit': 'this visit',
  'writing up': 'notes', 'reaches ': 'goes ', 'in order to': 'to', 'utilise': 'use',
  'commence': 'start', 'prior to': 'before', 'subsequent': 'next', 'deliberately': '',
  /* A CHAIR IS FURNITURE. Trung had every use of "chair" for a PERSON replaced on 17 August,
     and it came back on 19 August in a fallback string — "Your chair moved to 5:15 PM" —
     because a fallback only shows in the one case nobody tests. He should not have to say it
     a third time.

     "Chair 3" and "in the chair" are about the seat and stay. These are the forms that mean
     a human being. */
  'your chair': 'the client', 'tell the chair': 'tell the technician',
  'ask the chair': 'ask the technician', 'the chair sees': 'the technician sees',
  'the chair will': 'the technician will', 'the chair is waiting': 'the technician is waiting',
  'chair\u2019s phone': 'technician\u2019s phone', "chair's phone": "technician's phone",
};
check('⭐ none of the words he has crossed out have come back', () => {
  const hits = [];
  FILES.forEach((f) => copy(f).forEach((t) => {
    const w = words(t).toLowerCase();
    Object.keys(STIFF).forEach((k) => {
      if (w.indexOf(k) >= 0) hits.push(f.split('/')[0] + ': "' + k + '" in ' + w.slice(0, 70));
    });
  }));
  return hits.length === 0 || hits.length + ' found — ' + hits.slice(0, 4).join(' | ');
});

/* ── 4. SHORT SENTENCES. A screen is read standing up, one-handed, mid-service. ── */
check('⭐ no sentence on a screen runs past 22 words', () => {
  const hits = [];
  FILES.forEach((f) => copy(f).forEach((t) => {
    words(t).split(/(?<=[.!?])\s+/).forEach((sent) => {
      const n = sent.trim().split(/\s+/).filter(Boolean).length;
      if (n > 22) hits.push(f.split('/')[0] + ': ' + n + 'w — ' + sent.slice(0, 80));
    });
  }));
  return hits.length === 0 || hits.length + ' found — ' + hits.slice(0, 3).join(' | ');
});

check('\u2b50 no photo picker forces the camera — the library is always an option', () => {
  /* Trung, 18 August: "Every time we have photo feature you have to let people select from
     the library. Lock this, you keep building this feature and only let me take photo."

     `capture` on a file input forces the lens and HIDES the photo library — on iOS the picker
     opens straight into the camera with no way out. It has been added to this app three times
     now, each time by someone reasoning that a salon photo is taken on the spot. Often it is
     not: it was taken a moment ago between clients, sent by the client, or saved as a
     reference. This is the rule, not a preference, so it is a test and not a comment. */
  const found = [];
  FILES.forEach((file) => {
    /* The real code, comments stripped — the note explaining WHY there is no capture must not
       itself trip the check. */
    const code = stripComments(fs.readFileSync(path.join(APPS, file), 'utf8'));
    const re = /\.capture\s*=|capture\s*=\s*["'](?:camera|environment|user)["']|<input[^>]*\scapture[\s=>]/gi;
    let m;
    while ((m = re.exec(code))) found.push(file.split('/')[0] + ': ' + m[0].trim());
  });
  return found.length ? found.length + ' found - ' + found.join(' | ') : true;
});

check('\u2b50 American spelling, everywhere a person reads it', () => {
  /* Trung, 18 August: "why do you use colour instead of color? I want you to use color, lock
     this." The salon is in New York. The server has said `Color` since the close-out gate was
     written; the British spelling was mine, and I even normalised the American one INTO it,
     which is backwards.

     A rule I have to remember is a rule I will break, so it is a test. */
  const BRITISH = [
    ['colour', 'color'], ['grey', 'gray'], ['favourite', 'favorite'],
    ['behaviour', 'behavior'], ['centre', 'center'], ['organise', 'organize'],
    ['organised', 'organized'], ['realise', 'realize'], ['recognise', 'recognize'],
    ['apologise', 'apologize'], ['licence', 'license'], ['defence', 'defense'],
    ['offence', 'offense'], ['programme', 'program'], ['catalogue', 'catalog'],
    ['jewellery', 'jewelry'],
    /* 'cancelled' and 'travelling' are left off: both are ordinary in American English and
       Merriam-Webster lists them, so failing on them would change live wording nobody asked
       to change. */
  ];
  /* THE SOURCE, not copy(). copy() only keeps strings that look like sentences — it needs a
     space in them — so a one-word button reading "Colour" walked straight through the first
     version of this check. These words appear in no identifier in this codebase, so scanning
     the code directly is both safe and complete. Comments are stripped: the note explaining
     which spelling is wrong must not be the thing that fails. */
  const found = [];
  FILES.forEach((file) => {
    const code = stripComments(fs.readFileSync(path.join(APPS, file), 'utf8'))
      /* READING old data is not writing new words. Photos were labelled while the picker
         briefly said Colour and those rows are still in the book, so the comparison against
         the old spelling has to stay. Only the comparison — it is never shown that way. */
      .replace(/===?\s*['"](?:colour|Colour)['"]/g, '');
    BRITISH.forEach(([wrong, right]) => {
      const m = code.match(new RegExp('\\b' + wrong + '\\b', 'gi'));
      if (m) found.push(file.split('/')[0] + ': "' + m[0] + '" should be "' + right
                        + '" (' + m.length + ')');
    });
  });
  return found.length ? found.length + ' found - ' + found.slice(0, 4).join(' | ') : true;
});

check('\u2b50 every icon a screen asks for actually exists', () => {
  /* THE THIRD TIME THIS HAS SHIPPED. ICON.clock on the desk printed the literal word
     "undefined" in front of every booking tip; ICON.book on the phone printed it in front of
     "Their past visits". A missing icon is not a blank space — the name resolves to undefined
     and JavaScript prints that word straight onto the screen, next to real copy, where it
     looks like a crash. */
  const found = [];
  FILES.forEach((file) => {
    const src = stripComments(fs.readFileSync(path.join(APPS, file), 'utf8'));
    const decl = src.match(/var ICON = \{([\s\S]*?)\n\};/);
    if (!decl) { found.push(file.split('/')[0] + ': no ICON table at all'); return; }
    const have = new Set((decl[1].match(/^\s*([a-z]+)\s*:/gm) || [])
      .map((x) => x.replace(/[^a-z]/g, '')));
    const used = new Set(src.match(/ICON\.([a-zA-Z]+)/g) || []);
    used.forEach((u) => {
      const name = u.slice(5);
      if (!have.has(name)) found.push(file.split('/')[0] + ': ICON.' + name);
    });
  });
  return found.length ? found.length + ' missing - ' + found.join(' | ') : true;
});

console.log('\n  ' + pass + ' passed · ' + fail + ' failed\n');
process.exit(fail ? 1 : 0);
