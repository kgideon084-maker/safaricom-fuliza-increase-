import re
import subprocess
import sys

with open('index.html', 'r') as f:
    html = f.read()

# Extract script
script_pattern = re.compile(r'<script>(.*?)</script>', re.DOTALL)
match = script_pattern.search(html)

if not match:
    print("No script found")
    sys.exit(0)

script_content = match.group(1)

# Write to temp file
with open('temp.js', 'w') as f:
    f.write(script_content)

# Obfuscate
subprocess.run(['npx', 'javascript-obfuscator', 'temp.js', '--output', 'temp.obf.js'], check=True)

# Read obfuscated script
with open('temp.obf.js', 'r') as f:
    obf_script = f.read()

# Replace in html
new_html = html[:match.start(1)] + "\n" + obf_script + "\n" + html[match.end(1):]

with open('index.html', 'w') as f:
    f.write(new_html)

# Clean up
subprocess.run(['rm', 'temp.js', 'temp.obf.js'])

# Minify html
subprocess.run(['npx', 'html-minifier-terser', '--collapse-whitespace', '--remove-comments', '--minify-css', 'true', '--minify-js', 'true', 'index.html', '-o', 'index.html'], check=True)

print("HTML obfuscation and minification complete.")
