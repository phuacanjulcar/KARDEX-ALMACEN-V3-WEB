import os
import re

directory = "c:/Users/phuac/Desktop/PROYECTOS/KARDEX ALMACEN V3 WEB/frontend/src/pages/"
files = [f for f in os.listdir(directory) if f.endswith('.jsx')]

auth_header = r"headers: { 'Authorization': Bearer "
auth_header_comma = r"headers: { 'Authorization': Bearer , "

for filename in files:
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # If it's Login, skip
    if "Login" in filename:
        continue

    # Replaces fetch('url') with fetch('url', { headers: ... })
    content = re.sub(
        r"fetch\('([^']+)'\)", 
        r"fetch('\1', { " + auth_header + r" })", 
        content
    )

    # Replaces fetch(url) with fetch(url, { headers: ... })
    content = re.sub(
        r"fetch\(([^]+)\)", 
        r"fetch(\1, { " + auth_header + r" })", 
        content
    )

    # Replaces fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }
    content = re.sub(
        r"headers:\s*\{\s*'Content-Type':\s*'application/json'\s*\}",
        auth_header_comma + r"'Content-Type': 'application/json' }",
        content
    )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Refactored frontend fetches successfully")
