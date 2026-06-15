"""恢复 allDataRef 为简单的 useRef(initialData)，搜索直接使用 list"""
import re, os
BASE = r"d:\Codebuddy_space\信佰监理服务管理系统\src\pages"
for root, dirs, files in os.walk(BASE):
    for f in files:
        if not f.endswith('.tsx'): continue
        fp = os.path.join(root, f)
        with open(fp, 'r', encoding='utf-8') as fh: C = fh.read()
        if 'allDataRef' not in C or 'usePersistedState' not in C: continue
        o = C
        # Remove broken IIFE that regex may have created
        # Pattern: useRef<X[]>(() => { try { ...
        C = re.sub(r'const allDataRef = useRef<[^>]+>\(\(\) => \{[^}]*\{[^}]*\}\s*catch[^}]*\}\(\)\)', '', C)
        if C == o: continue  # no IIFE to fix
        
        # Find the state var name and initial data
        sv = re.search(r"const \[(\w+), \w+\] = usePersistedState<([^>]+)>\('[^']+', (\w+)\)", C)
        if not sv: continue
        lv, tp, init = sv.group(1), sv.group(2), sv.group(3)
        
        # Re-add simple allDataRef
        new_ref = f'const allDataRef = useRef<{tp}>({init})'
        C = re.sub(r'(const \[\w+, \w+\] = usePersistedState<[^>]+>\([^)]+\))', r'\1\n  ' + new_ref, C)
        
        # Change search to use list instead of allDataRef
        # Find handleSearch and change allDataRef.current.filter to just list-based
        # Actually, use current list for search:
        C = re.sub(r'allDataRef\.current\.filter\(', f'{lv}.filter(', C)
        
        with open(fp, 'w', encoding='utf-8') as fh: fh.write(C)
        print(os.path.relpath(fp, BASE))
print("Done")
