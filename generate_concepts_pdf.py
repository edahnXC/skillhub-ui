import os
import re
import subprocess
import shutil
import markdown
from pygments.formatters import HtmlFormatter

md_path = r"f:\Projects\skillhub-ui\ASPNET_CORE_ARCHITECTURE_AND_CONCEPTS_GUIDE.md"
html_out_path = r"f:\Projects\skillhub-ui\rendered_concepts_guide.html"
pdf_out_ui = r"f:\Projects\skillhub-ui\ASPNET_CORE_ARCHITECTURE_AND_CONCEPTS_GUIDE.pdf"
pdf_out_backend = r"f:\Projects\SkillHub\ASPNET_CORE_ARCHITECTURE_AND_CONCEPTS_GUIDE.pdf"
md_out_backend = r"f:\Projects\SkillHub\ASPNET_CORE_ARCHITECTURE_AND_CONCEPTS_GUIDE.md"

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
    return f"""<div class="callout-box" style="margin: 16px 0; padding: 12px 16px; background-color: {bg_col}; border-left: 4px solid {border_col}; border-radius: 6px; page-break-inside: avoid;">
<div style="font-weight: 700; color: {border_col}; margin-bottom: 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">{icon} {alert_type}</div>
<div style="color: #1e293b; font-size: 13px; line-height: 1.55;">{content.strip()}</div>
</div>"""

text = re.sub(r'>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*(?:\n|$))*)', 
              lambda m: format_callouts(re.match(r'>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n([\s\S]*)', m.group(0))), 
              text)

pygments_css = HtmlFormatter(style='monokai').get_style_defs('.codehilite')

html_content = markdown.markdown(
    text,
    extensions=['extra', 'codehilite', 'tables', 'toc', 'fenced_code']
)

full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>ASP.NET Core 8 Web API: Architecture & Core Concepts Guide</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

@page {{
    size: A4 portrait;
    margin: 14mm 12mm 16mm 12mm;
    @bottom-center {{
        content: "SkillHub Enterprise Core Architecture & Viva Mastery Guide • Page " counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8.5px;
        color: #94a3b8;
    }}
}}

* {{
    box-sizing: border-box;
}}

body {{
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: #1e293b;
    line-height: 1.6;
    font-size: 12.5px;
    background-color: #ffffff;
    margin: 0;
    padding: 0;
}}

.cover-header {{
    background: linear-gradient(135deg, #090d16 0%, #1e1b4b 50%, #312e81 100%);
    color: #ffffff;
    padding: 30px 26px 24px;
    border-radius: 10px;
    margin-bottom: 24px;
    box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.2);
    page-break-inside: avoid;
}}

.cover-header h1 {{
    color: #ffffff;
    font-size: 23px;
    font-weight: 800;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
    border: none;
    padding: 0;
}}

.cover-header h2 {{
    color: #a5b4fc;
    font-size: 13px;
    font-weight: 500;
    margin: 0 0 14px 0;
    border: none;
    padding: 0;
    line-height: 1.45;
}}

.badge-row {{
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
}}

.badge {{
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: #e0e7ff;
    padding: 3px 9px;
    border-radius: 20px;
    font-size: 10.5px;
    font-weight: 600;
}}

h1, h2, h3, h4 {{
    color: #0f172a;
    font-weight: 700;
    page-break-after: avoid !important;
    break-after: avoid !important;
}}

h1 {{
    font-size: 18px;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 7px;
    margin-top: 26px;
    margin-bottom: 12px;
    letter-spacing: -0.3px;
}}

h2 {{
    font-size: 14.5px;
    color: #312e81;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 5px;
    margin-top: 20px;
    margin-bottom: 9px;
}}

h3 {{
    font-size: 13px;
    color: #1e293b;
    margin-top: 14px;
    margin-bottom: 7px;
}}

p {{
    margin: 0 0 10px 0;
}}

ul, ol {{
    margin: 0 0 12px 0;
    padding-left: 20px;
}}

li {{
    margin-bottom: 3px;
}}

code {{
    font-family: 'JetBrains Mono', Consolas, monospace;
    font-size: 11px;
    background-color: #f1f5f9;
    color: #0f172a;
    padding: 2px 5px;
    border-radius: 4px;
    border: 1px solid #e2e8f0;
    word-break: break-word;
}}

/* ALL CODE BLOCKS WRAP AND BREAK NATURALLY ACROSS PAGES WITHOUT CUTTING OFF */
.codehilite {{
    background-color: #0b0f19 !important;
    border-radius: 8px;
    margin: 12px 0;
    border: 1px solid #1e293b;
    page-break-inside: auto !important;
    break-inside: auto !important;
}}

pre, .codehilite pre {{
    font-family: 'JetBrains Mono', Consolas, monospace !important;
    font-size: 10px !important;
    line-height: 1.55 !important;
    background-color: #0b0f19 !important;
    color: #f8fafc !important;
    padding: 12px 14px !important;
    border-radius: 8px;
    margin: 0 !important;
    /* CRITICAL: Ensure all lines are visible and wrap properly */
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    page-break-inside: auto !important;
    break-inside: auto !important;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}}

pre code, .codehilite pre code {{
    background: transparent !important;
    color: inherit !important;
    border: none !important;
    padding: 0 !important;
    font-size: 10px !important;
    white-space: pre-wrap !important;
    word-wrap: break-word !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
}}

table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 11.5px;
    page-break-inside: auto;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
}}

th, td {{
    padding: 8px 10px;
    text-align: left;
    border: 1px solid #e2e8f0;
    word-break: break-word;
}}

th {{
    background-color: #f8fafc;
    color: #0f172a;
    font-weight: 700;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}}

tr:nth-child(even) {{
    background-color: #f8fafc;
}}

blockquote {{
    margin: 12px 0;
    padding: 10px 16px;
    background-color: #f8fafc;
    border-left: 4px solid #6366f1;
    border-radius: 0 6px 6px 0;
    color: #334155;
    font-style: normal;
    page-break-inside: avoid;
}}

hr {{
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 22px 0;
}}

.callout-box {{
    page-break-inside: avoid !important;
    break-inside: avoid !important;
}}

{pygments_css}
</style>
</head>
<body>

<div class="cover-header">
    <h1>SkillHub • ASP.NET Core 8 Web API Architecture & Concepts Guide</h1>
    <h2>Comprehensive Engineering Manual: Role-Based Authentication (RBAC), Entity Framework Core 8, Dependency Injection (DI), DTOs, Model Binding, Middleware Pipeline, builder.Services & REST Controllers</h2>
    <div class="badge-row">
        <span class="badge">ASP.NET Core 8</span>
        <span class="badge">C# 12 / .NET 8</span>
        <span class="badge">Clean Architecture</span>
        <span class="badge">JWT & RBAC</span>
        <span class="badge">EF Core 8</span>
        <span class="badge">Dependency Injection</span>
        <span class="badge">Middleware Pipeline</span>
        <span class="badge">Model Binding & DTOs</span>
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
    print(f"PDF successfully generated at {pdf_out_ui} (Size: {pdf_size:,} bytes)")
    
    # Copy to backend directory as well
    try:
        shutil.copy2(pdf_out_ui, pdf_out_backend)
        print(f"Copied PDF to {pdf_out_backend}")
        shutil.copy2(md_path, md_out_backend)
        print(f"Copied Markdown to {md_out_backend}")
    except Exception as e:
        print(f"Notice while copying to backend: {e}")
else:
    print("PDF generation failed. Output was not created.")
