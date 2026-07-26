import os
import re

directory = "c:/Users/phuac/Desktop/PROYECTOS/KARDEX ALMACEN V3 WEB/frontend/src"

for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.jsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Clean up the exact bad string:
            bad_str = "(import.meta.env.VITE_API_URL || '')"
            content = content.replace(bad_str, "(import.meta.env.VITE_API_URL || 'http://localhost:8000')")
            
            # Clean up bad template literals
            # from: ${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/recipes//execute
            # Wait, the template literal replacement was:
            # new_content.replace('http://localhost:8000', "${import.meta.env.VITE_API_URL || 'http://localhost:8000'}")
            # which resulted in:
            # fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/recipes//execute,
            # This is actually correct syntax!
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Cleaned {filename}")

