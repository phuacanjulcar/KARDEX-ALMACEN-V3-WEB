import os
import re

directory = "c:/Users/phuac/Desktop/PROYECTOS/KARDEX ALMACEN V3 WEB/frontend/src"
for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.jsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Let's fix the broken double injection
            # Look for: (import.meta.env.VITE_API_URL || '') + '
            bad_pattern = r"\(import\.meta\.env\.VITE_API_URL \|\| '\$\{import\.meta\.env\.VITE_API_URL \|\| 'http://localhost:8000'\}'\) \+ '"
            good_pattern = r"\$\{import.meta.env.VITE_API_URL || 'http://localhost:8000'\}"
            
            # actually let's just do a smarter replace.
            # I'll just replace the specific bad strings
            content = content.replace("(import.meta.env.VITE_API_URL || '') + '", "${import.meta.env.VITE_API_URL || 'http://localhost:8000'}")
            
            # We also need to change the closing quote if it was a single quote that is now a backtick template
            # Wait, if we change to backtick, we need to close with a backtick at the end of the string.
            # Example: fetch(${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/products') -> syntax error!
            
