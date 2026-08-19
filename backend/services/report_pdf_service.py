import os
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from schemas.report import ReportDetailResponse


KOREAN_FONT = "ReportKorean"
NAVY = colors.HexColor("#0B3A75")
BLUE = colors.HexColor("#0B63B6")
LIGHT_BLUE = colors.HexColor("#F2F7FC")
LINE = colors.HexColor("#CED8E5")
TEXT = colors.HexColor("#172B4D")
MUTED = colors.HexColor("#66758A")


def _register_fonts() -> None:
    if KOREAN_FONT not in pdfmetrics.getRegisteredFontNames():
        configured_path = os.getenv("REPORT_PDF_FONT_PATH")
        candidates = [
            configured_path,
            r"C:\Windows\Fonts\malgun.ttf",
            "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
            "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
        ]
        font_path = next(
            (Path(path) for path in candidates if path and Path(path).is_file()),
            None,
        )
        if font_path is None:
            raise RuntimeError(
                "PDF용 한글 글꼴을 찾을 수 없습니다. "
                "REPORT_PDF_FONT_PATH에 TTF/TTC 글꼴 경로를 설정하세요."
            )
        pdfmetrics.registerFont(TTFont(KOREAN_FONT, str(font_path)))


def _text(value) -> str:
    return "-" if value is None or value == "" else escape(str(value))


def _date(value) -> str:
    return "-" if value is None else value.strftime("%Y. %m. %d. %H:%M")


def render_report_pdf(detail: ReportDetailResponse) -> bytes:
    """최종 보고서 통합 응답을 다운로드용 A4 PDF로 렌더링합니다."""

    _register_fonts()
    buffer = BytesIO()
    styles = getSampleStyleSheet()
    body = ParagraphStyle(
        "KoreanBody",
        parent=styles["BodyText"],
        fontName=KOREAN_FONT,
        fontSize=9,
        leading=14,
        textColor=TEXT,
    )
    label = ParagraphStyle(
        "KoreanLabel", parent=body, fontSize=8, textColor=MUTED
    )
    value = ParagraphStyle("KoreanValue", parent=body, fontSize=9)
    section_title = ParagraphStyle(
        "KoreanSection",
        parent=body,
        fontSize=11,
        leading=16,
        textColor=NAVY,
        spaceAfter=7,
    )
    report_title = ParagraphStyle(
        "KoreanReportTitle",
        parent=body,
        alignment=TA_CENTER,
        fontSize=20,
        leading=28,
        textColor=NAVY,
    )
    report_subtitle = ParagraphStyle(
        "KoreanReportSubtitle",
        parent=body,
        alignment=TA_CENTER,
        fontSize=9,
        leading=14,
        textColor=MUTED,
    )
    metric_label = ParagraphStyle(
        "KoreanMetricLabel", parent=label, alignment=TA_CENTER
    )
    metric_value = ParagraphStyle(
        "KoreanMetricValue",
        parent=value,
        alignment=TA_CENTER,
        fontSize=13,
        leading=19,
        textColor=BLUE,
    )
    table_header = ParagraphStyle(
        "KoreanTableHeader",
        parent=label,
        textColor=colors.white,
    )

    def footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.line(20 * mm, 14 * mm, 190 * mm, 14 * mm)
        canvas.setFont(KOREAN_FONT, 7)
        canvas.setFillColor(MUTED)
        canvas.drawString(20 * mm, 9 * mm, f"보고서번호 {detail.report_number}")
        canvas.drawRightString(
            190 * mm, 9 * mm, f"{document.page} / 재해복구 업무관리시스템"
        )
        canvas.restoreState()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=20 * mm,
        title=f"{detail.case.case_number} 피해 복구 지원 최종 보고서",
        author=detail.creator.name,
        subject="재해복구 업무 처리 보고서",
    )
    story = [
        Paragraph("재해복구 업무 처리 보고서", report_subtitle),
        Spacer(1, 3 * mm),
        Paragraph("피해 복구 지원 최종 보고서", report_title),
        Spacer(1, 2 * mm),
        Paragraph(_text(detail.case.case_number), report_subtitle),
        Spacer(1, 7 * mm),
    ]

    metadata = [
        [
            Paragraph("신고자", label),
            Paragraph(_text(detail.case.reporter_name), value),
            Paragraph("재난 유형", label),
            Paragraph(_text(detail.case.disaster_type), value),
        ],
        [
            Paragraph("시설 유형", label),
            Paragraph(_text(detail.case.facility_type), value),
            Paragraph("피해 위치", label),
            Paragraph(_text(detail.case.address), value),
        ],
        [
            Paragraph("신고 일시", label),
            Paragraph(_date(detail.case.reported_at), value),
            Paragraph("최종 승인 일시", label),
            Paragraph(_date(detail.approved_at), value),
        ],
        [
            Paragraph("보고서 작성자", label),
            Paragraph(_text(detail.creator.name), value),
            Paragraph("소속", label),
            Paragraph(_text(detail.creator.department), value),
        ],
    ]
    metadata_table = Table(
        metadata, colWidths=[23 * mm, 52 * mm, 26 * mm, 69 * mm]
    )
    metadata_table.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (-1, -1), KOREAN_FONT),
                ("BACKGROUND", (0, 0), (0, -1), LIGHT_BLUE),
                ("BACKGROUND", (2, 0), (2, -1), LIGHT_BLUE),
                ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.extend([metadata_table, Spacer(1, 7 * mm)])

    amount = detail.subsidy.confirmed_amount or detail.subsidy.estimated_amount or 0
    metrics = [
        [
            Paragraph("최종 피해등급", metric_label),
            Paragraph("긴급도 점수", metric_label),
            Paragraph("최종 지원금", metric_label),
        ],
        [
            Paragraph(_text(detail.analysis.damage_grade), metric_value),
            Paragraph(f"{detail.severity.urgency_score:g}점", metric_value),
            Paragraph(f"{amount:,.0f}원", metric_value),
        ],
    ]
    metric_table = Table(metrics, colWidths=[56.5 * mm] * 3)
    metric_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), LIGHT_BLUE),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.white),
                ("TOPPADDING", (0, 0), (-1, 0), 7),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 2),
                ("TOPPADDING", (0, 1), (-1, 1), 2),
                ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
            ]
        )
    )
    story.extend([metric_table, Spacer(1, 7 * mm)])

    approval_table = Table(
        [
            [
                Paragraph("최종 처리 결과", label),
                Paragraph(_text(detail.approval_result), value),
            ]
        ],
        colWidths=[32 * mm, 132 * mm],
    )
    approval_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (0, 0), LIGHT_BLUE),
                ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    summary_box = Table(
        [
            [Paragraph("피해 및 처리 결과", section_title)],
            [Paragraph(_text(detail.summary or detail.case.description), body)],
            [Paragraph(_text(
                " / ".join(filter(None, [
                    f"피해 판정 수정 사유: {detail.verification.reviewer_comment}" if detail.verification.reviewer_comment else None,
                    f"긴급도 수정 사유: {detail.severity.adjustment_reason}" if detail.severity.adjustment_reason else None,
                    f"지원금 수정 사유: {detail.subsidy.adjustment_reason}" if detail.subsidy.adjustment_reason else None,
                ])) or "수정 이력 없음"
            ), body)],
            [approval_table],
        ],
        colWidths=[170 * mm],
    )
    summary_box.setStyle(
        TableStyle(
            [
                ("BOX", (0, 0), (-1, -1), 0.6, LINE),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.extend([summary_box, Spacer(1, 7 * mm)])

    if detail.timeline:
        timeline_rows = [
            [
                Paragraph("처리 일시", table_header),
                Paragraph("처리 단계", table_header),
                Paragraph("처리 내용", table_header),
                Paragraph("처리자", table_header),
            ]
        ]
        timeline_rows.extend(
            [
                Paragraph(_date(event.occurred_at), body),
                Paragraph(_text(event.title), body),
                Paragraph(_text(event.description), body),
                Paragraph(_text(event.actor), body),
            ]
            for event in detail.timeline
        )
        timeline_table = Table(
            timeline_rows,
            colWidths=[31 * mm, 27 * mm, 77 * mm, 35 * mm],
            repeatRows=1,
        )
        timeline_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), NAVY),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.5, LINE),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("TOPPADDING", (0, 0), (-1, -1), 6),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ("LEFTPADDING", (0, 0), (-1, -1), 5),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ]
            )
        )
        story.append(
            KeepTogether(
                [Paragraph("처리 이력", section_title), timeline_table]
            )
        )

    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()
