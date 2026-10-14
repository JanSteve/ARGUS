import zipfile
import io
import html

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
    <w:spacing w:before="360" w:after="160"/>
    <w:pBdr><w:bottom w:val="single" w:sz="12" w:space="4" w:color="101826"/></w:pBdr>
  </w:pPr>
  {make_run(text, bold=True, font_size=32, color="101826", font="Georgia")}
</w:p>"""
    elif level == 2:
        return f"""<w:p>
  <w:pPr>
    <w:spacing w:before="260" w:after="120"/>
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
      <w:top w:w="120"/>
      <w:left w:w="240"/>
      <w:bottom w:w="120"/>
      <w:right w:w="180"/>
    </w:tblCellMar>
  </w:tblPr>
  <w:tr>
    <w:tc>
      <w:tcPr>
        <w:tcW w:w="9360" w:type="dxa"/>
        <w:shd w:val="clear" w:color="auto" w:fill="F7F5F0"/>
      </w:tcPr>
      {make_para([make_run(title, bold=True, font_size=22, color="7A2A22")], space_before=60, space_after=40)}
      {make_para([make_run(body, italic=True, font_size=21, color="4A5568")], space_before=0, space_after=60)}
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

print("Helper definitions complete")
