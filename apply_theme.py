import os
import glob
import re

files_to_process = [
    'src/app/page.tsx',
    'src/components/ui/trading-terminal.tsx'
] + glob.glob('src/components/dashboard/*.tsx')

replacements = {
    r'(?<=[\s"\'`])text-white(?=[\s"\'`])': 'text-[var(--foreground)]',
    r'(?<=[\s"\'`])hover:text-white(?=[\s"\'`])': 'hover:text-[var(--foreground)]',
    r'(?<=[\s"\'`])text-gray-300(?=[\s"\'`])': 'text-[var(--text-muted)]',
    r'(?<=[\s"\'`])text-gray-400(?=[\s"\'`])': 'text-[var(--text-muted)]',
    r'(?<=[\s"\'`])text-gray-500(?=[\s"\'`])': 'text-[var(--text-muted)]',
    r'(?<=[\s"\'`])text-gray-600(?=[\s"\'`])': 'text-[var(--text-muted)]',
    r'(?<=[\s"\'`])text-gray-700(?=[\s"\'`])': 'text-[var(--text-muted)]',
    r'(?<=[\s"\'`])bg-\[\#0a0a0a\](?=[\s"\'`])': 'bg-[var(--panel-bg)]',
    r'(?<=[\s"\'`])bg-\[\#[01][0db11][0db11]\](?=[\s"\'`])': 'bg-[var(--sub-panel-bg)]', 
    r'(?<=[\s"\'`])bg-\[\#0d0d0d\](?=[\s"\'`])': 'bg-[var(--sub-panel-bg)]',
    r'(?<=[\s"\'`])bg-\[\#141414\](?=[\s"\'`])': 'bg-[var(--sub-panel-bg)]',
    r'(?<=[\s"\'`])bg-\[\#1f1f1f\](?=[\s"\'`])': 'bg-[var(--panel-bg)]',
    r'(?<=[\s"\'`])bg-\[\#111\](?=[\s"\'`])': 'bg-[var(--sub-panel-bg)]',
    r'(?<=[\s"\'`])border-white/5(?=[\s"\'`])': 'border-[var(--border-color)]',
    r'(?<=[\s"\'`])border-white/3(?=[\s"\'`])': 'border-[var(--border-color)]',
    r'(?<=[\s"\'`])border-white/10(?=[\s"\'`])': 'border-[var(--border-color)]',
    r'(?<=[\s"\'`])bg-white/\[0\.03\](?=[\s"\'`])': 'bg-[var(--sub-panel-bg)]',
    r'(?<=[\s"\'`])bg-white/\[0\.02\](?=[\s"\'`])': 'bg-[var(--sub-panel-bg)]',
    r'(?<=[\s"\'`])bg-white/5(?=[\s"\'`])': 'bg-[var(--panel-bg)]',
    r'(?<=[\s"\'`])bg-white/3(?=[\s"\'`])': 'bg-[var(--sub-panel-bg)]',
    r'(?<=[\s"\'`])hover:bg-white/\[0\.08\](?=[\s"\'`])': 'hover:bg-[var(--border-color)]',
    r'(?<=[\s"\'`])hover:bg-white/10(?=[\s"\'`])': 'hover:bg-[var(--border-color)]',
    r'(?<=[\s"\'`])hover:bg-white/3(?=[\s"\'`])': 'hover:bg-[var(--border-color)]',
    r'(?<=[\s"\'`])text-green-400(?=[\s"\'`])': 'text-[var(--color-success)]',
    r'(?<=[\s"\'`])text-red-400(?=[\s"\'`])': 'text-[var(--color-danger)]',
    r'(?<=[\s"\'`])text-blue-400(?=[\s"\'`])': 'text-[var(--color-info)]',
    r'(?<=[\s"\'`])text-orange-400(?=[\s"\'`])': 'text-[var(--color-warning)]',
    r'(?<=[\s"\'`])text-\[\#00ff88\](?=[\s"\'`])': 'text-[var(--color-success)]',
    r'(?<=[\s"\'`])text-\[\#000000\](?=[\s"\'`])': 'text-[var(--text-strong)]',
}

def process_file(filepath):
    print("Processing " + filepath)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for pattern, repl in replacements.items():
        content = re.sub(pattern, repl, content)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for filepath in files_to_process:
    if os.path.exists(filepath):
        process_file(filepath)
    else:
        print("Not found: " + filepath)
