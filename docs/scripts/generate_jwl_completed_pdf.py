from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle, Preformatted, PageBreak
import re

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "docs" / "jewellery" / "JWL-COMPLETED-FEATURES-USER-GUIDE.md"
OUT = ROOT / "docs" / "jewellery" / "JWL-COMPLETED-FEATURES-USER-GUIDE.pdf"


def esc(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def parse_table(lines, i):
    rows = []
    while i < len(lines) and lines[i].strip().startswith("|"):
        r = lines[i].strip().strip("|")
        rows.append([c.strip() for c in r.split("|")])
        i += 1
    if len(rows) >= 2 and all(set(c) <= set("-:") for c in rows[1]):
        rows.pop(1)
    m = max(len(r) for r in rows) if rows else 0
    rows = [r + [""] * (m - len(r)) for r in rows]
    t = Table(rows, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8F0FE")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0B3A5B")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.8),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#FAFAFA")]),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t, i


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawRightString(200 * mm, 10 * mm, f"Page {doc.page}")
    canvas.restoreState()


def build_story(md):
    styles = getSampleStyleSheet()
    h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=16, leading=20, textColor=colors.HexColor("#0B3A5B"), spaceBefore=8, spaceAfter=5)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12.5, leading=16, textColor=colors.HexColor("#1E3A8A"), spaceBefore=6, spaceAfter=4)
    body = ParagraphStyle("B", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.8, leading=13.5, textColor=colors.HexColor("#111827"), spaceAfter=3)
    bullet = ParagraphStyle("BL", parent=body, leftIndent=12)
    code = ParagraphStyle("C", parent=body, fontName="Courier", fontSize=8.3, leading=10.3, backColor=colors.HexColor("#F3F4F6"), borderColor=colors.HexColor("#D1D5DB"), borderWidth=0.5, borderPadding=5)
    title = ParagraphStyle("T", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=20, leading=24, alignment=TA_CENTER, textColor=colors.HexColor("#0F172A"))
    sub = ParagraphStyle("S", parent=body, alignment=TA_CENTER, textColor=colors.HexColor("#334155"))

    lines = md.splitlines()

    toc = []
    for ln in lines:
        m = re.match(r"^(#{1,2})\s+(.*)$", ln.strip())
        if m:
            toc.append((len(m.group(1)), m.group(2).strip()))

    story = [
        Spacer(1, 18 * mm),
        Paragraph("DigiKhaato Jewellery", title),
        Paragraph("Completed Features User Guide", title),
        Spacer(1, 4 * mm),
        Paragraph("Simple BA-style handoff for shop users", sub),
        Spacer(1, 8 * mm),
        Paragraph("Date: 07 May 2026", sub),
        PageBreak(),
    ]

    story.append(Paragraph("Table of Contents", h1))
    for level, t in toc:
        ind = "&nbsp;" * (4 * (level - 1))
        story.append(Paragraph(f"{ind}* {esc(t)}", body))
    story.append(PageBreak())

    i = 0
    in_code = False
    buff = []
    while i < len(lines):
        s = lines[i].rstrip("\n")
        t = s.strip()

        if t.startswith("```"):
            if not in_code:
                in_code = True
                buff = []
            else:
                in_code = False
                story.append(Preformatted("\n".join(buff), code))
            i += 1
            continue

        if in_code:
            buff.append(s)
            i += 1
            continue

        if not t:
            story.append(Spacer(1, 2))
            i += 1
            continue

        if t == "---":
            story.append(Spacer(1, 4))
            i += 1
            continue

        m = re.match(r"^(#{1,2})\s+(.*)$", t)
        if m:
            lvl = len(m.group(1))
            tx = esc(m.group(2).replace("**", "").strip())
            story.append(Paragraph(tx, h1 if lvl == 1 else h2))
            i += 1
            continue

        if t.startswith("|"):
            tbl, i = parse_table(lines, i)
            story.append(tbl)
            story.append(Spacer(1, 5))
            continue

        if t.startswith("- "):
            story.append(Paragraph(f"* {esc(t[2:].strip())}", bullet))
            i += 1
            continue

        if re.match(r"^\d+\.\s+", t):
            story.append(Paragraph(esc(t.replace("**", "")), body))
            i += 1
            continue

        story.append(Paragraph(esc(t.replace("**", "")), body))
        i += 1

    return story


def main():
    md = SRC.read_text(encoding="utf-8")
    story = build_story(md)
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=15 * mm,
        bottomMargin=14 * mm,
        title="JWL Completed Features User Guide",
    )
    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Generated: {OUT}")


if __name__ == "__main__":
    main()
