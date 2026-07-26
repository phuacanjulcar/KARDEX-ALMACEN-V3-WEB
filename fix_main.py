import os

filepath = "c:/Users/phuac/Desktop/PROYECTOS/KARDEX ALMACEN V3 WEB/frontend/src/main.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'http://localhost:8000/login'", "'https://kardex-api-backend.onrender.com/login'")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
