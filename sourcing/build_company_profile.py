#!/usr/bin/env python3
"""Blessed & Dressed bilingual company profile (会社概要) for Japanese suppliers.

Page 1 Japanese, page 2 English. Facts are drawn only from what the owner has
stated; unknowns are left as visible [ ] placeholders for him to fill.
Run: python3 sourcing/build_company_profile.py
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))
pdfmetrics.registerFont(UnicodeCIDFont("HeiseiMin-W3"))
JP = "HeiseiKakuGo-W5"
JPM = "HeiseiMin-W3"

NAVY = colors.HexColor("#1F2A44")
GOLD = colors.HexColor("#96763A")
LIGHT = colors.HexColor("#F5F1E6")
GREY = colors.HexColor("#555555")
FILL = colors.HexColor("#B03030")

s = getSampleStyleSheet()
h1 = ParagraphStyle("h1", parent=s["Title"], fontName="Times-Bold", fontSize=22, textColor=NAVY, alignment=0, spaceAfter=1)
h1j = ParagraphStyle("h1j", parent=s["Title"], fontName=JPM, fontSize=15, textColor=NAVY, alignment=0, spaceAfter=2)
sub = ParagraphStyle("sub", parent=s["Normal"], fontName=JP, fontSize=8.5, textColor=GREY, spaceAfter=10)
subE = ParagraphStyle("subE", parent=s["Normal"], fontName="Helvetica", fontSize=8.5, textColor=GREY, spaceAfter=10)
h3 = ParagraphStyle("h3", parent=s["Heading3"], fontName=JP, fontSize=10.5, textColor=GOLD, spaceBefore=10, spaceAfter=4)
h3E = ParagraphStyle("h3E", parent=s["Heading3"], fontName="Helvetica-Bold", fontSize=10.5, textColor=GOLD, spaceBefore=10, spaceAfter=4)
bj = ParagraphStyle("bj", parent=s["Normal"], fontName=JP, fontSize=9, leading=14.5)
be = ParagraphStyle("be", parent=s["Normal"], fontName="Helvetica", fontSize=9, leading=13)


def kv(rows, jp=True):
    f = bj if jp else be
    data = [[Paragraph(f"<b>{a}</b>", f), Paragraph(b, f)] for a, b in rows]
    t = Table(data, colWidths=[42 * mm, 128 * mm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [LIGHT, colors.white]),
        ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#DDDDDD")),
    ]))
    return t


def blank(txt):
    return f'<font color="#B03030">[{txt}]</font>'


doc = SimpleDocTemplate(
    "sourcing/BlessedDressed-Company-Profile.pdf", pagesize=A4,
    leftMargin=20 * mm, rightMargin=20 * mm, topMargin=18 * mm, bottomMargin=16 * mm,
    title="Blessed & Dressed 会社概要 / Company Profile", author="Blessed & Dressed")
st = []

# ---------------- PAGE 1 : JAPANESE ----------------
st.append(Paragraph("Blessed &amp; Dressed", h1))
st.append(Paragraph("ブレスト・アンド・ドレスト　会社概要", h1j))
st.append(Paragraph("米国 紳士オーダーメイドスーツ・ドレスシャツ　2026年8月", sub))

st.append(Paragraph("会社概要", h3))
st.append(kv([
    ("社名", "Blessed &amp; Dressed（ブレスト・アンド・ドレスト）"),
    ("代表者", "Chase Stanley（チェイス・スタンレー）"),
    ("所在地", "米国 ルイジアナ州"),
    ("設立", blank("設立年をご記入ください")),
    ("事業内容", "紳士オーダーメイドスーツ・ドレスシャツの受注生産および販売"),
    ("販売形態", "完全予約制・対面接客によるメイド・トゥ・メジャー（MTM）販売"),
    ("連絡先", "chasestanley91@gmail.com"),
    ("ウェブサイト", "現在制作中（公開準備が整い次第ご案内いたします）"),
]))

st.append(Paragraph("事業の特徴 ― 対面採寸によるオーダーメイド", h3))
st.append(Paragraph(
    "当社は過去2年間、お客様お一人おひとりと対面でお会いし、代表者自身が全身の採寸および"
    "着用衣類の採寸を行ってまいりました。姿勢・体型の補正内容もその場で確認し、"
    "お客様ごとの詳細なフィットプロファイルを作成しております。<br/><br/>"
    "受注はすべて1着単位で、既製品の在庫販売は行っておりません。"
    "工場様にお客様の体型を推測していただく必要はなく、採寸・体型補正の判断はすべて"
    "当社が対面にて完了させた上で、仕様書としてご提出いたします。", bj))

st.append(Paragraph("取扱商品", h3))
st.append(Paragraph(
    "・2ピーススーツ／3ピーススーツ　・ジャケット　・ベスト　・スラックス　・ドレスシャツ", bj))

st.append(Paragraph("仕様管理", h3))
st.append(kv([
    ("オプション管理", "オプション項目 370種、選択肢 約2,860件を商品別に管理"),
    ("注文仕様書", "1注文ごとに仕様書を作成（採寸値・体型補正・仕様指示）。PDF・表計算・CSV形式にて提出可能"),
    ("年間生産予定数", blank("年間または月間の予定数量をご記入ください")),
]))

st.append(Paragraph("生産パートナー様に求める条件", h3))
st.append(Paragraph(
    "・1着（1枚）からの受注生産　・日本国内での生産　・安定した納期<br/>"
    "・弊社ブランドネーム（織りネーム）の縫い付け　・米国への直送<br/>"
    "・寸法不良・縫製不良時のお直し／再作成の取り扱いについて事前の取り決め", bj))

st.append(PageBreak())

# ---------------- PAGE 2 : ENGLISH ----------------
st.append(Paragraph("Blessed &amp; Dressed", h1))
st.append(Paragraph("Company Profile — US made-to-measure suits and dress shirts · August 2026", subE))

st.append(Paragraph("Company Overview", h3E))
st.append(kv([
    ("Company", "Blessed &amp; Dressed"),
    ("Founder", "Chase Stanley"),
    ("Location", "Louisiana, United States"),
    ("Established", blank("year to be filled in")),
    ("Business", "Made-to-measure men's suits and dress shirts, produced to order"),
    ("Sales model", "Private, by-appointment in-person consultation"),
    ("Contact", "chasestanley91@gmail.com"),
    ("Website", "Currently in development; URL will follow once public"),
], jp=False))

st.append(Paragraph("How We Work — In-Person Measurement", h3E))
st.append(Paragraph(
    "For the past two years we have met every customer face to face. The founder personally takes "
    "each client's full body measurements and garment measurements, assesses posture and figure in "
    "the room, and builds a complete fit profile for that client.<br/><br/>"
    "Every order is a single garment for one customer; we hold no ready-to-wear stock. Our factory "
    "partners never have to interpret a customer's body from a distance — the measuring and the "
    "figure assessment are completed by us in person, and reach the factory as a written "
    "specification sheet.", be))

st.append(Paragraph("Products", h3E))
st.append(Paragraph(
    "Two-piece and three-piece suits · sport coats · vests · trousers · dress shirts", be))

st.append(Paragraph("Specification Management", h3E))
st.append(kv([
    ("Option library", "370 option categories and approximately 2,860 individual choices, organised by garment"),
    ("Per-order spec", "A written specification sheet per order (measurements, figure adjustments, construction). Available as PDF, spreadsheet or CSV"),
    ("Planned volume", blank("annual or monthly volume to be filled in")),
], jp=False))

st.append(Paragraph("What We Need From a Production Partner", h3E))
st.append(Paragraph(
    "· Production from a single garment　· Made in Japan　· Consistent lead times<br/>"
    "· Our woven brand labels sewn in　· Direct shipping to the United States<br/>"
    "· An agreed procedure for alterations and remakes when a garment misses specification", be))

st.append(Spacer(1, 14))
st.append(Paragraph(
    '<font color="#B03030">Note: items shown in red brackets are placeholders — please provide these '
    'values and the document will be finalised.</font>', be))


def footer(c, d):
    c.saveState()
    c.setFont("Helvetica", 7.5)
    c.setFillColor(GREY)
    c.drawRightString(A4[0] - 20 * mm, 9 * mm,
                      f"Blessed & Dressed · Company Profile · page {c.getPageNumber()} / 2")
    c.restoreState()


doc.build(st, onFirstPage=footer, onLaterPages=footer)
print("built company profile")
