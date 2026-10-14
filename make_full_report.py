import zipfile
import io
import html
import os

def escape_xml(s):
    return html.escape(str(s), quote=True)

def make_run(text, bold=False, italic=False, font_size=22, color="2D3748", font="Calibri"):
    b_tag = "<w:b/>" if bold else ""
    i_tag = "<w:i/>" if italic else ""
    return f"""<w:r>
      <w:rPr>
        <w:rFonts w:ascii="{font}" w:hAnsi="{font}"/>
        {b_tag}
        {i_tag}
        <w:sz w:val="{font_size}"/>
        <w:color w:val="{color}"/>
      </w:rPr>
      <w:t xml:space="preserve">{escape_xml(text)}</w:t>
    </w:r>"""

def make_para(runs_or_text, space_before=120, space_after=120, line_spacing=276, align="left"):
    jc_tag = f'<w:jc w:val="{align}"/>' if align != "left" else ""
    runs = runs_or_text if isinstance(runs_or_text, list) else [make_run(runs_or_text)]
    return f"""<w:p>
  <w:pPr>
    <w:spacing w:before="{space_before}" w:after="{space_after}" w:line="{line_spacing}" w:lineRule="auto"/>
    {jc_tag}
  </w:pPr>
  {"".join(runs)}
</w:p>"""

def make_heading(text, level=1):
    if level == 1:
        return f"""<w:p>
  <w:pPr>
    <w:spacing w:before="400" w:after="160"/>
    <w:pBdr><w:bottom w:val="single" w:sz="16" w:space="6" w:color="101826"/></w:pBdr>
  </w:pPr>
  {make_run(text, bold=True, font_size=32, color="101826", font="Georgia")}
</w:p>"""
    elif level == 2:
        return f"""<w:p>
  <w:pPr>
    <w:spacing w:before="280" w:after="120"/>
  </w:pPr>
  {make_run(text, bold=True, font_size=26, color="7A2A22", font="Georgia")}
</w:p>"""
    elif level == 3:
        return f"""<w:p>
  <w:pPr>
    <w:spacing w:before="180" w:after="80"/>
  </w:pPr>
  {make_run(text, bold=True, font_size=23, color="101826")}
</w:p>"""

def make_bullet(bold_prefix, text):
    return f"""<w:p>
  <w:pPr>
    <w:pStyle w:val="ListParagraph"/>
    <w:spacing w:before="60" w:after="60" w:line="260" w:lineRule="auto"/>
    <w:ind w:left="720" w:hanging="360"/>
  </w:pPr>
  {make_run("•  ", bold=True, color="7A2A22")}
  {make_run(bold_prefix + ": ", bold=True, color="101826")}
  {make_run(text, color="2D3748")}
</w:p>"""

def make_callout(title, body):
    return f"""<w:tbl>
  <w:tblPr>
    <w:tblW w:w="9360" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="none"/>
      <w:left w:val="single" w:sz="24" w:space="0" w:color="7A2A22"/>
      <w:bottom w:val="none"/>
      <w:right w:val="none"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top w:w="140"/>
      <w:left w:w="260"/>
      <w:bottom w:w="140"/>
      <w:right w:w="200"/>
    </w:tblCellMar>
  </w:tblPr>
  <w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="9360" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="F7F5F0"/>
      </w:tcPr>
      {make_para([make_run(title, bold=True, font_size=22, color="7A2A22")], space_before=40, space_after=40)}
      {make_para([make_run(body, italic=True, font_size=21, color="374151")], space_before=0, space_after=40)}
    </w:tc>
  </w:tr>
</w:tbl>"""

def make_table(headers, rows, col_widths=None):
    if not col_widths:
        total_w = 9360
        cw = total_w // len(headers)
        col_widths = [cw] * len(headers)

    header_cells = ""
    for i, h in enumerate(headers):
        w = col_widths[i]
        header_cells += f"""<w:tc>
          <w:tcPr>
            <w:tcW w:w="{w}" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="101826"/>
          </w:tcPr>
          {make_para([make_run(h, bold=True, font_size=20, color="FFFFFF")], space_before=80, space_after=80, align="left")}
        </w:tc>"""
    
    rows_xml = f"<w:tr>{header_cells}</w:tr>"
    
    for r_idx, row in enumerate(rows):
        bg_fill = "F9FAFB" if r_idx % 2 == 1 else "FFFFFF"
        cells = ""
        for i, val in enumerate(row):
            w = col_widths[i]
            bold_val = (i == 0)
            cells += f"""<w:tc>
              <w:tcPr>
                <w:tcW w:w="{w}" w:type="dxa"/>
                <w:shd w:val="clear" w:color="auto" w:fill="{bg_fill}"/>
              </w:tcPr>
              {make_para([make_run(val, bold=bold_val, font_size=19, color="2D3748")], space_before=60, space_after=60, align="left")}
            </w:tc>"""
        rows_xml += f"<w:tr>{cells}</w:tr>"

    return f"""<w:tbl>
  <w:tblPr>
    <w:tblW w:w="9360" w:type="dxa"/>
    <w:tblBorders>
      <w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
      <w:left w:val="none"/>
      <w:bottom w:val="single" w:sz="8" w:space="0" w:color="101826"/>
      <w:right w:val="none"/>
      <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E5E7EB"/>
      <w:insideV w:val="none"/>
    </w:tblBorders>
    <w:tblCellMar>
      <w:top w:w="80"/>
      <w:left w:w="140"/>
      <w:bottom w:w="80"/>
      <w:right w:w="140"/>
    </w:tblCellMar>
  </w:tblPr>
  {rows_xml}
</w:tbl>"""

# Build document body
body = []

# Title Block
body.append(make_para([
    make_run("SOULVAI TECHNOLOGIES", bold=True, font_size=38, color="101826", font="Georgia")
], space_before=0, space_after=40, align="left"))

body.append(make_para([
    make_run("Engineering & Optimization Report: Verdikt Platform Website (soulvai.ai)", bold=True, italic=True, font_size=26, color="7A2A22", font="Georgia")
], space_before=0, space_after=140, align="left"))

# Metadata Table
meta_headers = ["Attribute", "Details"]
meta_rows = [
    ["Author", "R Jan Steve Daniel — AI QA & Frontend Engineering"],
    ["Collaborator", "Saujanya — UI/UX Design Lead"],
    ["Presented To", "Viswanathan — Founder & CEO, Soulvai Technologies"],
    ["Target Platform", "soulvai.ai (Verdikt Multi-Agent Legal AI Platform)"],
    ["Date & Version", "September 4, 2026 | Technical Audit & Implementation v1.0"],
    ["Build Status", "Production-Verified (Next.js 14 / TypeScript / 0 Errors)"]
]
body.append(make_table(meta_headers, meta_rows, [2800, 6560]))
body.append(make_para("", space_before=80, space_after=80))

# Section 1
body.append(make_heading("1. Executive Summary & Our Core Philosophy", 1))

body.append(make_para(
    "When Saujanya and I audited soulvai.ai today, we started from a shared premise: Verdikt is India's first multi-agent legal AI platform, representing sovereign legal intelligence built from the ground up for Indian statutes, courts, and vernacular contexts. Our website cannot look or feel like a generic Silicon Valley SaaS template, nor can it look like an early-stage hobby project."
))

body.append(make_para(
    "While Saujanya approached this audit through human-computer interaction, information hierarchy, and cognitive psychology, my focus has been on the engineering reality: performance metrics, layout stability, rendering pipeline, responsive behavior, and architectural clarity. A beautiful design fails if the page loads sluggishly on a lawyer's laptop, and a fast site fails if advocates cannot grasp why 12 specialized agents beat a generic ChatGPT prompt."
))

body.append(make_callout(
    "The Engineering Thesis: 'The Gazette & the Grid'",
    "We have established a disciplined aesthetic and technical doctrine for Verdikt: institutional gravitas inspired by classic legal gazettes paired with rigorous modern systems engineering. Every pixel must convey credibility, trust, and precision to senior advocates, corporate general counsels, and institutional investors."
))

# Section 2
body.append(make_heading("2. Desktop Audit & Technical Observations on Current soulvai.ai", 1))

body.append(make_para(
    "Conducting a deep technical teardown of the live soulvai.ai website on desktop displays revealed several structural and performance bottlenecks that currently undermine user conversion:"
))

body.append(make_bullet(
    "Equal-Weight Visual Stacking",
    "On desktop, the site renders all 12 legal AI agent cards simultaneously in a flat, repetitive grid. Because every card carries identical visual prominence, the visitor experiences decision paralysis. The eye wanders across 12 distinct cards with no clear hierarchy to guide them."
))

body.append(make_bullet(
    "Missing Multi-Agent Orchestration Proof",
    "The site explains that Verdikt has 12 specialized agents, but it never shows how they collaborate. Visitors are forced to read paragraphs of abstract copy rather than visually recognizing the workflow: User Query -> Verdikt Core Orchestrator -> Domain Specialist -> Precedent Retrieval -> Verified Legal Citation."
))

body.append(make_bullet(
    "Unnecessary Navigation Friction",
    "The desktop navbar contains too many scattered anchor links (About, Mission, Agents, Why Now, Investors, Get in Touch, Work with Us). This dilutes the visitor's focus. A senior advocate or corporate counsel wants to know what Verdikt does and how to test it, not navigate an internal company directory."
))

body.append(make_bullet(
    "Asset Delivery & Layout Shifts",
    "The existing site relies on uncompressed assets and inline style declarations without server-side rendering or edge CDN caching. This introduces measurable Cumulative Layout Shift (CLS) as fonts and cards hydrate, impacting perceived speed."
))

body.append(make_bullet(
    "Static Form Architecture",
    "The 'Get in Touch' section uses standard HTML form inputs without client-side reactive validation, error prevention, or transaction feedback. For high-profile institutional investors and law firm partners, a sluggish contact interface damages credibility."
))

# Section 3
body.append(make_heading("3. The Engineering Design Rules (Zero Bloat, Maximum Trust)", 1))

body.append(make_para(
    "To solve these observations, I instituted five strict engineering and design constraints. In legal technology, restraint equals authority:"
))

body.append(make_bullet(
    "0 Emojis Across All Assets",
    "Consumer AI websites rely on emojis (sparkles, robots, rockets) which immediately signal amateurism to high-court advocates and legal scholars. We replaced all emojis with bespoke, semantic SVG icons (scales of justice, MCA corporate shields, IPC/BNS books)."
))

body.append(make_bullet(
    "0 Box-Shadows & Max 4px Border Radius",
    "Fuzzy drop-shadows and pill-shaped rounded buttons belong to social media apps. For Verdikt, we enforce clean 1px hairline borders (#56606E and #E5E7EB) and sharp, architectural corners that mirror legal documents and official gazettes."
))

body.append(make_bullet(
    "0 Casual Arrow Glyphs",
    "Generic unicode arrows (->) are eliminated in favor of structured data tables, precise typography, and intentional status pills."
))

body.append(make_bullet(
    "Single Intentional Motion Element",
    "Instead of animations scattered chaotically across the page, we concentrate visual motion into exactly one hero element: an interactive multi-agent routing diagram. It demonstrates live routing from query to agent to verdict, runs at 60 FPS via hardware-accelerated SVG vectors, and strictly respects prefers-reduced-motion."
))

body.append(make_bullet(
    "Editorial Legal Typography",
    "We paired Newsreader (an editorial serif reflecting institutional history) for headlines with IBM Plex Sans (a high-legibility technical sans-serif) for tabular data, code, and agent interfaces."
))

# Section 4
body.append(make_heading("4. Alignment with Saujanya's UI/UX Findings (Why Engineering Agrees)", 1))

body.append(make_para(
    "Saujanya's UI/UX audit document laid out clear human-computer interaction principles. Rather than working in silos, engineering and design have collaborated closely. Here is how our technical architecture directly implements and reinforces her design conclusions:"
))

alignment_headers = ["Saujanya's UI/UX Principle", "Design Insight", "Engineering Implementation & Rationale"]
alignment_rows = [
    [
        "Hick's Law & Nav Clutter",
        "More navigation choices logarithmicly increase decision time. Cut nav down to essentials.",
        "Consolidated header to 4 primary anchors (About, Technology, Agents, Contact) plus 1 primary CTA ('Request Platform Access'). Eliminates DOM overhead and guarantees zero route hopping."
    ],
    [
        "Cognitive Load (12 Agents)",
        "Dumping 12 cards simultaneously overwhelms visitors. Suggested carousel or progressive disclosure.",
        "Engineered an instant client-side live search and domain filter. A corporate lawyer types 'MCA' or 'Companies Act' and sees the relevant agent in <5ms without scrolling through 12 cards."
    ],
    [
        "Error Prevention (Stripe Model)",
        "Stripe validates card numbers before submission. Legal forms must validate immediately.",
        "Built reactive client-side validation in the contact component. Verifies corporate email domains and required fields before sending, preventing empty submissions."
    ],
    [
        "Recognition over Recall",
        "Visual flows reduce mental effort compared to reading abstract paragraphs.",
        "Engineered the SVG Hero Orchestration component. Demonstrates the Core-to-Agent pipeline dynamically so users understand multi-agent routing instantly."
    ],
    [
        "Fitts's Law on CTAs",
        "Key actions must be large, high-contrast, and placed near natural cursor travel paths.",
        "Positioned prominent 'Request Platform Access' CTAs in the hero and header with clear hit areas (minimum 48px touch targets for mobile compliance)."
    ]
]
body.append(make_table(alignment_headers, alignment_rows, [2200, 3160, 4000]))
body.append(make_para("", space_before=80, space_after=80))

# Section 5
body.append(make_heading("5. Technology Stack, Tooling & Subscription Analysis", 1))

body.append(make_para(
    "One of the critical questions raised during our sync is: What tools and platforms do we need, why are they best for this task, and will Soulvai need to purchase any software subscriptions?"
))

body.append(make_para(
    "Below is the complete engineering breakdown of our production stack. The short answer is: We do NOT need any paid subscriptions right now. The entire stack is built on battle-tested open-source software and generous enterprise-ready free tiers."
))

tech_headers = ["Layer", "Tool / Platform", "Why This Tool Is Best", "Subscription / Cost"]
tech_rows = [
    [
        "UI/UX Design",
        "Figma",
        "Industry standard for design systems, auto-layout components, and team handoffs.",
        "Free Tier (Sufficient). Pro is $12/mo only if advanced branch merges are needed."
    ],
    [
        "Frontend Framework",
        "Next.js 14 (App Router) + React 18",
        "Server-Side Rendering (SSR) for instant first paint, automatic code splitting, and zero layout shift.",
        "$0 (Open Source, MIT License)"
    ],
    [
        "Type Safety",
        "TypeScript 5.7+",
        "Catches bugs at compile-time across all 12 agent data contracts and form inputs.",
        "$0 (Open Source, Apache 2.0)"
    ],
    [
        "Styling System",
        "Tailwind CSS v3.4",
        "Utility-first CSS compiler that eliminates unused styles, yielding a lean <25KB production bundle.",
        "$0 (Open Source, MIT License)"
    ],
    [
        "Animation & Motion",
        "Framer Motion v11",
        "Hardware-accelerated spring physics; handles complex SVG path routing without performance drops.",
        "$0 (Open Source, MIT License)"
    ],
    [
        "Edge Hosting & CDN",
        "Vercel",
        "Automated Git deployments, global edge network with India PoPs (Mumbai) for <50ms TTFB.",
        "Free Hobby Tier (Production-ready for launch; Team tier optional later)"
    ],
    [
        "Transactional Inquiries",
        "Resend / Nodemailer",
        "Direct SMTP/API delivery to founder@soulvai.ai with guaranteed DKIM/SPF deliverability.",
        "Free Tier (Up to 3,000 emails/month, more than enough for enterprise inbound)"
    ],
    [
        "Performance QA",
        "Lighthouse & Chrome DevTools",
        "Standardized audits for Core Web Vitals, accessibility (WCAG 2.1 AA), and search SEO.",
        "$0 (Built into Chrome / Node.js CLI)"
    ]
]
body.append(make_table(tech_headers, tech_rows, [1800, 2400, 3360, 1800]))
body.append(make_para("", space_before=80, space_after=80))

# Section 6
body.append(make_heading("6. Feasibility: Is This Website Too Complicated to Build?", 1))

body.append(make_para(
    "A natural concern when discussing multi-agent diagrams, 12 specialized agents, and high-performance editorial design is whether this website is too complex or risky to implement within our timeline."
))

body.append(make_para(
    "The direct, confident answer is: No, it is not too complicated. In fact, we are not speaking in hypotheticals. As of this afternoon, I have already coded, compiled, and verified the complete Next.js 14 production build."
))

body.append(make_callout(
    "Production Build Verification Completed Today",
    "• Clean build status: npm run build generated all 6 static routes with 0 TypeScript errors.\n• Components operational: HeroOrchestration (SVG animation), AgentDirectory (with live client search), and InvestorsContact (with form validation) are fully implemented and running locally on localhost:3000.\n• Git repository configured and linked at github.com/JanSteve/verdikt-soulvai."
))

body.append(make_para(
    "The reason this was built rapidly and reliably is architectural discipline. Rather than relying on heavy WebGL libraries or fragile third-party page builders like Webflow or WordPress, we constructed clean, modular React components. Each component has a single responsibility, meaning future updates (such as adding a 13th legal agent or updating market metrics) can be done in minutes with zero risk of breaking the layout."
))

# Section 7
body.append(make_heading("7. Immediate Action Plan & Next Steps", 1))

body.append(make_para(
    "To take this from local verification to live deployment for Viswanathan and the leadership team, here are the sequential next steps:"
))

body.append(make_bullet(
    "1. Live Vercel Staging Link (Immediate)",
    "Deploy the repository JanSteve/verdikt-soulvai to Vercel to give Viswanathan and the team an interactive URL they can test on both desktop and mobile devices."
))

body.append(make_bullet(
    "2. Design Token Fine-Tuning with Saujanya (Today)",
    "Map any specific hex codes, spacing preferences, or graphic assets from Saujanya's Figma wireframes into the Tailwind configuration."
))

body.append(make_bullet(
    "3. Lighthouse 95+ Audit Certification (Pre-Launch)",
    "Execute automated Lighthouse runs targeting 95+ scores in Performance, Accessibility, Best Practices, and SEO."
))

body.append(make_bullet(
    "4. Production Domain Mapping",
    "Once approved by Viswanathan, link the production deployment to soulvai.ai with automated SSL certification."
))

body.append(make_para("", space_before=120, space_after=80))

# Sign-off
body.append(make_para([
    make_run("Respectfully submitted,", italic=True, font_size=22, color="56606E")
], space_before=120, space_after=40))

body.append(make_para([
    make_run("R Jan Steve Daniel", bold=True, font_size=24, color="101826")
], space_before=0, space_after=20))

body.append(make_para([
    make_run("AI QA & Frontend Engineering Intern | Soulvai Technologies", italic=True, font_size=20, color="7A2A22")
], space_before=0, space_after=20))

body.append(make_para([
    make_run("Final-Year IMCA (AI Specialization), Parul University", font_size=20, color="56606E")
], space_before=0, space_after=120))

# Write the docx
doc_body_xml = "\n".join(body)

content_types = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>"""

rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>"""

doc_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"""

styles = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="2D3748"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:line="276" w:lineRule="auto" w:before="120" w:after="120"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>"""

doc_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
{doc_body_xml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>"""

output_filename = "Soulvai_Technologies_Technical_Report_Steve_Daniel.docx"
with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as z:
    z.writestr('[Content_Types].xml', content_types)
    z.writestr('_rels/.rels', rels)
    z.writestr('word/_rels/document.xml.rels', doc_rels)
    z.writestr('word/styles.xml', styles)
    z.writestr('word/document.xml', doc_xml)

print(f"Report generated successfully: {output_filename}")
file_size = os.path.getsize(output_filename)
print(f"File size: {file_size} bytes")
