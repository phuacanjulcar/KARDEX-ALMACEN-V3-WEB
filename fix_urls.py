import os

directory = "c:/Users/phuac/Desktop/PROYECTOS/KARDEX ALMACEN V3 WEB/frontend/src"
for root, _, files in os.walk(directory):
    for filename in files:
        if filename.endswith('.jsx'):
            filepath = os.path.join(root, filename)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                
            new_content = content.replace("'http://localhost:8000", "(import.meta.env.VITE_API_URL || 'http://localhost:8000') + '")
            new_content = new_content.replace('http://localhost:8000', "${import.meta.env.VITE_API_URL || 'http://localhost:8000'}")
            
            # Fix main.jsx logic which we don't want to mess up, so let's revert main.jsx
            if new_content != content and "main.jsx" not in filename:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed {filename}")

