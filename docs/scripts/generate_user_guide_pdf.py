from __future__ import annotations

from pathlib import Path
import re
from typing import List, Tuple

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
    Preformatted,
    PageBreak,
)

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "COMPLETE-USER-GUIDE.md"
OUT = ROOT / "docs" / "DigiKhaato-Complete-User-Guide.pdf"


def escape_html(text: str) -> str:
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def parse_table(lines: List[str], start_idx: int) -> Tuple[Table, int]:
    rows: List[List[str]] = []
    i = start_idx
    while i < len(lines) and lines[i].strip().startswith("|"):
        raw = lines[i].strip().strip("|")
        cols = [c.strip() for c in raw.split("|")]
        rows.append(cols)
        i += 1

    if len(rows) >= 2 and all(set(c) <= set("-:") for c in rows[1]):
        rows.pop(1)

    # normalize column counts
    max_cols = max(len(r) for r in rows) if rows else 0
    rows = [r + [""] * (max_cols - len(r)) for r in rows]

    tbl = Table(rows, repeatRows=1)
    tbl.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EAF2FF")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.4),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )
    return tbl, i


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawRightString(200 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def md_to_story(md_text: str):
    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "TitleStyle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=24,
        leading=28,
        textColor=colors.HexColor("#0F172A"),
        alignment=TA_CENTER,
        spaceAfter=10,
    )
    subtitle = ParagraphStyle(
        "SubTitleStyle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=11,
        textColor=colors.HexColor("#334155"),
        alignment=TA_CENTER,
        spaceAfter=4,
    )
    h1 = ParagraphStyle(
        "H1",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=colors.HexColor("#0B3A5B"),
        spaceBefore=10,
        spaceAfter=5,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#0F3D6E"),
        spaceBefore=8,
        spaceAfter=4,
    )
    h3 = ParagraphStyle(
        "H3",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#1E3A8A"),
        spaceBefore=6,
        spaceAfter=3,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=13,
        textColor=colors.HexColor("#111827"),
        spaceAfter=3,
    )
    bullet = ParagraphStyle(
        "Bullet",
        parent=body,
        leftIndent=12,
        bulletIndent=0,
    )
    code_style = ParagraphStyle(
        "Code",
        parent=body,
        fontName="Courier",
        fontSize=8.2,
        leading=10,
        backColor=colors.HexColor("#F3F4F6"),
        borderColor=colors.HexColor("#D1D5DB"),
        borderWidth=0.5,
        borderPadding=5,
        borderRadius=2,
        spaceBefore=3,
        spaceAfter=6,
    )

    lines = md_text.splitlines()

    # Build TOC entries from headings
    toc_entries = []
    for ln in lines:
        m = re.match(r"^(#{1,3})\s+(.*)$", ln.strip())
        if m:
            level = len(m.group(1))
            txt = m.group(2).strip()
            if level <= 2 and not txt.startswith("DigiKhaato Business User Guide"):
                toc_entries.append((level, txt))

    story = []

    # Cover
    story.append(Spacer(1, 18 * mm))
    story.append(Paragraph("DigiKhaato", title))
    story.append(Paragraph("Complete Business User Guide", title))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph("Loan Management + Jewellery ERP", subtitle))
    story.append(Paragraph("End-user, Admin, and Stakeholder Documentation", subtitle))
    story.append(Spacer(1, 12 * mm))
    story.append(Paragraph("Prepared on: May 7, 2026", subtitle))
    story.append(Paragraph("Version: 1.0", subtitle))
    story.append(PageBreak())

    # TOC
    story.append(Paragraph("Table of Contents", h1))
    for level, txt in toc_entries:
        indent = "&nbsp;" * (4 * (level - 1))
        story.append(Paragraph(f"{indent}• {escape_html(txt)}", body))
    story.append(PageBreak())

    i = 0
    in_code = False
    code_buf: List[str] = []

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # code block toggles
        if stripped.startswith("```"):
            if not in_code:
                in_code = True
                code_buf = []
            else:
                in_code = False
                story.append(Preformatted("\n".join(code_buf), code_style))
                code_buf = []
            i += 1
            continue

        if in_code:
            code_buf.append(line)
            i += 1
            continue

        if not stripped:
            story.append(Spacer(1, 2))
            i += 1
            continue

        if stripped == "---":
            story.append(Spacer(1, 4))
            i += 1
            continue

        # headings
        m = re.match(r"^(#{1,3})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            text = escape_html(m.group(2).strip())
            if level == 1:
                story.append(Paragraph(text, h1))
            elif level == 2:
                story.append(Paragraph(text, h2))
            else:
                story.append(Paragraph(text, h3))
            i += 1
            continue

        # markdown table
        if stripped.startswith("|"):
            tbl, ni = parse_table(lines, i)
            story.append(tbl)
            story.append(Spacer(1, 5))
            i = ni
            continue

        # screenshot placeholder callout
        if "Screenshot Placeholder:" in stripped:
            content = stripped.replace("**", "")
            box = Table([[content]], colWidths=[170 * mm])
            box.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF7ED")),
                        ("TEXTCOLOR", (0, 0), (-1, -1), colors.HexColor("#9A3412")),
                        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Oblique"),
                        ("FONTSIZE", (0, 0), (-1, -1), 9),
                        ("BOX", (0, 0), (-1, -1), 0.8, colors.HexColor("#FDBA74")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 8),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            story.append(box)
            story.append(Spacer(1, 5))
            i += 1
            continue

        # bullet/numbered lists
        if stripped.startswith("- "):
            story.append(Paragraph(f"• {escape_html(stripped[2:].strip())}", bullet))
            i += 1
            continue

        if re.match(r"^\d+\.\s+", stripped):
            story.append(Paragraph(escape_html(stripped), body))
            i += 1
            continue

        # inline emphasis cleanup
        cleaned = stripped.replace("**", "")
        story.append(Paragraph(escape_html(cleaned), body))
        i += 1

    return story


def main():
    md_text = SRC.read_text(encoding="utf-8")
    story = md_to_story(md_text)

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=14 * mm,
        title="DigiKhaato Complete User Guide",
        author="DigiKhaato",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Generated: {OUT}")


if __name__ == "__main__":
    main()
