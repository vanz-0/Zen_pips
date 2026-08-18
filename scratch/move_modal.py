import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Match the modal block
match = re.search(r'(\s*{/\* Broker Detail Modal \*/}\s*<AnimatePresence>.*?</AnimatePresence>\n)', content, re.DOTALL)
if match:
    modal_code = match.group(1)
    # Remove it from the original location
    content = content.replace(modal_code, '\n')
    
    # Insert it before <ProfileSetupPopup />
    content = content.replace('<ProfileSetupPopup />', modal_code + '\n      <ProfileSetupPopup />')
    
    with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully moved modal!")
else:
    print("Modal block not found")
