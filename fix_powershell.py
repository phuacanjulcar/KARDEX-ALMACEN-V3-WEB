import os
import re

directory = "c:/Users/phuac/Desktop/PROYECTOS/KARDEX ALMACEN V3 WEB/frontend/src"

for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.jsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Fix all variations that were corrupted by powershell escaping
            # We want to replace ANY URL structure with a clean constant
            
            # Simple trick: just replace the weird corrupted string parts
            content = content.replace("(import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL || 'http://localhost:8000'}')", "(import.meta.env.VITE_API_URL || 'http://localhost:8000')")
            # also if powershell stripped the $ sign:
            content = content.replace("(import.meta.env.VITE_API_URL || '{import.meta.env.VITE_API_URL || 'http://localhost:8000'}')", "(import.meta.env.VITE_API_URL || 'http://localhost:8000')")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Cleaned {filename}")

