import os
import re

directory = "c:/Users/phuac/Desktop/PROYECTOS/KARDEX ALMACEN V3 WEB/frontend/src"
render_url = "https://kardex-api-backend.onrender.com"

for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.jsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            # Replace localhost fallback with Render production URL
            content = content.replace("'http://localhost:8000'", f"'{render_url}'")
            
            # Fix the missing setIsLoading in Login.jsx
            if filename == "Login.jsx":
                if "setIsLoading(false)" in content and "const [isLoading" not in content:
                    content = content.replace("setIsLoading(false)", "")
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"Hardcoded production URL in {filename}")

