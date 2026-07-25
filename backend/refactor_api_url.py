import os
import re

directory = "c:/Users/phuac/Desktop/PROYECTOS/KARDEX ALMACEN V3 WEB/frontend/src"
url_pattern = re.compile(r"'http://localhost:8000([^']*)'")
url_pattern_backtick = re.compile(r"http://localhost:8000([^]*)")

for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.jsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = url_pattern.sub(r"${import.meta.env.VITE_API_URL || 'http://localhost:8000'}\1", content)
            new_content = url_pattern_backtick.sub(r"\1", new_content)
            
            if new_content != content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Refactored URL in {filename}")

print("Refactored frontend URLs successfully")
