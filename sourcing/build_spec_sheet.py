#!/usr/bin/env python3
"""Build the Blessed & Dressed first-sample spec sheet PDF (v3).

Construction/option details are transcribed verbatim from the owner's live
order forms (garbled spacing restored, nothing removed). Measurements, posture
profile and fit rules come from the owner's Master Client Specification v3
(2026-08-16), which supersedes the raw order forms; the previous supplier's
name, order numbers and fabric codes are scrubbed from this supplier-facing
sheet. Run: python3 sourcing/build_spec_sheet.py
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
    data = [[Paragraph("<b>Measurement point</b>", bodyw), Paragraph("<b>Enter (finished, cm)</b>", bodyw)]]
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
    story.append(Paragraph("First Sample Specification Sheet (v3) — Prepared for Yamamoto EXCY · August 2026", sub))
    story.append(Paragraph(title, h2))


JACKET_OPTS = [
    ("Shoulder head", "Regular"),
    ("Canvas", "FULL CANVAS (upgraded from fused — owner decision 2026-08-22)"),
    ("Lapel", "Curved Peak Lapel 103&#176;"),
    ("Lapel width", "12.5 CM"),
    ("Folded collar craftsmanship", "Normal"),
    ("Collar tab fabric", "None"),
    ("Collar interlining", "Regular"),
    ("Lapel buttonhole style", "Rome 2.3 CM (M)"),
    ("Lapel buttonhole position", "Each side double"),
    ("Lapel buttonhole color", "Custom color — client selects from catalog"),
    ("Chest pocket", "Straight Welt Chest Pocket in 2.5 cm"),
    ("Lower pocket", "Large Slanted Flap in 6.5 cm"),
    ("Lower pocket bartack", "X-bartack"),
    ("Ticket pocket", "Flap 5 CM, same design with lower pocket (seam excluded)"),
    ("Front style", "DB 6 BY 2"),
    ("Front buttons", "Client selects from button catalog"),
    ("Hem &amp; gusset", "Squared bottom"),
    ("Sleeve vent", "Functional"),
    ("Sleeve vent ribbon position", "Ribbon on button side"),
    ("Sleeve vent ribbon fabric", "As body lining"),
    ("Sleeve buttons", "Client selects from button catalog"),
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
    ("All front buttonholes in one color", "Custom color from catalog"),
    ("Sleeve buttonhole", "By machine"),
    ("Sleeve buttonhole colors", "Alternating: 1st / 3rd / 5th in contrast color from catalog; 2nd / 4th / 6th matching to fabric"),
    ("Sewing button style", "&quot;=&quot; stitching by hands"),
    ("Buttoning thread color", "Custom color from catalog"),
    ("Hand-made", "Individual hand-made parts"),
    ("Facing", "Facing 1"),
    ("Pen pocket", "Left jetted pocket"),
    ("Half lining / full lining", "Full lining"),
    ("Half lining shape", "None"),
    ("Half lining craftsmanship", "NONE"),
    ("Body lining", "Client selects from lining catalog"),
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

BODY_BASELINE = [
    ("Height", "170.2 (under verification vs 175.3 — confirm before cutting)"),
    ("Weight", "88.5&#8211;90.3 kg"), ("Age", "34"),
    ("Chest", "111.8"), ("Stomach", "102.9"), ("Stomach (highest point)", "113.0"),
    ("Waist", "99.1"), ("Seat", "110.5"), ("Thigh", "63.5"),
    ("Neck", "41.1"), ("Knee (finished ref)", "45.7"), ("Calf", "36.8"),
    ("Shoulder (curve-taped)", "47.0 — functional shoulder is 45.0; cut against 44.5&#8211;45.0 finished"),
    ("Front shoulder", "41.9"), ("Pant bottom (ref)", "36.8"),
    ("Bicep", "33.0"), ("Wrist L / R", "17.8 / 17.8"),
    ("Sleeve L / R", "61.0 / 61.7"), ("Outseam L / R", "97.8 / 97.8"),
    ("Nape to waist", "38.1"), ("Front waist length", "38.6"),
    ("U-rise", "71.1"), ("Back waist height", "11.4"), ("Front waist height", "14.5"),
    ("Back length (jacket/shirt)", "73.7"),
    ("Across-back / inseam", "To be confirmed at fitting — available on request"),
]

JACKET_MEAS = [
    ("Full Chest (Finished)", "120.0 (body 111.8, ease +8.2 — proven)"),
    ("Full Stomach (Finished)", "109.0 (proven)"),
    ("Full Belly (Finished)", "116.0 (body highest point 113.0 — tightest margin, do not reduce)"),
    ("Full Seat (Finished)", "118.0 (proven)"),
    ("Full Bicep (Finished)", "41.0 (body 33.0)"),
    ("Full Cuff (Finished)", "28.0"),
    ("Shoulder Width (Finished)", "44.5 (do NOT narrow further)"),
    ("Back Width (Finished)", "46.5"),
    ("Left / Right Sleeve (Finished)", "61.0 / 62.0"),
    ("Back Length (Finished)", "72.5"),
    ("Front Length (Finished)", "75.0 (front&#8722;back balance +2.5 — preserve)"),
    ("First Button Stance", "39.0"),
    ("Neckline (body)", "41.1"),
]

JACKET_ADJ = [
    ("Left shoulder slope", "NORMAL — body reads slightly square; never cut with sloping shoulders (causes a horizontal fold below the collar)"),
    ("Right shoulder slope", "NORMAL — same"),
    ("Front shoulder", "Very Forward"),
    ("Arm", "Generally advanced; bent arm 1.0"),
    ("Armhole depth", "Up 2.5 cm"),
    ("Front chest", "&#8722;1.5 cm"),
    ("Stomach dart", "0.5 cm"),
    ("Head / Neck", "Slightly forward / slightly thin"),
    ("Chest", "Out / slightly pectorales"),
    ("Seat", "Normal — never Flat, never Portly belly"),
    ("Belly", "Normal (fat around)"),
]

TROUSER_OPTS = [
    ("Front pocket", "Slant pocket 2"),
    ("Front pocket depth", "Standard"),
    ("Waistband style", "Metal Adjusters on Outseam"),
    ("Metal adjuster", "Gold metal adjuster — client selects from catalog"),
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
    ("Buttons", "Client selects from button catalog"),
    ("Buttoning thread color", "Custom color from catalog"),
    ("Sewing button style", "Regular sewing by machine"),
    ("Center crease", "With Center Crease"),
    ("Front pocket decoration thread", "Pick stitching by machine 1"),
    ("Back pocket", "Jetted pocket with tab and button 1"),
    ("Back pocket position", "Both side"),
    ("Back pocket seal craft", "X-bartack"),
    ("Back dart", "Double Darts"),
    ("Bottom shape", "Turn-up by machine 5"),
    ("Bottom with skid stick", "Back"),
    ("Inner waist style", "Standard waistband"),
    ("Buttonhole", "By machine"),
    ("Buttonhole thread color", "Custom color from catalog"),
    ("Center waist seam style", "V-shape"),
    ("Center back seam style", "Binding"),
    ("Lining style in pants", "None"),
    ("Fabric label position", "No Fabric Label"),
    ("Brand label position", "No Brand Label"),
]

TROUSER_MEAS = [
    ("Full Waist (Finished)", "99.0 (body +0 — works with side adjusters; do not go below)"),
    ("Full Seat (Finished)", "117.5 (+7.0 ease)"),
    ("Full Thigh (Finished)", "69.5 (+6.0 — seated thigh expands 3&#8211;5 cm)"),
    ("Full Knee (Finished)", "46.5 (slim taper)"),
    ("Full Opening (Finished)", "37.0 (must clear calf 36.8 — floor is 37)"),
    ("U-Rise (Finished)", "74.5 (+3.4 ease — critical for seated comfort)"),
    ("Front Rise (Finished)", "26.0"),
    ("Back Rise (Finished)", "45.5 (raised — back path length for sitting)"),
    ("Left / Right Pant Length (Finished)", "97.8 / 97.8 (equalized)"),
    ("Full Calf (body)", "36.8"),
]

TROUSER_ADJ = [
    ("Hips", "NORMAL — never Very Low (drops the waistband and steals rise)"),
    ("Back crotch", "Do NOT straighten (straightening shortens the seat); back crotch curved 0.5 — adds seated seat length"),
    ("Front centre height", "3 cm"),
    ("Waist height", "Higher 2.0 cm — back only (anchors waistband when seated)"),
    ("Seat / Belly", "Normal / Normal — never Flat, never Portly"),
]

SHIRT_OPTS = [
    ("Sleeve head", "Regular"),
    ("Front", "Normal"),
    ("Collar (lapel)", "Curved in 9 cm"),
    ("Decoration stitching on collar", "Machine 0.5 cm AMF stitching"),
    ("Collar stay", "Fixed"),
    ("Collar stand height", "Collar stand height 3.7 cm (2 BUTTON)"),
    ("Collar stand", "Round collar stand with 2 buttons"),
    ("Buttons (collar stand &amp; placket)", "Client selects from button catalog"),
    ("Placket", "Outer placket"),
    ("Placket width", "Placket width 4.5 cm"),
    ("Placket button position", "9 buttons (not including)"),
    ("Decoration stitching on placket", "Machine 0.3 cm top stitching"),
    ("Placket buttonhole direction", "Horizontal Second Buttonhole from bottom"),
    ("Buttonhole", "Machine"),
    ("Collar linings", "Collar linings hard"),
    ("First button distance", "The first button distance 4 cm"),
    ("Sewing button style", "Machine buttoning"),
    ("Thread colors (all stitching, buttonholes, buttoning)", "Custom color — client selects from catalog"),
    ("Pocket", "None"),
    ("Hem", "Small Round hem"),
    ("Decoration stitching on shoulder", "Machine 0.6 cm top stitching"),
    ("Cuff", "Hexagonal cuff with 2 buttons &amp; 2 buttonholes"),
    ("Long sleeve cuff width", "Cuff width 7 cm"),
    ("Cuff lining", "Cuff lining hard"),
    ("Cuff pleat", "Double pleat"),
    ("Sleeve vent decoration thread", "0.1 cm top stitching"),
    ("Decoration stitching on cuff", "Machine 0.3 cm AMF stitching"),
    ("Sleeve tab", "None"),
    ("Back", "SIDE PLEATS WITH DOUBLE DARTS"),
    ("Yoke", "Normal yoke"),
    ("Bias cutting", "Inner collar stand + Inner cuff"),
    ("Contrast color position", "Inner right placket + Inner collar stand + Inner cuff + Inner top collar + Inner yoke"),
    ("Contrast fabric", "Client selects from fabric catalog"),
    ("Epaulet", "None"),
    ("Fabric label position", "No Fabric Label"),
    ("Brand label position", "Outer right placket bottom"),
]

SHIRT_MEAS = [
    ("Neck (Finished)", "42.0 (body 41.1, ease +0.9)"),
    ("Full Chest (Finished)", "118.2 (body 111.8, ease +6.4 — proven)"),
    ("Full Stomach (Finished)", "116.0 (body 102.9 — trimmed to +13 from proven +18.1, per fit note)"),
    ("Full Seat (Finished)", "118.5 (+8.0)"),
    ("Full Bicep (Finished)", "41.0 (body 33.0, +8.0)"),
    ("Shoulder Width (Finished)", "45.0 (functional shoulder 45.0, ease 0)"),
    ("Left / Right Sleeve (Finished)", "61.5 / 62.5 (body 61.0 / 61.7)"),
    ("Left / Right Cuff (Finished)", "25.3 / 25.9"),
    ("Back Length (Finished)", "76.2"),
    ("Front Length (Finished)", "81.3"),
    ("Nape to Waist Length (body)", "38.1"),
    ("Front Waist Length (body)", "38.6"),
]

SHIRT_ADJ = [
    ("Head / Neck", "Slightly forward / slightly thin"),
    ("Shoulders", "Normal slope, both sides"),
    ("Front shoulder", "Forward shoulder"),
    ("Arm", "Slightly thin + forward"),
    ("Armhole", "Up 2"),
    ("Chest", "Slightly pectorales"),
]

FIT_RULES = [
    ("Shoulders", "Cut against 44.5&#8211;45.0 finished shoulder. The body reads slightly square: a sloping-shoulder cut produces a horizontal fold below the collar; keep slope NORMAL both sides."),
    ("Jacket balance", "Preserve front&#8722;back balance of +2.5 (front length 75.0 vs back 72.5)."),
    ("Belly ease", "The jacket's tightest margin — finished belly 116.0 over a 113.0 body point; do not reduce."),
    ("Trouser back path", "Seated comfort requires U-rise ease &#8805; +3 (target 74.5) and back rise &#8805; 45.5. Non-negotiable for the slim trouser."),
    ("Leg opening", "Must clear the 36.8 calf — floor is 37.0."),
    ("Iteration", "This profile is proven on previous garments; if the factory recommends deviating, please change one variable at a time and tell us which."),
]

doc = SimpleDocTemplate(
    "sourcing/BlessedDressed-Sample-Spec-Sheet.pdf", pagesize=letter,
    leftMargin=18 * mm, rightMargin=18 * mm, topMargin=14 * mm, bottomMargin=14 * mm,
    title="Blessed & Dressed — First Sample Specification Sheet v3", author="Blessed & Dressed")
story = []

header(story, "Client Body Baseline (measured in person)")
story.append(Paragraph("Master client fit profile, verified over multiple completed garments. All values in cm unless noted; ease = finished &#8722; body. The finished measurements and adjustment tables on the following pages are the values to cut against; they already include the correct ease for this client. Shell fabrics: suit in navy worsted wool Super 110s&#8211;120s, shirt in white two-ply ~100s cotton poplin — please propose options. Buttons, thread colors, linings and contrast fabrics are chosen per order from the factory&#8217;s catalogs — please share the ranges available to us.", body))
story.append(Paragraph("Body Baseline", h3))
story.append(opts_table(BODY_BASELINE))
story.append(PageBreak())

header(story, "Sample A — Suit Jacket (Double-Breasted 6x2)")
story.append(Paragraph("Construction &amp; Options", h3))
story.append(opts_table(JACKET_OPTS))
story.append(PageBreak())

header(story, "Sample A — Jacket Measurements &amp; Fit Adjustments")
story.append(Paragraph("Jacket — Finished Measurements (proven fit — cut exactly)", h3))
story.append(meas_table(JACKET_MEAS))
story.append(Paragraph("Jacket — Posture &amp; Figure Adjustments", h3))
story.append(opts_table(JACKET_ADJ))
story.append(PageBreak())

header(story, "Sample A — Trousers")
story.append(Paragraph("Trousers — Construction &amp; Options", h3))
story.append(opts_table(TROUSER_OPTS))
story.append(Paragraph("Trousers — Finished Measurements (cut exactly)", h3))
story.append(meas_table(TROUSER_MEAS))
story.append(Paragraph("Trousers — Posture &amp; Figure Adjustments", h3))
story.append(opts_table(TROUSER_ADJ))
story.append(PageBreak())

header(story, "Sample B — Dress Shirt")
story.append(Paragraph("Construction &amp; Options (shell: white cotton poplin, two-ply ~100s — please propose options)", h3))
story.append(opts_table(SHIRT_OPTS))
story.append(Paragraph("Dress Shirt — Finished Measurements (proven fit, one noted refinement)", h3))
story.append(meas_table(SHIRT_MEAS))
story.append(Paragraph("Dress Shirt — Posture &amp; Figure Adjustments", h3))
story.append(opts_table(SHIRT_ADJ))
story.append(PageBreak())

header(story, "Fit Rules &amp; Notes")
story.append(Paragraph("Fit Rules (learned across completed garments — please respect)", h3))
story.append(opts_table(FIT_RULES))
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
    canvas.drawRightString(letter[0] - 18 * mm, 8 * mm, f"Blessed & Dressed — Sample Spec v3 — page {canvas.getPageNumber()}")
    canvas.restoreState()

doc.build(story, onFirstPage=_footer, onLaterPages=_footer)
print("built v3")
