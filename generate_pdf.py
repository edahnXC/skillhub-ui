import os
import re
import subprocess
import markdown
from pygments.formatters import HtmlFormatter

md_path = r"f:\Projects\skillhub-ui\SKILLHUB_BACKEND_ARCHITECTURE_DEEP_DIVE.md"
html_out_path = r"f:\Projects\skillhub-ui\rendered_guide.html"
pdf_out_ui = r"f:\Projects\skillhub-ui\SKILLHUB_BACKEND_ARCHITECTURE_DEEP_DIVE.pdf"
pdf_out_backend = r"f:\Projects\SkillHub\SKILLHUB_BACKEND_ARCHITECTURE_DEEP_DIVE.pdf"

with open(md_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace custom GitHub callouts before markdown processing
def format_callouts(match):
    alert_type = match.group(1).upper()
    content = match.group(2)
    colors = {
        "NOTE": ("#2563eb", "#eff6ff", "ℹ️"),
        "TIP": ("#059669", "#ecfdf5", "💡"),
        "IMPORTANT": ("#7c3aed", "#f5f3ff", "📌"),
        "WARNING": ("#d97706", "#fffbeb", "⚠️"),
        "CAUTION": ("#dc2626", "#fef2f2", "🛑")
    }
    border_col, bg_col, icon = colors.get(alert_type, ("#4b5563", "#f9fafb", "ℹ️"))
    return f"""<div style="margin: 16px 0; padding: 14px 18px; background-color: {bg_col}; border-left: 4px solid {border_col}; border-radius: 6px;">
<div style="font-weight: 700; color: {border_col}; margin-bottom: 6px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">{icon} {alert_type}</div>
<div style="color: #1e293b; font-size: 13.5px; line-height: 1.6;">{content.strip()}</div>
</div>"""

text = re.sub(r'>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*(?:\n|$))*)', 
              lambda m: format_callouts(re.match(r'>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n([\s\S]*)', m.group(0))), 
              text)

# Clean remaining blockquote '>' prefixes inside formatted callouts if any
# Also handle standard markdown conversion
pygments_css = HtmlFormatter(style='monokai').get_style_defs('.codehilite')

html_content = markdown.markdown(
    text,
    extensions=['extra', 'codehilite', 'tables', 'toc', 'fenced_code']
)

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SkillHub Backend Architecture & Technical Mastery Guide</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

@page {{
    size: A4;
    margin: 16mm 14mm 18mm 14mm;
    @bottom-center {{
        content: "SkillHub Enterprise Technical Architecture Guide • Page " counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 9px;
        color: #94a3b8;
    }}
}}

body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.65;
    font-size: 13.5px;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
}}

.cover-header {{
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%);
    color: #ffffff;
    padding: 36px 32px 30px;
    border-radius: 12px;
    margin-bottom: 28px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
}}

.cover-header h1 {{
    color: #ffffff;
    font-size: 26px;
    font-weight: 800;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
    border: none;
    padding: 0;
}}

.cover-header h2 {{
    color: #a5b4fc;
    font-size: 14px;
    font-weight: 500;
    margin: 0 0 16px 0;
    border: none;
    padding: 0;
    line-height: 1.5;
}}

.badge-row {{
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}}

.badge {{
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #e0e7ff;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
}}

h1, h2, h3, h4 {{
    color: #0f172a;
    font-weight: 700;
    page-break-after: avoid;
}}

h1 {{
    font-size: 20px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 8px;
    margin-top: 32px;
    margin-bottom: 14px;
    letter-spacing: -0.3px;
}}

h2 {{
    font-size: 16px;
    color: #312e81;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 6px;
    margin-top: 24px;
    margin-bottom: 10px;
}}

h3 {{
    font-size: 14px;
    color: #1e293b;
    margin-top: 18px;
    margin-bottom: 8px;
}}

p {{
    margin: 0 0 12px 0;
}}

ul, ol {{
    margin: 0 0 14px 0;
    padding-left: 22px;
}}

li {{
    margin-bottom: 4px;
}}

code {{
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 12px;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
}}

pre {{
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 11.5px;
    line-height: 1.55;
    background-color: #0f172a !important;
    color: #f8fafc !important;
    padding: 14px 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 14px 0;
    page-break-inside: avoid;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    border: 1px solid #1e293b;
}}

pre code {{
    background: transparent !important;
    color: inherit !important;
    border: none !important;
    padding: 0 !important;
    font-size: 11.5px;
}}

table {{
    width: 100%;
    border-collapse: collapse;
    margin: 16px 0;
    font-size: 12.5px;
    page-break-inside: avoid;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    border-radius: 8px;
    overflow: hidden;
}}

th, td {{
    padding: 10px 12px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}}

th {{
    background-color: #f8fafc;
    color: #0f172a;
    font-weight: 700;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-top: 1px solid #e2e8f0;
}}

tr:nth-child(even) {{
    background-color: #f8fafc;
}}

tr:hover {{
    background-color: #f1f5f9;
}}

blockquote {{
    margin: 14px 0;
    padding: 12px 18px;
    background-color: #f8fafc;
    border-left: 4px solid #6366f1;
    border-radius: 0 6px 6px 0;
    color: #334155;
    font-style: normal;
}}

hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 28px 0;
}}

{pygments_css}
</style>
</head>
<body>

<div class="cover-header">
    <h1>SkillHub • Enterprise Backend Architecture Deep Dive</h1>
    <h2>Master Engineering Specification: Clean Architecture, Security Lifecycle, Entity Framework Core 8, Dependency Injection & RESTful Orchestration</h2>
    <div class="badge-row">
        <span class="badge">ASP.NET Core 8 Web API</span>
        <span class="badge">Clean Architecture (Onion)</span>
        <span class="badge">JWT & Token Rotation</span>
        <span class="badge">Hybrid RBAC + PBAC</span>
        <span class="badge">EF Core 8 (19 DbSets)</span>
        <span class="badge">AutoMapper Projections</span>
    </div>
</div>

{html_content}

</body>
</html>
"""

with open(html_out_path, "w", encoding="utf-8") as f:
    f.write(full_html)

print("HTML generated successfully at:", html_out_path)

# Convert HTML to PDF using Chrome Headless
chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
cmd = [
    chrome_path,
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_out_ui}",
    f"file:///{html_out_path.replace(os.sep, '/')}"
]

print("Executing Chrome headless print-to-pdf...")
res = subprocess.run(cmd, capture_output=True, text=True)
print("Chrome exit code:", res.returncode)

if os.path.exists(pdf_out_ui):
    pdf_size = os.path.getsize(pdf_out_ui)
    print(f"PDF successfully generated at {pdf_out_ui} (Size: {pdf_size} bytes)")
    
    # Copy to backend directory as well
    import shutil
    shutil.copy2(pdf_out_ui, pdf_out_backend)
    print(f"Copied PDF to {pdf_out_backend}")
else:
    print("PDF generation failed. Output was not created.")
