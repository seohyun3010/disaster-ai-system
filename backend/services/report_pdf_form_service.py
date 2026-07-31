import json
import os
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from schemas.report import ReportDetailResponse


ROOT = Path(__file__).resolve().parent.parent
FONT_REGULAR = "ReportFormRegular"
FONT_BOLD = "ReportFormBold"
BLACK = colors.black
WHITE = colors.white


def _register_fonts() -> None:
    if FONT_REGULAR in pdfmetrics.getRegisteredFontNames():
        return
    configured = os.getenv("REPORT_PDF_FONT_PATH")
    regular_candidates = [
        configured,
        r"C:\Windows\Fonts\malgun.ttf",
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    ]
    regular = next(
        (Path(item) for item in regular_candidates if item and Path(item).is_file()),
        None,
    )
    if regular is None:
        raise RuntimeError(
            "PDF용 한글 글꼴을 찾을 수 없습니다. "
            "REPORT_PDF_FONT_PATH에 TTF 글꼴 경로를 설정하세요."
        )
    bold_candidates = [
        r"C:\Windows\Fonts\malgunbd.ttf",
        regular,
    ]
    bold = next(path for path in map(Path, bold_candidates) if path.is_file())
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, str(regular)))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, str(bold)))


def _plain(value) -> str:
    return "-" if value is None or value == "" else str(value)


def _safe(value) -> str:
    return escape(_plain(value))


def _date(value) -> str:
    return "-" if value is None else value.strftime("%Y-%m-%d %H:%M")


def _level(value: str | None) -> str:
    return {
        "CRITICAL": "매우 높음",
        "HIGH": "높음",
        "MEDIUM": "보통",
        "LOW": "낮음",
    }.get((value or "").upper(), _plain(value))


def _status(value: str | None) -> str:
    return {
        "APPROVED": "승인",
        "CONFIRMED": "승인",
        "PENDING": "검토 중",
        "REJECTED": "반려",
        "HOLD": "보류",
    }.get((value or "").upper(), _plain(value))


def _grade_label(value: str | None) -> str:
    raw = _plain(value)
    code = raw.upper().split()[0]
    korean = {
        "DS0": "정상",
        "DS1": "경미",
        "DS2": "중간",
        "DS3": "반파",
        "DS4": "전파",
    }.get(code)
    return f"{raw} ({korean})" if korean and korean not in raw else raw


def _analysis_text(detail: ReportDetailResponse) -> str:
    raw = detail.analysis.explanation or detail.summary or "-"
    try:
        parsed = json.loads(raw)
    except (TypeError, json.JSONDecodeError):
        return raw[:500]
    if not isinstance(parsed, dict):
        return str(parsed)[:500]
    reasons = parsed.get("reasons")
    if isinstance(reasons, list) and reasons:
        return " / ".join(str(item) for item in reasons)[:500]
    consistency = parsed.get("consistency")
    if isinstance(consistency, dict):
        reason = consistency.get("reason")
        if reason and reason != "관찰 결과 없음":
            return str(reason)[:500]
    confidence = parsed.get("second_confidence")
    model = parsed.get("model_version")
    parts = [
        f"AI 모델 {_plain(model)} 분석 결과",
        f"신뢰도 {float(confidence) * 100:.1f}%"
        if confidence is not None
        else None,
        f"최종 피해등급 {_grade_label(detail.analysis.damage_grade)}",
    ]
    return ", ".join(item for item in parts if item) + "로 판정함."


def _resolve_image(url: str | None) -> Path | None:
    if not url or url.startswith(("http://", "https://")):
        return None
    normalized = url.replace("\\", "/")
    if normalized.startswith("/uploads/"):
        candidate = ROOT / normalized.lstrip("/")
    else:
        candidate = Path(normalized)
        if not candidate.is_absolute():
            candidate = ROOT / candidate
    return candidate if candidate.is_file() else None


def render_form_report_pdf(detail: ReportDetailResponse) -> bytes:
    """예시 공문 양식을 따르는 흑백 3페이지 최종 보고서."""

    _register_fonts()
    output = BytesIO()

    body = ParagraphStyle(
        "form-body",
        fontName=FONT_REGULAR,
        fontSize=8.2,
        leading=11.4,
        textColor=BLACK,
    )
    center = ParagraphStyle("form-center", parent=body, alignment=TA_CENTER)
    bold = ParagraphStyle("form-bold", parent=body, fontName=FONT_BOLD)
    bold_center = ParagraphStyle(
        "form-bold-center", parent=bold, alignment=TA_CENTER
    )
    title = ParagraphStyle(
        "form-title",
        parent=bold_center,
        fontSize=17,
        leading=22,
    )
    subtitle = ParagraphStyle(
        "form-subtitle",
        parent=center,
        fontSize=8.5,
        leading=12,
    )
    section = ParagraphStyle(
        "form-section",
        parent=bold,
        fontSize=11.5,
        leading=15,
        spaceBefore=2 * mm,
        spaceAfter=2 * mm,
    )
    small = ParagraphStyle("form-small", parent=body, fontSize=7.2, leading=9.5)
    note = ParagraphStyle(
        "form-note",
        parent=body,
        fontSize=7,
        leading=9,
        alignment=TA_CENTER,
    )

    def p(value, style=body):
        return Paragraph(_safe(value), style)

    def table(data, widths, *, row_heights=None, spans=(), aligns=()):
        result = Table(
            data,
            colWidths=widths,
            rowHeights=row_heights,
            hAlign="LEFT",
        )
        commands = [
            ("GRID", (0, 0), (-1, -1), 0.8, BLACK),
            ("BOX", (0, 0), (-1, -1), 1.0, BLACK),
            ("BACKGROUND", (0, 0), (-1, -1), WHITE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ]
        commands.extend(("SPAN", start, end) for start, end in spans)
        commands.extend(("ALIGN", start, end, value) for start, end, value in aligns)
        result.setStyle(TableStyle(commands))
        return result

    def kv(rows, label_width=43 * mm):
        return table(
            [[p(label, bold_center), p(value)] for label, value in rows],
            [label_width, 177 * mm - label_width],
        )

    def header():
        heading_text = Paragraph(
            "자연재난 피해판독 및 지원검토 보고서"
            "<br/><font name='ReportFormRegular' size='8.5'>"
            "AI 기반 피해등급 판정 · 피해심각도 산정 · 지원 검토 보고"
            "</font>",
            title,
        )
        result = Table(
            [
                [
                    heading_text,
                    "",
                    p("보고서 번호", bold_center),
                    p(detail.report_number, center),
                ],
                [
                    "",
                    "",
                    p("보고일시", bold_center),
                    p(_date(detail.created_at), center),
                ],
                [
                    "",
                    "",
                    p("담당자", bold_center),
                    p(
                        f"{detail.creator.name} / "
                        f"{_plain(detail.creator.department)}",
                        center,
                    ),
                ],
            ],
            colWidths=[56 * mm, 56 * mm, 22 * mm, 43 * mm],
            rowHeights=[8 * mm, 8 * mm, 11 * mm],
            hAlign="LEFT",
        )
        result.setStyle(
            TableStyle(
                [
                    ("SPAN", (0, 0), (1, 2)),
                    ("GRID", (2, 0), (3, 2), 0.8, BLACK),
                    ("BOX", (2, 0), (3, 2), 1.0, BLACK),
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                    ("VALIGN", (2, 0), (3, 2), "MIDDLE"),
                    ("LEFTPADDING", (2, 0), (3, 2), 4),
                    ("RIGHTPADDING", (2, 0), (3, 2), 4),
                ]
            )
        )
        return result

    def section_title(number, text):
        return Paragraph(f"{number}. {escape(text)}", section)

    def draw_header(canvas, document):
        canvas.saveState()
        heading = header()
        _, heading_height = heading.wrap(177 * mm, 32 * mm)
        heading.drawOn(canvas, 16 * mm, A4[1] - 10 * mm - heading_height)
        canvas.restoreState()

    def draw_footer(canvas, document):
        canvas.saveState()
        canvas.setFont(FONT_REGULAR, 7)
        canvas.setFillColor(BLACK)
        canvas.drawCentredString(A4[0] / 2, 12 * mm, f"- {document.page} -")
        canvas.drawCentredString(
            A4[0] / 2,
            7.5 * mm,
            "※ 본 보고서는 시스템 저장 정보를 기준으로 작성되며, 담당자의 최종 검토 후 활용함.",
        )
        canvas.restoreState()

    document = BaseDocTemplate(
        output,
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=43 * mm,
        bottomMargin=18 * mm,
        title=f"{detail.case.case_number} 자연재난 피해판독 및 지원검토 보고서",
        author=detail.creator.name,
    )
    frame = Frame(
        document.leftMargin,
        document.bottomMargin,
        document.width,
        document.height,
        id="report_body",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    document.addPageTemplates(
        PageTemplate(
            id="report_pages",
            frames=[frame],
            onPage=draw_header,
            onPageEnd=draw_footer,
            autoNextPageTemplate="report_pages",
        )
    )

    story = [section_title(1, "신고 개요")]
    reporter = _plain(detail.case.reporter_name)
    if detail.case.contact_number:
        reporter = f"{reporter} ({detail.case.contact_number})"
    story.append(
        kv(
            [
                ("신고번호", detail.case.case_number),
                ("재난명 / 유형", detail.case.disaster_type),
                ("발생일시", _date(detail.case.damage_occurred_at)),
                ("피해 위치", detail.case.address),
                ("피해시설 종류", detail.case.facility_type),
                ("신고자", reporter),
                (
                    "접수일시",
                    _date(detail.case.received_at or detail.case.reported_at),
                ),
            ]
        )
    )

    story.extend([section_title(2, "피해사진 및 입력정보")])
    image_cells = []
    captions = []
    for index in range(4):
        item = detail.images[index] if index < len(detail.images) else None
        path = _resolve_image(
            (item.image_url or item.thumbnail_url) if item else None
        )
        if path:
            image = Image(str(path))
            max_w, max_h = 41 * mm, 47 * mm
            scale = min(max_w / image.imageWidth, max_h / image.imageHeight)
            image.drawWidth = image.imageWidth * scale
            image.drawHeight = image.imageHeight * scale
            image.hAlign = "CENTER"
            image_cells.append(image)
        else:
            image_cells.append(p("등록 사진 없음", center))
        captions.append(p(f"사진 {index + 1}", bold_center))
    story.append(
        table(
            [image_cells, captions],
            [44.25 * mm] * 4,
            row_heights=[50 * mm, 8 * mm],
            aligns=[((0, 0), (-1, 0), "CENTER")],
        )
    )
    coordinate = (
        f"{detail.case.latitude}, {detail.case.longitude}"
        if detail.case.latitude is not None and detail.case.longitude is not None
        else "-"
    )
    taken_at = next(
        (item.taken_at for item in detail.images if item.taken_at), None
    )
    story.append(
        table(
            [[p("촬영일시", bold_center), p(_date(taken_at), center), p("촬영자", bold_center), p(detail.case.reporter_name, center), p("좌표", bold_center), p(coordinate, center)]],
            [23 * mm, 34 * mm, 20 * mm, 31 * mm, 18 * mm, 51 * mm],
        )
    )

    story.extend([section_title(3, "AI 피해판독 결과")])
    confidence = detail.analysis.confidence
    confidence_text = "-" if confidence is None else f"{confidence:.2f} ({confidence * 100:.0f}%)"
    result_box = table(
        [
            [
                p("종합 피해등급", bold_center),
                p(_grade_label(detail.analysis.damage_grade), center),
            ],
            [p("신뢰도", bold_center), p(confidence_text, center)],
        ],
        [38 * mm, 47 * mm],
        row_heights=[15 * mm, 15 * mm],
    )
    grades = ["정상", "경미", "중간", "반파", "전파"]
    probability_rows = [[p("등급별 확률", bold_center), ""]]
    for grade in grades:
        selected = grade in _grade_label(detail.analysis.damage_grade)
        value_text = f"{confidence:.2f}" if selected and confidence is not None else "-"
        probability_rows.append([p(grade, center), p(value_text, center)])
    probabilities = table(
        probability_rows,
        [48 * mm, 44 * mm],
        spans=[((0, 0), (1, 0))],
    )
    story.append(
        Table([[result_box, probabilities]], colWidths=[87 * mm, 94 * mm])
    )
    story.append(
        table(
            [
                [p("AI 판정 요약", bold_center)],
                [p(_analysis_text(detail), center)],
            ],
            [177 * mm],
            row_heights=[8 * mm, 17 * mm],
        )
    )

    story.extend(
        [
            NextPageTemplate("report_pages"),
            PageBreak(),
            section_title(4, "피해판단 근거 (VLM 설명)"),
        ]
    )
    explanation = _analysis_text(detail)
    bullets = [item.strip(" ·-") for item in explanation.splitlines() if item.strip()]
    if not bullets:
        bullets = [explanation]
    explanation_markup = "<br/>".join(f"• {escape(item)}" for item in bullets)
    story.append(
        table(
            [
                [p("VLM 분석 내용", bold_center)],
                [Paragraph(explanation_markup, body)],
                [p("등급 판정 근거", bold_center)],
                [
                    p(
                        f"AI 분석 결과와 피해 설명을 종합하여 "
                        f"'{_grade_label(detail.analysis.damage_grade)}' 등급으로 판정함."
                    )
                ],
            ],
            [177 * mm],
            row_heights=[8 * mm, 34 * mm, 8 * mm, 18 * mm],
        )
    )

    story.extend([section_title(5, "피해심각도 및 복구 긴급도")])
    inspection = (
        "필요"
        if detail.analysis.inspection_required
        else "불필요"
        if detail.analysis.inspection_required is False
        else "-"
    )
    story.append(
        kv(
            [
                ("피해심각도", _level(detail.severity.urgency_level)),
                ("복구 긴급도", _level(detail.severity.urgency_level)),
                ("현장조사 필요 여부", inspection),
                (
                    "판단 근거",
                    f"긴급도 점수 {detail.severity.urgency_score:g}점, "
                    f"복구 우선순위 {_plain(detail.severity.recovery_priority)}순위",
                ),
            ]
        )
    )

    story.extend([section_title(6, "지원 검토 결과")])
    estimated = detail.subsidy.estimated_amount or 0
    target = "대상" if estimated > 0 or detail.subsidy.confirmed_amount else "검토 필요"
    story.append(
        kv(
            [
                ("지원 대상 후보 여부", target),
                (
                    "적용 기준",
                    f"자연재난 피해지원 기준 ({_plain(detail.case.facility_type)})",
                ),
                ("지원금 산정 결과", f"{estimated:,.0f}원 (예상)"),
                (
                    "중복 신고 검증 결과",
                    detail.verification.duplicate_report_result,
                ),
                (
                    "중복 수혜 검증 결과",
                    detail.verification.duplicate_benefit_result,
                ),
                (
                    "검토 의견",
                    detail.verification.reviewer_comment or "담당자 최종 검토 필요",
                ),
            ]
        )
    )

    story.extend([section_title(7, "종합 검토의견")])
    story.append(
        kv(
            [
                (
                    "AI 분석 결과 요약",
                    _analysis_text(detail),
                ),
                (
                    "담당자 검토의견",
                    detail.verification.reviewer_comment
                    or "AI 분석 결과 확인 후 최종 지원 여부를 검토함.",
                ),
                (
                    "현장조사 또는 추가자료 필요사항",
                    "구조 안전성, 피해 범위 및 추가 피해 가능성 확인 필요"
                    if detail.analysis.inspection_required
                    else "추가 요청사항 없음",
                ),
            ]
        )
    )

    story.extend(
        [
            NextPageTemplate("report_pages"),
            PageBreak(),
            section_title(8, "최종 처리 결과"),
        ]
    )
    confirmed = detail.subsidy.confirmed_amount or detail.subsidy.estimated_amount or 0
    story.append(
        kv(
            [
                ("처리 결과", detail.approval_result),
                ("최종 피해등급", _grade_label(detail.analysis.damage_grade)),
                ("지원 대상 여부", target),
                ("최종 지원금", f"{confirmed:,.0f}원"),
                (
                    "처리자",
                    f"{detail.creator.name} / {_plain(detail.creator.department)}",
                ),
                ("처리일시", _date(detail.approved_at)),
                ("수정 이력", "-"),
            ]
        )
    )

    story.extend([section_title(9, "첨부자료")])
    attachment_rows = [
        [p(f"□ 원본 피해사진 ({len(detail.images)}건)")],
        [p("□ 위치도 및 현장도")],
        [p("□ AI 분석 로그")],
        [p("□ 관련 법령 및 지원기준")],
        [p("□ 기타 추가자료 (                         )")],
    ]
    story.append(table(attachment_rows, [177 * mm]))

    story.extend([section_title(10, "처리 이력")])
    history = [
        [
            p("일시", bold_center),
            p("처리 단계", bold_center),
            p("처리자", bold_center),
            p("내용", bold_center),
        ]
    ]
    history.extend(
        [
            p(_date(event.occurred_at), center),
            p(event.title, center),
            p(event.actor, center),
            p(event.description),
        ]
        for event in detail.timeline
    )
    story.append(
        table(history, [38 * mm, 38 * mm, 32 * mm, 69 * mm])
    )

    story.extend([section_title(11, "NDMS 연계 정보")])
    story.append(
        kv(
            [
                ("연계 상태", "연계 대기"),
                ("연계 대상", "승인 건"),
                ("연계 예정 항목", "피해등급 / 피해심각도 / 지원금 / 검토의견"),
                ("연계 유의사항", "담당자 최종 승인 후 NDMS 전송"),
            ]
        )
    )
    story.append(Spacer(1, 4 * mm))
    story.append(
        table(
            [
                [
                    p("결재", bold_center),
                    p("담당", bold_center),
                    p("검토", bold_center),
                    p("승인", bold_center),
                ],
                [
                    p("(서명)", center),
                    Paragraph(
                        f"{escape(detail.creator.name)}<br/>"
                        f"({escape(_plain(detail.creator.department))})",
                        center,
                    ),
                    p("(서명)", center),
                    p("(서명)", center),
                ],
            ],
            [35 * mm, 47 * mm, 47 * mm, 48 * mm],
            row_heights=[9 * mm, 20 * mm],
        )
    )

    document.build(story)
    return output.getvalue()
