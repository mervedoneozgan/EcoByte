#!/usr/bin/env python3
"""Generate an audited, content-dense EcoByte corporate PDF from JSON on stdin."""

from __future__ import annotations

import io
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from PIL import Image as PILImage
from PIL import ImageOps
from pypdf import PdfReader
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics.shapes import Drawing, Line, Rect, String
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    LongTable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


NAVY = colors.HexColor("#071016")
DARK_BLUE = colors.HexColor("#102B36")
BLUE = colors.HexColor("#2E8FB0")
CYAN = colors.HexColor("#42B7D6")
GREEN = colors.HexColor("#6DCC5B")
LIME = colors.HexColor("#A5F279")
GOLD = colors.HexColor("#F5C76B")
RED = colors.HexColor("#E76F6F")
TEXT = colors.HexColor("#18313B")
MUTED = colors.HexColor("#657D86")
LINE = colors.HexColor("#D4E2E6")
PALE = colors.HexColor("#F2F8F9")
WHITE = colors.white

ELECTRICITY_COLOR = colors.HexColor("#20B8E6")
NATURAL_GAS_COLOR = colors.HexColor("#F29E32")
TOTAL_COLOR = colors.HexColor("#4DBD74")

PAGE_W, PAGE_H = A4
MARGIN_X = 17 * mm
CONTENT_W = PAGE_W - 2 * MARGIN_X


def first_existing(paths: list[str]) -> str | None:
    return next((path for path in paths if Path(path).exists()), None)


def register_fonts() -> tuple[str, str]:
    regular = first_existing([
        "C:/Windows/Fonts/arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ])
    bold = first_existing([
        "C:/Windows/Fonts/arialbd.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ])
    if regular and bold:
        pdfmetrics.registerFont(TTFont("EcoBody", regular))
        pdfmetrics.registerFont(TTFont("EcoBold", bold))
        return "EcoBody", "EcoBold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()


def tr_number(value, digits=3) -> str:
    number = float(value or 0)
    text = f"{number:,.{digits}f}".rstrip("0").rstrip(".")
    return text.replace(",", "_").replace(".", ",").replace("_", ".")


def safe(value) -> str:
    return str(value if value is not None else "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def grayscale_image_reader(path: Path) -> ImageReader:
    with PILImage.open(path) as image:
        rgba = image.convert("RGBA")
        grayscale = ImageOps.grayscale(rgba).convert("RGBA")
        grayscale.putalpha(rgba.getchannel("A"))
        output = io.BytesIO()
        grayscale.save(output, format="PNG")
    output.seek(0)
    return ImageReader(output)


def styles():
    base = getSampleStyleSheet()
    return {
        "body": ParagraphStyle(
            "Body",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=8.5,
            leading=12,
            textColor=TEXT,
            spaceAfter=5,
        ),
        "small": ParagraphStyle(
            "Small",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=7,
            leading=9,
            textColor=MUTED,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=base["Heading1"],
            fontName=FONT_BOLD,
            fontSize=18,
            leading=22,
            textColor=NAVY,
            spaceAfter=5,
        ),
        "subsection": ParagraphStyle(
            "Subsection",
            parent=base["Heading2"],
            fontName=FONT_BOLD,
            fontSize=11,
            leading=14,
            textColor=DARK_BLUE,
            spaceBefore=6,
            spaceAfter=5,
        ),
        "cover_title": ParagraphStyle(
            "CoverTitle",
            parent=base["Title"],
            fontName=FONT_BOLD,
            fontSize=30,
            leading=34,
            textColor=WHITE,
        ),
        "cover_sub": ParagraphStyle(
            "CoverSub",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9.5,
            leading=14,
            textColor=colors.HexColor("#BDEAF4"),
        ),
        "cover_eyebrow": ParagraphStyle(
            "CoverEyebrow",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=7.5,
            leading=10,
            textColor=LIME,
            spaceAfter=5,
        ),
        "cover_intro": ParagraphStyle(
            "CoverIntro",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9,
            leading=14,
            textColor=colors.HexColor("#C5DCE3"),
        ),
        "metric_label": ParagraphStyle(
            "MetricLabel",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=6.5,
            leading=8,
            textColor=MUTED,
            alignment=TA_LEFT,
        ),
        "metric_value": ParagraphStyle(
            "MetricValue",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=14,
            leading=17,
            textColor=TEXT,
        ),
        "table_header": ParagraphStyle(
            "TableHeader",
            parent=base["BodyText"],
            fontName=FONT_BOLD,
            fontSize=6.7,
            leading=8,
            textColor=WHITE,
            alignment=TA_LEFT,
        ),
        "table_cell": ParagraphStyle(
            "TableCell",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=6.7,
            leading=8.2,
            textColor=TEXT,
        ),
        "table_right": ParagraphStyle(
            "TableRight",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=6.7,
            leading=8.2,
            textColor=TEXT,
            alignment=TA_RIGHT,
        ),
        "toc": ParagraphStyle(
            "TOC",
            parent=base["BodyText"],
            fontName=FONT,
            fontSize=9,
            leading=14,
            textColor=TEXT,
        ),
    }


S = styles()


def p(text, style="body"):
    return Paragraph(safe(text), S[style])


def section(title, subtitle=None):
    items = [Paragraph(safe(title), S["section"])]
    if subtitle:
        items.append(Paragraph(safe(subtitle), S["small"]))
    items.append(Spacer(1, 3 * mm))
    return items


def info_box(title, text, tone=BLUE):
    data = [[
        Paragraph(safe(title), ParagraphStyle("InfoTitle", fontName=FONT_BOLD, fontSize=8, textColor=tone, leading=10)),
        Paragraph(safe(text), S["body"]),
    ]]
    table = Table(data, colWidths=[34 * mm, CONTENT_W - 34 * mm], hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PALE),
        ("BOX", (0, 0), (-1, -1), 0.8, tone),
        ("LINEBEFORE", (0, 0), (0, -1), 3, tone),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return KeepTogether([table, Spacer(1, 3 * mm)])


def metric_cards(metrics):
    cells = []
    for label, value, unit, accent in metrics:
        cells.append(Table(
            [[Paragraph(safe(label.upper()), S["metric_label"])],
             [Paragraph(safe(value), S["metric_value"])],
             [Paragraph(safe(unit), S["small"])]],
            colWidths=[CONTENT_W / len(metrics) - 4 * mm],
            rowHeights=[8 * mm, 11 * mm, 7 * mm],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LINEBEFORE", (0, 0), (0, -1), 3, accent),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]),
        ))
    table = Table([cells], colWidths=[CONTENT_W / len(metrics)] * len(metrics), hAlign="LEFT")
    table.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    return KeepTogether([table, Spacer(1, 5 * mm)])


def styled_table(headers, rows, widths, repeat=1, right_columns=None, font_size=6.7):
    right_columns = set(right_columns or [])
    data = [[Paragraph(safe(header), S["table_header"]) for header in headers]]
    for row in rows:
        cells = []
        for index, value in enumerate(row):
            style = S["table_right"] if index in right_columns else S["table_cell"]
            if font_size != 6.7:
                style = ParagraphStyle(
                    f"Cell{font_size}{index}",
                    parent=style,
                    fontSize=font_size,
                    leading=font_size + 1.5,
                )
            cells.append(Paragraph(safe(value), style))
        data.append(cells)
    table = LongTable(data, colWidths=widths, repeatRows=repeat, hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE]),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return table


def emissions_chart(items):
    drawing = Drawing(CONTENT_W, 70 * mm)
    chart = VerticalBarChart()
    chart.x = 18 * mm
    chart.y = 16 * mm
    chart.width = CONTENT_W - 30 * mm
    chart.height = 45 * mm
    chart.data = [[float(item[1]) for item in items]]
    chart.categoryAxis.categoryNames = [item[0] for item in items]
    chart.categoryAxis.labels.fontName = FONT
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.labels.fontName = FONT
    chart.valueAxis.labels.fontSize = 7
    chart.valueAxis.valueMin = 0
    chart.bars[0].fillColor = BLUE
    chart.bars[0].strokeColor = BLUE
    drawing.add(chart)
    drawing.add(String(18 * mm, 64 * mm, "Emisyon kaynakları (tCO2e)", fontName=FONT_BOLD, fontSize=9, fillColor=NAVY))
    return drawing


def monthly_line_chart(monthly):
    drawing = Drawing(CONTENT_W, 76 * mm)
    chart = HorizontalLineChart()
    chart.x = 18 * mm
    chart.y = 16 * mm
    chart.width = CONTENT_W - 30 * mm
    chart.height = 49 * mm
    chart.data = [
        [float(row["electricityEmission"]) for row in monthly],
        [float(row["naturalGasEmission"]) for row in monthly],
        [float(row["actual"]) for row in monthly],
    ]
    chart.categoryAxis.categoryNames = [row["month"] for row in monthly]
    chart.categoryAxis.labels.fontName = FONT
    chart.categoryAxis.labels.fontSize = 6.5
    chart.valueAxis.labels.fontName = FONT
    chart.valueAxis.labels.fontSize = 6.5
    chart.valueAxis.visibleGrid = 1
    chart.valueAxis.gridStrokeColor = colors.HexColor("#E5EEF1")
    chart.valueAxis.gridStrokeWidth = 0.5
    chart.lines[0].strokeColor = ELECTRICITY_COLOR
    chart.lines[0].strokeWidth = 1.8
    chart.lines[1].strokeColor = NATURAL_GAS_COLOR
    chart.lines[1].strokeWidth = 1.8
    chart.lines[1].strokeDashArray = [4, 2]
    chart.lines[2].strokeColor = TOTAL_COLOR
    chart.lines[2].strokeWidth = 2.8
    drawing.add(chart)
    drawing.add(String(18 * mm, 69 * mm, "Aylık emisyon eğilimi (tCO2e)", fontName=FONT_BOLD, fontSize=9, fillColor=NAVY))
    legend_items = [
        (112 * mm, "Elektrik", ELECTRICITY_COLOR, None, 1.8),
        (139 * mm, "Doğalgaz", NATURAL_GAS_COLOR, [4, 2], 1.8),
        (170 * mm, "Toplam", TOTAL_COLOR, None, 2.8),
    ]
    for x, label, color, dash, width in legend_items:
        line = Line(x, 70.2 * mm, x + 7 * mm, 70.2 * mm, strokeColor=color, strokeWidth=width)
        if dash:
            line.strokeDashArray = dash
        drawing.add(line)
        drawing.add(String(x + 9 * mm, 68.8 * mm, label, fontName=FONT_BOLD, fontSize=6.8, fillColor=color))
    return drawing


def solar_line_chart(monthly):
    drawing = Drawing(CONTENT_W, 76 * mm)
    chart = HorizontalLineChart()
    chart.x = 18 * mm
    chart.y = 16 * mm
    chart.width = CONTENT_W - 30 * mm
    chart.height = 49 * mm
    chart.data = [[float(row["solarProductionKwh"]) for row in monthly]]
    chart.categoryAxis.categoryNames = [row["month"] for row in monthly]
    chart.categoryAxis.labels.fontName = FONT
    chart.categoryAxis.labels.fontSize = 6.5
    chart.valueAxis.labels.fontName = FONT
    chart.valueAxis.labels.fontSize = 6.5
    chart.lines[0].strokeColor = GREEN
    chart.lines[0].strokeWidth = 2
    drawing.add(chart)
    drawing.add(String(18 * mm, 69 * mm, "Aylık GES üretimi (kWh)", fontName=FONT_BOLD, fontSize=9, fillColor=NAVY))
    return drawing


class EcoDocTemplate(BaseDocTemplate):
    def __init__(self, filename, report, company, **kwargs):
        super().__init__(filename, pagesize=A4, **kwargs)
        self.report = report
        self.company = company
        main_frame = Frame(MARGIN_X, 17 * mm, CONTENT_W, PAGE_H - 35 * mm, id="main")
        cover_frame = Frame(MARGIN_X, 0, CONTENT_W, PAGE_H, leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0, id="cover")
        self.addPageTemplates([
            PageTemplate(id="Cover", frames=[cover_frame], onPage=self.cover_page),
            PageTemplate(id="Main", frames=[main_frame], onPage=self.main_page),
        ])

    def cover_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
        canvas.setFillColor(CYAN)
        canvas.rect(0, 0, 2.2 * mm, PAGE_H, fill=1, stroke=0)
        canvas.setFillColor(LIME)
        canvas.rect(2.2 * mm, 0, 1.1 * mm, PAGE_H, fill=1, stroke=0)

        canvas.setStrokeColor(colors.HexColor("#173B48"))
        canvas.setLineWidth(0.8)
        for diameter in (92, 118, 144):
            canvas.circle(PAGE_W + 5 * mm, PAGE_H - 18 * mm, diameter * mm / 2, fill=0, stroke=1)
        canvas.setFillColor(colors.HexColor("#0B2029"))
        canvas.circle(PAGE_W - 18 * mm, 42 * mm, 58 * mm, fill=1, stroke=0)
        canvas.setStrokeColor(colors.HexColor("#1E586A"))
        canvas.setLineWidth(1.2)
        canvas.line(18 * mm, PAGE_H - 61 * mm, PAGE_W - 18 * mm, PAGE_H - 61 * mm)

        logo = Path("frontend/public/ecobyte-logo-transparent.png")
        if logo.exists():
            canvas.drawImage(str(logo), 18 * mm, PAGE_H - 48 * mm, width=48 * mm, height=23 * mm, preserveAspectRatio=True, mask="auto")
        canvas.setFont(FONT_BOLD, 7)
        canvas.setFillColor(LIME)
        canvas.drawRightString(PAGE_W - 18 * mm, PAGE_H - 34 * mm, "KURUMSAL SERA GAZI ENVANTERİ")
        canvas.setFont(FONT, 6.5)
        canvas.setFillColor(colors.HexColor("#8FB8C5"))
        canvas.drawRightString(PAGE_W - 18 * mm, PAGE_H - 40 * mm, f"RAPORLAMA DÖNEMİ · {self.report['period']}")

        canvas.setStrokeColor(colors.HexColor("#33515B"))
        canvas.line(18 * mm, 18 * mm, PAGE_W - 18 * mm, 18 * mm)
        canvas.setFont(FONT, 6.5)
        canvas.setFillColor(colors.HexColor("#8FB8C5"))
        canvas.drawString(18 * mm, 11.5 * mm, f"EcoByte · Belge No ECO-{self.report['id']}")
        canvas.drawRightString(PAGE_W - 18 * mm, 11.5 * mm, "Kurumsal kullanım için hazırlanmıştır")
        canvas.restoreState()

    def main_page(self, canvas, doc):
        canvas.saveState()
        canvas.setFillColor(NAVY)
        canvas.rect(0, PAGE_H - 15 * mm, PAGE_W, 15 * mm, fill=1, stroke=0)
        canvas.setFont(FONT_BOLD, 8)
        canvas.setFillColor(WHITE)
        canvas.drawString(MARGIN_X, PAGE_H - 9.5 * mm, "ECOBYTE | KURUMSAL KARBON EMİSYON RAPORU")
        canvas.setFont(FONT, 7)
        canvas.setFillColor(CYAN)
        canvas.drawRightString(PAGE_W - MARGIN_X, PAGE_H - 9.5 * mm, str(self.report["period"]))
        canvas.setStrokeColor(LINE)
        canvas.line(MARGIN_X, 14 * mm, PAGE_W - MARGIN_X, 14 * mm)
        canvas.setFont(FONT, 6.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(MARGIN_X, 9 * mm, self.company["name"])
        canvas.drawRightString(PAGE_W - MARGIN_X, 9 * mm, f"Sayfa {doc.page}")
        canvas.restoreState()


def build_story(payload):
    report = payload["report"]
    company = payload["company"]
    inventory = payload["inventory"]
    catalog = payload["catalog"]
    annual = next((row for row in inventory["annual"] if int(row["year"]) == int(report["year"])), inventory["annual"][-1])
    monthly = [row for row in inventory["monthly"] if int(row["year"]) == int(annual["year"])]
    fuel_emission = float(inventory["fuel"]["totalEmission"]) if report.get("includeUnassignedFuel") else 0
    gross = float(annual["grossEnergyEmission"]) + fuel_emission
    latest_year = int(inventory["annual"][-1]["year"])
    story = []

    # 1. Cover
    cover_kpis = Table(
        [[
            Paragraph("KAPSAM 1<br/><font size='12'><b>%s tCO2e</b></font><br/><font size='6'>Doğalgaz</font>" % tr_number(annual["scope1NaturalGasEmission"]), ParagraphStyle("CoverKpi", fontName=FONT, fontSize=6.5, leading=11, textColor=colors.HexColor("#DCECF0"))),
            Paragraph("KAPSAM 2<br/><font size='12'><b>%s tCO2e</b></font><br/><font size='6'>Elektrik</font>" % tr_number(annual["scope2ElectricityEmission"]), ParagraphStyle("CoverKpi2", fontName=FONT, fontSize=6.5, leading=11, textColor=colors.HexColor("#DCECF0"))),
            Paragraph("GES ÜRETİMİ<br/><font size='12'><b>%s kWh</b></font><br/><font size='6'>Pozitif etki göstergesi</font>" % tr_number(annual["solarProductionKwh"]), ParagraphStyle("CoverKpi3", fontName=FONT, fontSize=6.5, leading=11, textColor=colors.HexColor("#DCECF0"))),
        ]],
        colWidths=[CONTENT_W / 3] * 3,
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#0C252F")),
            ("LINEBEFORE", (0, 0), (0, 0), 2, NATURAL_GAS_COLOR),
            ("LINEBEFORE", (1, 0), (1, 0), 2, ELECTRICITY_COLOR),
            ("LINEBEFORE", (2, 0), (2, 0), 2, TOTAL_COLOR),
            ("BOX", (0, 0), (-1, -1), 0.7, colors.HexColor("#31515D")),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#31515D")),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 7),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ]),
    )
    story.extend([
        Spacer(1, 67 * mm),
        Paragraph("ISO 14064-1:2018 ESASLI KURUMSAL SERA GAZI ENVANTERİ", S["cover_eyebrow"]),
        Paragraph(safe(company["name"].upper()), ParagraphStyle("CoverOrg", fontName=FONT_BOLD, fontSize=9, textColor=CYAN, leading=12)),
        Spacer(1, 7 * mm),
        Paragraph("Kurumsal Karbon<br/>Emisyon Raporu", S["cover_title"]),
        Spacer(1, 4 * mm),
        Paragraph(
            f"{safe(report['period'])} raporlama dönemi · Kuruluş seviyesinde sera gazı emisyonlarının "
            "nicelendirilmesi, izlenmesi ve raporlanması için hazırlanmış kurumsal envanter.",
            S["cover_intro"],
        ),
        Spacer(1, 12 * mm),
        Table(
            [[Paragraph("KAPSAMLI BRÜT EMİSYON", ParagraphStyle("CoverMetricLabel", fontName=FONT, fontSize=8, textColor=CYAN))],
             [Paragraph(f"{tr_number(gross)} tCO2e", ParagraphStyle("CoverMetric", fontName=FONT_BOLD, fontSize=27, textColor=WHITE, leading=32))],
             [Paragraph(f"Envanter dönemi: {safe(report['period'])} · GES kaçınılan emisyon göstergesi: +{tr_number(annual['avoidedEmission'])} tCO2", ParagraphStyle("CoverMetricSub", fontName=FONT, fontSize=7.5, textColor=LIME, leading=10))]],
            colWidths=[CONTENT_W],
            style=TableStyle([
                ("BACKGROUND", (0, 0), (-1, -1), DARK_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.8, CYAN),
                ("LINEBEFORE", (0, 0), (0, -1), 3, LIME),
                ("LEFTPADDING", (0, 0), (-1, -1), 8 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8 * mm),
                ("TOPPADDING", (0, 0), (-1, 0), 5 * mm),
                ("BOTTOMPADDING", (0, -1), (-1, -1), 5 * mm),
            ]),
        ),
        Spacer(1, 5 * mm),
        cover_kpis,
        NextPageTemplate("Main"),
        PageBreak(),
    ])

    # 2. Document control and contents
    story.extend(section("Belge Kontrolü ve İçindekiler", "Raporun kapsamı, sürümü ve bölüm yapısı"))
    story.append(styled_table(
        ["Alan", "Değer"],
        [
            ["Belge adı", report["name"]],
            ["Belge numarası", f"ECO-{report['id']}"],
            ["Rapor dönemi", report["period"]],
            ["Oluşturma tarihi", report["date"]],
            ["Hazırlayan sistem", "EcoByte Karbon Yönetim Platformu · Python 3 rapor motoru"],
            ["Raporlama referansı", "ISO 14064-1:2018 esaslı kuruluş seviyesi sera gazı envanteri"],
            ["Veri kapsamı", f"{catalog['metadata']['sourceFileCount']} kaynak dosya · {catalog['metadata']['rawRecordCount']} ham kayıt"],
            ["Durum", "Kurumsal PDF · Gerçek envanter verisi · Bağımsız doğrulama beyanı değildir"],
        ],
        [48 * mm, CONTENT_W - 48 * mm],
    ))
    story.append(Spacer(1, 6 * mm))
    contents = [
        "1. Yönetici Özeti",
        "2. Organizasyon ve Raporlama Sınırları",
        "3. Emisyon Envanteri ve Kaynak Dağılımı",
        "4. Aylık Aktivite ve Emisyon Eğilimi",
        "5. GES Üretimi ve Pozitif Etki",
        "6. Yakıt Tüketimi Ayrıntıları",
        "7. Hesaplama Metodolojisi ve Formüller",
        "8. Emisyon Faktörleri ve Güncellik",
        "9. Kaynak Dosya Denetim İzi",
        "10. Veri Kalitesi, Bulgular ve Sonuç",
    ]
    story.append(styled_table(["Bölüm"], [[item] for item in contents], [CONTENT_W], font_size=8))
    story.append(PageBreak())

    # 3. Executive summary
    story.extend(section("1. Yönetici Özeti", "Üst yönetim için temel performans göstergeleri ve önemli bulgular"))
    story.append(metric_cards([
        ("Toplam brüt emisyon", tr_number(gross), "tCO2e", NAVY),
        ("Elektrik emisyonu", tr_number(annual["scope2ElectricityEmission"]), "tCO2e · Kapsam 2", CYAN),
        ("Doğalgaz emisyonu", tr_number(annual["scope1NaturalGasEmission"]), "tCO2e · Kapsam 1", BLUE),
    ]))
    story.append(metric_cards([
        ("Yakıt emisyonu", tr_number(fuel_emission), "tCO2e · dönem atanmamış", GOLD),
        ("GES üretimi", tr_number(annual["solarProductionKwh"]), "kWh", GREEN),
        ("GES pozitif etkisi", f"+{tr_number(annual['avoidedEmission'])}", "tCO2 · brüt toplamdan düşülmez", LIME),
    ]))
    story.append(info_box(
        "Temel sonuç",
        f"{annual['year']} dönemi kapsamlı brüt emisyonu {tr_number(gross)} tCO2e olarak hesaplanmıştır. "
        f"Elektrik ve doğalgaz kaynaklı enerji emisyonu {tr_number(annual['grossEnergyEmission'])} tCO2e'dir. "
        f"Dönem bilgisi bulunmayan yakıt kayıtları {tr_number(fuel_emission)} tCO2e olarak ayrı veri kalitesi notuyla dahil edilmiştir.",
    ))
    story.append(p(
        "GES üretimi emisyon değildir; yenilenebilir enerji üretimi ve kaçınılan emisyon göstergesidir. "
        "Bu nedenle emisyon dağılımı pastasına eklenmez ve kapsamlı brüt emisyon toplamından çıkarılmaz. "
        "Rapor, enerji aktivite verilerinin resmi emisyon faktörleriyle çarpılması ve kilogram sonucunun tona çevrilmesi yöntemiyle hazırlanmıştır."
    ))
    story.append(PageBreak())

    # 4. Boundary and scope
    story.extend(section("2. Organizasyon ve Raporlama Sınırları", "Kurumsal sınır, kaynak sınıfları ve muhasebe yaklaşımı"))
    boundary_rows = [
        ["Elektrik", "Şebekeden çekilen elektrik", "Kapsam 2", "Brüt emisyon", "Aylık"],
        ["Doğalgaz", "Bina bazlı doğalgaz tüketimi", "Kapsam 1", "Brüt emisyon", "Aylık"],
        ["Mazot / Benzin / LPG", "Yakıt kullanım alanları", "Kapsam 1 / 3", "Brüt emisyon", "Dönem atanmamış"],
        ["GES", "Beş tesis / birleşik üretim", "Envanter dışı", "Pozitif etki", "Aylık"],
    ]
    story.append(styled_table(
        ["Kaynak", "Aktivite sınırı", "Sınıf", "Muhasebe", "Dönem"],
        boundary_rows,
        [29 * mm, 54 * mm, 29 * mm, 35 * mm, CONTENT_W - 147 * mm],
    ))
    story.append(Spacer(1, 5 * mm))
    story.append(info_box(
        "Raporlama politikası",
        catalog["metadata"]["calculationPolicy"],
        BLUE,
    ))
    for note in inventory["metadata"]["dataQuality"]:
        story.append(info_box("Kapsam ve veri notu", note, GOLD))
    story.append(PageBreak())

    # 5. Emission inventory
    story.extend(section("3. Emisyon Envanteri ve Kaynak Dağılımı", "Kaynakların kapsamlı brüt emisyon içindeki miktar ve payları"))
    emission_items = [
        ["Elektrik · Kapsam 2", annual["scope2ElectricityEmission"], CYAN],
        ["Doğalgaz · Kapsam 1", annual["scope1NaturalGasEmission"], BLUE],
    ]
    if report.get("includeUnassignedFuel"):
        emission_items.append(["Yakıt · dönem atanmamış", fuel_emission, GOLD])
    story.append(emissions_chart(emission_items))
    distribution_rows = []
    for label, value, _ in emission_items:
        distribution_rows.append([label, tr_number(value), f"%{tr_number((float(value) / gross) * 100, 1)}"])
    distribution_rows.append(["Kapsamlı brüt toplam", tr_number(gross), "%100"])
    story.append(styled_table(
        ["Kaynak", "Emisyon (tCO2e)", "Toplam içindeki pay"],
        distribution_rows,
        [82 * mm, 48 * mm, CONTENT_W - 130 * mm],
        right_columns=[1, 2],
        font_size=8,
    ))
    story.append(info_box(
        "Yorum",
        "Kaynak payları azaltım önceliklerini belirlemek için kullanılmalıdır. Elektrik ve doğalgaz aylık olarak izlenebilir; yakıt tüketiminin aylık eğilime eklenebilmesi için kaynak kayıtlara tarih veya raporlama dönemi alanı eklenmelidir.",
    ))
    story.append(PageBreak())

    # 6. Monthly activities and chart
    story.extend(section("4. Aylık Aktivite ve Emisyon Eğilimi", f"{annual['year']} gerçek aylık enerji kayıtları"))
    story.append(monthly_line_chart(monthly))
    monthly_rows = [
        [
            row["monthName"],
            tr_number(row["electricityKwh"]),
            tr_number(row["naturalGasM3"]),
            tr_number(row["electricityEmission"]),
            tr_number(row["naturalGasEmission"]),
            tr_number(row["actual"]),
        ]
        for row in monthly
    ]
    story.append(styled_table(
        ["Ay", "Elektrik kWh", "Doğalgaz m3", "Elektrik tCO2e", "Doğalgaz tCO2e", "Toplam tCO2e"],
        monthly_rows,
        [23 * mm, 34 * mm, 32 * mm, 32 * mm, 32 * mm, CONTENT_W - 153 * mm],
        right_columns=[1, 2, 3, 4, 5],
    ))
    story.append(PageBreak())

    # 7. Monthly solar
    story.extend(section("5. GES Üretimi ve Pozitif Etki", "Yenilenebilir üretim, tesis dağılımı ve fiziksel doğrulama sınırı"))
    story.append(solar_line_chart(monthly))
    solar_rows = [
        [row["monthName"], tr_number(row["solarProductionKwh"]), tr_number(row["avoidedEmission"])]
        for row in monthly
    ]
    story.append(styled_table(
        ["Ay", "GES üretimi (kWh)", "Pozitif etki (tCO2)"],
        solar_rows,
        [55 * mm, 65 * mm, CONTENT_W - 120 * mm],
        right_columns=[1, 2],
    ))
    story.append(PageBreak())

    # 8. Solar facilities
    story.extend(section("5.1 GES Tesis Dağılımı ve Makullük Kontrolü", "Kaynak verideki tesis kırılımı ve değerlendirme sınırları"))
    if int(annual["year"]) == latest_year:
        facility_rows = [
            [facility["label"], tr_number(facility["productionKwh"]), f"%{tr_number(facility['percent'], 1)}"]
            for facility in inventory["solar"]["facilities"]
        ]
        story.append(styled_table(
            ["Tesis", "Yıllık üretim (kWh)", "Toplam payı"],
            facility_rows,
            [85 * mm, 58 * mm, CONTENT_W - 143 * mm],
            right_columns=[1, 2],
            font_size=8,
        ))
        story.append(Spacer(1, 5 * mm))
        story.append(metric_cards([
            ("Tesis sayısı", str(inventory["solar"]["facilityCount"]), "adet", NAVY),
            ("Aylık ortalama", tr_number(inventory["solar"]["monthlyAverageKwh"]), "kWh", GREEN),
            ("En yüksek ay", tr_number(inventory["solar"]["peakMonthlyProductionKwh"]), "kWh", LIME),
        ]))
    else:
        story.append(info_box("Kapsam notu", f"{annual['year']} kaynak verisi GES üretimini tek birleşik alan olarak içermektedir. Tesis bazlı kırılım bulunmamaktadır.", GOLD))
    story.append(info_box(
        "Fiziksel doğrulama sınırı",
        "Kaynak dosyada tesis satır toplamları doğrulanmıştır. Ancak kurulu güç (kWp), sayaç seri numarası, inverter raporu ve devreye alma tarihleri bulunmadığı için üretimin kapasiteye göre fiziksel makullüğü kesin doğrulanamaz. Bu belgeler rapor eki olarak temin edilmelidir.",
        GOLD,
    ))
    story.append(PageBreak())

    # 9. Fuel
    story.extend(section("6. Yakıt Tüketimi Ayrıntıları", "Mazot, benzin ve LPG için kullanım alanı ve hesaplanan emisyonlar"))
    fuel_rows = [
        [item["fuel"], tr_number(item["litres"]), item["factorUnit"], tr_number(item["emission"])]
        for item in inventory["fuel"]["items"]
    ]
    story.append(styled_table(
        ["Yakıt türü", "Toplam litre", "Faktör birimi", "Emisyon (tCO2e)"],
        fuel_rows,
        [48 * mm, 48 * mm, 58 * mm, CONTENT_W - 154 * mm],
        right_columns=[1, 3],
        font_size=8,
    ))
    story.append(Spacer(1, 5 * mm))
    fuel_use_rows = [
        [row["usageArea"], row["fuel"], tr_number(row["litres"]), tr_number(row["factor"], 5), tr_number(row["emission"])]
        for row in inventory["fuelCalculationLedger"]
    ]
    story.append(styled_table(
        ["Kullanım alanı", "Yakıt", "Litre", "Faktör", "tCO2e"],
        fuel_use_rows,
        [62 * mm, 28 * mm, 30 * mm, 30 * mm, CONTENT_W - 150 * mm],
        right_columns=[2, 3, 4],
    ))
    story.append(info_box("Veri kalitesi uyarısı", inventory["fuel"]["reportingPeriod"] + ". Yakıt emisyonları aylık trende dağıtılmamıştır.", GOLD))
    story.append(PageBreak())

    # 10. Formulas and calculation ledger
    story.extend(section("7. Hesaplama Metodolojisi ve Formüller", "Her sonuç aktivite verisi, faktör ve birim dönüşümüyle izlenebilir"))
    formula_rows = [
        [
            formula["label"],
            formula["symbolicExpression"],
            formula["expression"],
            f"{formula['classification']}. {formula['note']}",
        ]
        for formula in inventory["formulas"]
    ]
    story.append(styled_table(
        ["Hesap", "Sembolik formül", "Sayısal açıklama", "Sınıf ve uygulama notu"],
        formula_rows,
        [34 * mm, 43 * mm, 55 * mm, CONTENT_W - 132 * mm],
        font_size=6.4,
    ))
    story.append(Spacer(1, 6 * mm))
    story.append(Paragraph("Toplam Hesaplama Defteri", S["subsection"]))
    ledger_rows = [
        [
            item["label"],
            f"{tr_number(item['activity'])} {item['activityUnit']}",
            f"{tr_number(item['factor'], 5)} {item['factorUnit']}",
            item["numericFormula"],
            f"{tr_number(item['result'])} {item['resultUnit']}",
        ]
        for item in inventory["calculationLedger"]
    ]
    story.append(styled_table(
        ["Hesap", "Aktivite", "Faktör", "Sayısal formül", "Sonuç"],
        ledger_rows,
        [43 * mm, 32 * mm, 36 * mm, 50 * mm, CONTENT_W - 161 * mm],
        right_columns=[1, 2, 4],
        font_size=5.9,
    ))
    story.append(PageBreak())

    # 11. Factors
    story.extend(section("8. Emisyon Faktörleri ve 2026 Güncellik Durumu", "Kullanılan resmi faktörler ve son kontrol bilgileri"))
    factor_rows = []
    for factor in inventory["factors"].values():
        factor_rows.append([
            factor["label"],
            f"{tr_number(factor['value'], 5)} {factor['unit']}",
            factor["scope"],
            str(factor["sourceYear"]),
            factor.get("publishedAt") or factor.get("sourceUpdatedAt") or "Belirtilmemiş",
            factor["currencyStatus"],
        ])
    story.append(styled_table(
        ["Faktör", "Değer", "Sınıf", "Veri yılı", "Yayım", "2026 durumu"],
        factor_rows,
        [36 * mm, 34 * mm, 31 * mm, 18 * mm, 24 * mm, CONTENT_W - 143 * mm],
        font_size=6.2,
    ))
    story.append(Spacer(1, 5 * mm))
    story.append(info_box("Güncellik politikası", "Faktörlerin veri yılı ile yayın tarihi aynı kavram değildir. Platform, 05.06.2026 tarihinde erişilebilen en güncel resmi yayımları kullanır ve her faktörün güncellik durumunu ayrıca gösterir.", BLUE))
    story.append(PageBreak())

    # 12. Source audit
    story.extend(section("9. Kaynak Dosya Denetim İzi", "Kaynak dosyaların satır sayıları, bütünlük kontrolleri ve SHA-256 parmak izleri"))
    source_rows = [
        [
            dataset["fileName"],
            str(dataset["rowCount"]),
            str(dataset["columnCount"]),
            dataset["audit"]["status"],
            dataset["checksumSha256"],
        ]
        for dataset in catalog["datasets"]
    ]
    story.append(styled_table(
        ["Dosya", "Satır", "Sütun", "Durum", "SHA-256"],
        source_rows,
        [37 * mm, 16 * mm, 16 * mm, 25 * mm, CONTENT_W - 94 * mm],
        font_size=5.8,
    ))
    story.append(Spacer(1, 5 * mm))
    story.append(info_box("Denetim izi", "Her kaynak dosyanın SHA-256 parmak izi rapora eklenmiştir. Aynı dosyanın daha sonra değiştirilip değiştirilmediği bu parmak izleriyle kontrol edilebilir.", BLUE))
    story.append(PageBreak())

    # 13. Validation
    story.extend(section("10. Veri Kalitesi ve Doğrulama Sonuçları", "Doğrulanan kontroller, uyarılar ve düzeltilmesi gereken alanlar"))
    validation_rows = [
        [
            check["label"],
            "Doğrulandı" if check["status"] == "verified" else "Uyarı" if check["status"] == "warning" else "Hata",
            check["detail"],
        ]
        for check in catalog["validationChecks"]
    ]
    story.append(styled_table(
        ["Kontrol", "Durum", "Sonuç"],
        validation_rows,
        [52 * mm, 27 * mm, CONTENT_W - 79 * mm],
        font_size=6.5,
    ))
    story.append(PageBreak())

    # 14. Conclusions
    story.extend(section("11. Sonuçlar ve Önerilen Aksiyonlar", "Veri kalitesini ve azaltım yönetimini güçlendirecek öncelikli adımlar"))
    recommendations = [
        ["1", "Yakıt kayıtlarına tarih/dönem alanı ekleyin", "Yakıt emisyonlarının aylık ve yıllık eğilime doğru atanmasını sağlar.", "Yüksek"],
        ["2", "GES kurulu güç ve sayaç belgelerini sisteme ekleyin", "Yaklaşık 200 bin kWh aylık üretimin fiziksel makullüğünü doğrular.", "Yüksek"],
        ["3", "Aylık doğalgaz emisyon trendini izleyin", "Grafikteki aylık değişimlerin dönemsel takibini sağlar.", "Yüksek"],
        ["4", "2024 ve 2025 GES kapsamlarını eşitleyin", "Yıllar arası performans karşılaştırmasını güvenilir hale getirir.", "Orta"],
        ["5", "Faktör güncelliğini yıllık takvime bağlayın", "Yeni resmi set yayımlandığında hesapların kontrollü güncellenmesini sağlar.", "Orta"],
        ["6", "Aylık tüketim sapmaları için alarm eşikleri tanımlayın", "Elektrik ve doğalgazdaki olağan dışı değişimleri erken tespit eder.", "Orta"],
    ]
    story.append(styled_table(
        ["#", "Aksiyon", "Beklenen sonuç", "Öncelik"],
        recommendations,
        [10 * mm, 58 * mm, 83 * mm, CONTENT_W - 151 * mm],
        font_size=7.2,
    ))
    story.append(Spacer(1, 7 * mm))
    story.append(info_box(
        "Kurumsal değerlendirme",
        f"EcoByte hesaplama altyapısı {catalog['metadata']['rawRecordCount']} ham kaydı eksiksiz okuyarak {tr_number(gross)} tCO2e kapsamlı brüt emisyon ve {tr_number(annual['solarProductionKwh'])} kWh GES üretimi raporlamıştır. "
        "Rapor sonuçları yönetim kararı için kullanılabilir; uyarı statüsündeki veri alanları kapatıldığında denetim güvenilirliği daha da artacaktır.",
        GREEN,
    ))
    story.append(Spacer(1, 15 * mm))
    signoff = Table(
        [
            [p("Hazırlayan", "small"), p("Kontrol Eden", "small"), p("Onaylayan", "small")],
            [p("EcoByte Karbon Yönetim Platformu"), p("Enerji Yönetimi"), p("Üst Yönetim")],
            ["", "", ""],
            [p("Tarih / İmza", "small"), p("Tarih / İmza", "small"), p("Tarih / İmza", "small")],
        ],
        colWidths=[CONTENT_W / 3] * 3,
        rowHeights=[8 * mm, 10 * mm, 18 * mm, 8 * mm],
    )
    signoff.setStyle(TableStyle([
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("BACKGROUND", (0, 0), (-1, 0), PALE),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(signoff)
    return story


def audit_pdf(pdf_bytes: bytes) -> dict:
    reader = PdfReader(io.BytesIO(pdf_bytes))
    page_text_lengths = [len((page.extract_text() or "").strip()) for page in reader.pages]
    sparse_pages = [
        index + 1
        for index, length in enumerate(page_text_lengths)
        if length < (180 if index == 0 else 300)
    ]
    if sparse_pages:
        raise RuntimeError(f"Boş veya gereksiz seyrek PDF sayfaları bulundu: {sparse_pages}")
    if len(reader.pages) < 12:
        raise RuntimeError(f"Kurumsal rapor yeterince uzun değil: {len(reader.pages)} sayfa")
    return {"pages": len(reader.pages), "text_lengths": page_text_lengths}


def audit_input_text(value, path="payload"):
    mojibake_markers = {"Ã", "Ä", "Å", "Â", "â", "�"}
    if isinstance(value, str):
        found = sorted(set(value) & mojibake_markers)
        if found:
            raise RuntimeError(f"Bozuk UTF-8 metni algılandı: {path} -> {found}")
    elif isinstance(value, dict):
        for key, item in value.items():
            audit_input_text(item, f"{path}.{key}")
    elif isinstance(value, list):
        for index, item in enumerate(value):
            audit_input_text(item, f"{path}[{index}]")


def main():
    payload = json.loads(sys.stdin.buffer.read().decode("utf-8"))
    audit_input_text(payload)
    output = io.BytesIO()
    doc = EcoDocTemplate(
        output,
        payload["report"],
        payload["company"],
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=18 * mm,
        bottomMargin=17 * mm,
        title=payload["report"]["name"],
        author="EcoByte",
        subject=f"{payload['company']['name']} kurumsal karbon emisyon raporu",
    )
    doc.build(build_story(payload))
    pdf_bytes = output.getvalue()
    audit_pdf(pdf_bytes)
    sys.stdout.buffer.write(pdf_bytes)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"{type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)
