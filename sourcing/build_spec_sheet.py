#!/usr/bin/env python3
"""Build the Blessed & Dressed first-sample spec sheet PDF (v2).

Construction/option details are transcribed verbatim from the owner's live
order forms (garbled spacing restored, nothing removed); measurements are the
owner's golden measurements from the same forms. 0.0 = not specified on the
form. Run: python3 sourcing/build_spec_sheet.py
"""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

NAVY = colors.HexColor("#1F2A44")
GOLD = colors.HexColor("#96763A")
LIGHT = colors.HexColor("#F5F1E6")
GREY = colors.HexColor("#555555")

styles = getSampleStyleSheet()
h1 = ParagraphStyle("h1", parent=styles["Title"], fontName="Times-Bold", fontSize=19, textColor=NAVY, spaceAfter=2, alignment=0)
sub = ParagraphStyle("sub", parent=styles["Normal"], fontName="Helvetica", fontSize=9, textColor=GREY, spaceAfter=8)
h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontName="Times-Bold", fontSize=14, textColor=NAVY, spaceBefore=8, spaceAfter=4)
h3 = ParagraphStyle("h3", parent=styles["Heading3"], fontName="Helvetica-Bold", fontSize=10, textColor=GOLD, spaceBefore=7, spaceAfter=3)
body = ParagraphStyle("body", parent=styles["Normal"], fontName="Helvetica", fontSize=8.5, leading=11.5)
bodyw = ParagraphStyle("bodyw", parent=body, textColor=colors.white)
small = ParagraphStyle("small", parent=styles["Normal"], fontName="Helvetica", fontSize=7.5, textColor=GREY, leading=10)


def opts_table(rows):
    data = [[Paragraph(f"<b>{a}</b>", body), Paragraph(b, body)] for a, b in rows]
    t = Table(data, colWidths=[62 * mm, 108 * mm], repeatRows=0)
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT, colors.white]),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#DDDDDD")),
    ]))
    return t


def meas_table(rows):
    data = [[Paragraph("<b>Measurement point</b>", bodyw), Paragraph("<b>Actual value</b>", bodyw)]]
    data += [[Paragraph(a, body), Paragraph(b, body)] for a, b in rows]
    t = Table(data, colWidths=[100 * mm, 70 * mm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, LIGHT]),
        ("TOPPADDING", (0, 0), (-1, -1), 2.2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#DDDDDD")),
    ]))
    return t


def header(story, title):
    story.append(Paragraph("Blessed &amp; Dressed", h1))
    story.append(Paragraph("First Sample Specification Sheet (v2) — Prepared for Yamamoto EXCY · August 2026", sub))
    story.append(Paragraph(title, h2))


JACKET_OPTS = [
    ("Shoulder head", "Regular"),
    ("Canvas", "Regular Fused"),
    ("Lapel", "Curved Peak Lapel 103&#176;"),
    ("Lapel width", "12.5 CM"),
    ("Folded collar craftsmanship", "Normal"),
    ("Collar tab fabric", "None"),
    ("Collar interlining", "Regular"),
    ("Lapel buttonhole style", "Rome 2.3 CM (M)"),
    ("Lapel buttonhole position", "Each side double"),
    ("Lapel buttonhole color", "YZ002"),
    ("Chest pocket", "Straight Welt Chest Pocket in 2.5 cm"),
    ("Lower pocket", "Large Slanted Flap in 6.5 cm"),
    ("Lower pocket bartack", "X-bartack"),
    ("Ticket pocket", "Flap 5 CM, same design with lower pocket (seam excluded)"),
    ("Front style", "DB 6 BY 2"),
    ("Placket button", "FK503237"),
    ("Hem &amp; gusset", "Squared bottom"),
    ("Sleeve vent", "Functional"),
    ("Sleeve vent ribbon position", "Ribbon on button side"),
    ("Sleeve vent ribbon fabric", "As body lining"),
    ("Sleeve button", "FK502437"),
    ("Sleeve cuff", "Square sleeve cuff"),
    ("Collar melton", "Matching to fabric"),
    ("Chest dart distance", "-2 cm"),
    ("Double breasted left &amp; right button distance", "10 cm"),
    ("Upper &amp; lower button distance", "9 cm"),
    ("Cuff button number", "Six"),
    ("Cuff button spacing", "NO KISSING"),
    ("Pick stitching", "0.15*0.6 cm double pick stitching"),
    ("Pick stitching position", "Lapel, Collar, Front, Pocket, Sleeve Vent"),
    ("Pick stitching color", "Matching to fabric"),
    ("Sleeve buttonhole direction", "Slant"),
    ("Back vent", "Side Vents"),
    ("Folded back vent", "Folded back vent"),
    ("Front buttonhole", "By machine"),
    ("Lower coin pocket", "None"),
    ("All front buttonholes in one color", "YZ002"),
    ("Sleeve buttonhole", "By machine"),
    ("1st sleeve buttonhole in contrast color", "YZ002"),
    ("2nd sleeve buttonhole in contrast color", "Matching to fabric"),
    ("3rd sleeve buttonhole in contrast color", "YZ002"),
    ("4th sleeve buttonhole in contrast color", "Matching to fabric"),
    ("5th sleeve buttonhole in contrast color", "YZ002"),
    ("6th sleeve buttonhole in contrast color", "Matching to fabric"),
    ("Sewing button style", "&quot;=&quot; stitching by hands"),
    ("Buttoning thread color", "YZ002"),
    ("Hand-made", "Individual hand-made parts"),
    ("Facing", "Facing 1"),
    ("Pen pocket", "Left jetted pocket"),
    ("Half lining / full lining", "Full lining"),
    ("Half lining shape", "None"),
    ("Half lining craftsmanship", "NONE"),
    ("Body lining", "FB2634A1"),
    ("Sleeve lining", "As body lining"),
    ("Columbia stitching / piping", "Columbia stitching"),
    ("Columbia stitching color", "Matching to fabric"),
    ("Piping color", "None"),
    ("Inner pocket button", "Inner pocket button 4"),
    ("Inner pocket closure", "D-bartack"),
    ("Perfume pad style", "Triangle underarm shield"),
    ("Inner ticket pocket", "Right"),
    ("Namecard pocket", "Left Inner Pocket Depth 15 CM"),
    ("Mp3 pocket", "None"),
    ("Upper pocket fabric", "As body lining"),
    ("Brand label position", "Above the left inner pocket (no labelling on lining)"),
    ("Fabric label position", "No Fabric Label"),
    ("Collar label", "Loop in ribbon"),
    ("Care label classify", "Standard"),
    ("Care label position", "Left inner pocket"),
]

JACKET_MEAS = [
    ("Height", "170.2"), ("Weight", "197.0"), ("Age", "34.0"),
    ("Hem (Finished)", "0.0"),
    ("Full Chest (Finished)", "120.0"),
    ("Full Stomach (Finished)", "109.0"),
    ("Full Belly (Finished)", "115.0"),
    ("Full Seat (Finished)", "118.0"),
    ("Full Bicep (Finished)", "41.0"),
    ("Full Cuff (Finished)", "28.0"),
    ("Shoulder Width (Finished)", "44.5"),
    ("Back Width (Finished)", "46.5"),
    ("Left Sleeve (Finished)", "61.0"),
    ("Right Sleeve (Finished)", "62.0"),
    ("Back Length (Finished)", "72.5"),
    ("Front Length (Finished)", "75.0"),
    ("Neckline (body)", "41.2"),
    ("Nape to Waist Length", "0.0"),
    ("First Button Stance", "39.0"),
]

TROUSER_OPTS = [
    ("Front pocket", "Slant pocket 2"),
    ("Front pocket depth", "Standard"),
    ("Waistband style", "Metal Adjusters on Outseam"),
    ("Metal adjuster", "Gold Metal Adjuster FK140103"),
    ("Waistband extension shape", "Straight Extension with Rounded Corner"),
    ("Waistband extension length", "Same with pattern"),
    ("Waistband width", "5 cm"),
    ("Closure", "Two buttons two hooks"),
    ("Pleat", "Single dart"),
    ("Belt loops", "None"),
    ("Fly style", "Metal zipper"),
    ("Fly decoration thread", "Pick stitching by machine"),
    ("Manual bar tack location", "I-tack by machine"),
    ("Outside watch pocket", "Flap watch pocket with buttonhole"),
    ("Inside coin pocket", "Both side"),
    ("Button", "NJ38 / FK752405"),
    ("Buttoning thread color", "YZ002"),
    ("Sewing button style", "Regular sewing by machine"),
    ("Center crease", "With Center Crease"),
    ("Front pocket decoration thread", "Pick stitching by machine 1"),
    ("Back pocket", "Jetted pocket with tab and button 1"),
    ("Back pocket position", "Both side"),
    ("Back pocket seal craft", "X-bartack"),
    ("Back dart", "Double Darts"),
    ("Bottom shape", "Turn-up by machine 5"),
    ("Bottom with skid stick", "Back"),
    ("Inner waist style", "FY025143 (Standard waistband)"),
    ("Buttonhole", "By machine"),
    ("Buttonhole thread color", "YZ002"),
    ("Center waist seam style", "V-shape"),
    ("Center back seam style", "Binding"),
    ("Lining style in pants", "None"),
    ("Fabric label position", "No Fabric Label"),
    ("Brand label position", "No Brand Label"),
]

TROUSER_MEAS = [
    ("Height", "170.2"), ("Weight", "197.0"), ("Age", "34.0"),
    ("Full Waist (Finished)", "99.0"),
    ("Full Seat (Finished)", "118.0"),
    ("Left Pant Length (Finished)", "97.8"),
    ("Right Pant Length (Finished)", "99.1"),
    ("Full Thigh (Finished)", "70.0"),
    ("Full Knee (Finished)", "47.2"),
    ("Full Opening (Finished)", "36.0"),
    ("U-Rise", "73.0"),
    ("Back Waist Height (body)", "0.0"),
    ("Front Waist Height (body)", "0.0"),
    ("Inseam Length", "0.0"),
    ("Crotch Depth (with waist) (Finished)", "0.0"),
    ("Front Rise (with waist) (Finished)", "11.0"),
    ("Back Rise (with waist) (Finished)", "43.0"),
    ("Full Calf (body)", "36.8"),
]

SHIRT_OPTS = [
    ("Sleeve head", "Regular"),
    ("Front", "Normal"),
    ("Collar (lapel)", "Curved in 9 cm"),
    ("Decoration stitching on collar", "Machine 0.5 cm AMF stitching"),
    ("Decoration stitching color on collar", "3894"),
    ("Collar stay", "Fixed"),
    ("Collar stand height", "Collar stand height 3.7 cm (2 BUTTON)"),
    ("Collar stand", "Round collar stand with 2 buttons"),
    ("Button on collar stand", "FKE01641"),
    ("Placket", "Outer placket"),
    ("Placket width", "Placket width 4.5 cm"),
    ("Placket button position", "9 buttons (not including)"),
    ("Decoration stitching on placket", "Machine 0.3 cm top stitching"),
    ("Decoration stitching color on placket", "3894"),
    ("Placket button", "FKE01632"),
    ("Buttonhole thread color on placket", "3894"),
    ("Placket buttonhole direction", "Horizontal Second Buttonhole from bottom"),
    ("Buttonhole", "Machine"),
    ("Buttonhole thread color on collar band", "3894"),
    ("Collar linings", "Collar linings hard"),
    ("First button distance", "The first button distance 4 cm"),
    ("Sewing button style", "Machine buttoning"),
    ("Buttoning thread color", "3894"),
    ("Pocket", "None"),
    ("Hem", "Small Round hem"),
    ("Decoration stitching on shoulder", "Machine 0.6 cm top stitching"),
    ("Cuff", "Hexagonal cuff with 2 buttons &amp; 2 buttonholes"),
    ("Buttonhole thread color on cuff", "3894"),
    ("Long sleeve cuff width", "Cuff width 7 cm"),
    ("Cuff lining", "Cuff lining hard FC390057"),
    ("Cuff pleat", "Double pleat"),
    ("Sleeve vent decoration thread", "0.1 cm top stitching"),
    ("Sleeve vent decoration thread color", "3894"),
    ("Decoration stitching on cuff", "Machine 0.3 cm AMF stitching"),
    ("Decoration stitching color on cuff", "3894"),
    ("Sleeve tab", "None"),
    ("Back", "SIDE PLEATS WITH DOUBLE DARTS"),
    ("Yoke", "Normal yoke"),
    ("Bias cutting", "Inner collar stand + Inner cuff"),
    ("Contrast color position", "Inner right placket + Inner collar stand + Inner cuff + Inner top collar + Inner yoke"),
    ("Contrast fabric", "RMC39053"),
    ("Epaulet", "None"),
    ("Fabric label position", "No Fabric Label"),
    ("Brand label position", "Outer right placket bottom"),
]

SHIRT_MEAS = [
    ("Height", "67.0 (in) = 170.2 cm"), ("Weight", "199.0"), ("Age", "34.0"),
    ("Neck (Finished)", "40.1"),
    ("Full Chest (Finished)", "118.2"),
    ("Darted Waist (Finished)", "0.0"),
    ("Full Stomach (Finished)", "119.8"),
    ("Full Seat (Finished)", "118.5"),
    ("Full Bicep (Finished)", "41.2"),
    ("Left Cuff (Finished)", "25.3"),
    ("Right Cuff (Finished)", "25.3"),
    ("Shoulder Width (Finished)", "47.0"),
    ("Left Sleeve (Finished)", "62.0"),
    ("Right Sleeve (Finished)", "62.2"),
    ("Back Length (Finished)", "81.3"),
    ("Front Length (Finished)", "81.3"),
    ("Neckline (body)", "0.0"),
    ("Nape to Waist Length (body)", "38.1"),
    ("Front Waist Length (body)", "38.6"),
    ("Full Belly (body)", "0.0"),
]

POSTURE = [
    ("Head", "SLIGHTLY FORWARD"),
    ("Neck", "SLIGHTLY THIN"),
    ("Left shoulder", "NORMAL"),
    ("Right shoulder", "NORMAL"),
    ("Front shoulder", "FORWARD SHOULDER"),
    ("Arm adjustment", "SLIGHTLY THIN"),
    ("Arm adjustment", "Forward"),
    ("Armhole depth", "Down 2"),
    ("Pectorales", "SLIGHTLY PECTORALES"),
]

doc = SimpleDocTemplate(
    "sourcing/BlessedDressed-Sample-Spec-Sheet.pdf", pagesize=letter,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
    title="Blessed & Dressed — First Sample Specification Sheet v2", author="Blessed & Dressed")
story = []

header(story, "Sample A — Suit Jacket (Double-Breasted 6x2)")
story.append(Paragraph("Cut to the personal measurements and posture notes on these pages (measurement method: finished measurement, values in cm unless noted; 0.0 = not specified — please derive from the pattern). Shell fabric: navy worsted wool, Super 110s&#8211;120s — please propose options. Trim, thread and lining codes (e.g. FK503237, YZ002, FB2634A1) reference our current component library; nearest equivalents may be proposed.", body))
story.append(Paragraph("Construction &amp; Options", h3))
story.append(opts_table(JACKET_OPTS))
story.append(PageBreak())

header(story, "Sample A — Suit Jacket Measurements + Trousers")
story.append(Paragraph("Jacket — Finished Measurements", h3))
story.append(meas_table(JACKET_MEAS))
story.append(Paragraph("Trousers — Construction &amp; Options", h3))
story.append(opts_table(TROUSER_OPTS))
story.append(PageBreak())

header(story, "Sample A — Trouser Measurements · Sample B — Dress Shirt")
story.append(Paragraph("Trousers — Finished Measurements", h3))
story.append(meas_table(TROUSER_MEAS))
story.append(Paragraph("Dress Shirt — Construction &amp; Options (shell: white cotton poplin, two-ply ~100s — please propose options)", h3))
story.append(opts_table(SHIRT_OPTS))
story.append(PageBreak())

header(story, "Sample B — Shirt Measurements · Posture &amp; Fit Notes")
story.append(Paragraph("Dress Shirt — Finished Measurements", h3))
story.append(meas_table(SHIRT_MEAS))
story.append(Paragraph("Posture &amp; Figure Adjustments (assessed in person)", h3))
story.append(opts_table(POSTURE))
story.append(Paragraph("Notes", h3))
story.append(opts_table([
    ("Purpose", "Evaluate sewing quality, construction, finishing and fit accuracy against the measurements above, before discussing an ongoing MTM program."),
    ("Measurements in production", "All client measurements are taken in person by Blessed &amp; Dressed during private consultations (full body measurements and garment measurements). Each order arrives as a per-order spec sheet in this format."),
    ("Tolerance", "&#177;1.0 cm on lengths and circumferences, &#177;0.5 cm on collar, shoulder and cuffs."),
    ("Shipping", "FedEx/DHL to the United States (Louisiana, ZIP 71234 area); exact address confirmed at order."),
    ("Contact", "Chase Stanley · Founder · chasestanley91@gmail.com"),
]))

def _footer(canvas, doc_):
    canvas.saveState()
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(GREY)
    canvas.drawRightString(letter[0] - 18 * mm, 8 * mm, f"Blessed & Dressed — Sample Spec v2 — page {canvas.getPageNumber()}")
    canvas.restoreState()

doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
print("built v2")
