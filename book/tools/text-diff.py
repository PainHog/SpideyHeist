"""Word-level diff of the rulebook text: original PDF vs new build.
   python3 book/tools/text-diff.py <old.pdf> <new.pdf>
Normalises case, quotes, dashes, ligatures and page furniture, then prints
every non-equal span so each can be checked against book/REVIEW.md."""
import sys, re, difflib, unicodedata, pymupdf

def words(path, skip_pages=()):
    d = pymupdf.open(path)
    out = []
    for i, p in enumerate(d):
        if i + 1 in skip_pages: continue
        t = p.get_text()
        t = unicodedata.normalize("NFKC", t)
        t = re.sub(r"Heisty Spideys — First Edition \d+", " ", t)
        t = re.sub(r"HEISTY SPIDEYS\s*·\s*\d+", " ", t)
        t = t.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
        t = t.replace("−", "-").replace("–", "-").replace("—", " — ")
        t = re.sub(r"(\w)-\n(\w)", r"\1\2", t)
        out += re.findall(r"[\w'\"+\-%./#×½≈~]+|[—:;!?()]", t.lower())
    return out

old = words(sys.argv[1], skip_pages=(2,))   # original TOC (regenerated in the new build)
new = words(sys.argv[2], skip_pages=(2,))   # new TOC
sm = difflib.SequenceMatcher(None, old, new, autojunk=False)
n = 0
for op, a1, a2, b1, b2 in sm.get_opcodes():
    if op == "equal": continue
    n += 1
    ctx = " ".join(old[max(0, a1 - 5):a1])
    print(f"{op:7} …{ctx} [{' '.join(old[a1:a2])}] → [{' '.join(new[b1:b2])}]")
print(f"\n{n} differing spans; {len(old)} words old, {len(new)} words new; ratio {sm.ratio():.4f}")
