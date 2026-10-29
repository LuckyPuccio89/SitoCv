import re, sys
src = open(sys.argv[1]).read()
tok = re.compile(r'''
    "(?:[^"\\\n]|\\.)*"?      # doppie
  | '(?:[^'\\\n]|\\.)*'?      # singole
  | `(?:[^`\\]|\\.)*`?        # template
  | /(?![*/])(?:[^/\n\\]|\\.)+/[gimsuy]*  # regex: guardia solo all'apertura
  | //[^\n]*                 # commenti
  | /\*(?:[^*]|\*(?!/))*\*/  # blocchi
''', re.VERBOSE)
def repl(m):
    s = m.group(0)
    if s.startswith('//') or s.startswith('/*'): return ''
    return '/R/' if s.startswith('/') else "''"
tmp = tok.sub(repl, src)
st, pairs = [], {')':'(', ']':'[', '}':'{'}
line = 1
for i, ch in enumerate(tmp):
    if ch == '\n': line += 1
    if ch in '([{': st.append((ch, line))
    elif ch in ')]}':
        assert st and st[-1][0] == pairs[ch], f'MISMATCH riga {line}: atteso {pairs[ch]}, stack-top {st[-1] if st else None}'
        st.pop()
assert not st, f'non chiuse: {st}'
print(f'{sys.argv[1]}: OK bilanciato')
