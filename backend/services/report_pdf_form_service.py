"""
자연재난 피해판독 및 지원검토 보고서 — 행정업무운영편람 간이기안문 양식 기준.

기존 report_pdf_form_service.py(예시 공문 양식)를 대체하기 위한 신규 생성기.
기존 파일은 삭제하지 않고 그대로 두며, report_router.py에서 import만
이 파일의 render_official_report_pdf로 교체해서 사용합니다.

※ 스키마에 아직 없어서 반영 못 한 필드는 코드 내 "TODO(schema)" 주석으로
  표시해 두었습니다. 해당 필드가 스키마에 추가되면 getattr 기본값이
  자동으로 실제 값으로 채워지므로 이 파일을 다시 고칠 필요는 없습니다.
"""

import json
import os
from io import BytesIO
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from PIL import Image as PilImage, ImageOps

from schemas.report import ReportDetailResponse

# 실제 산정 규칙과 동일한 소스를 참조 (시설유형별 가구원수 적용 여부 판단에 사용)
from services.recovery_urgency_rules import HOUSEHOLD_ELIGIBLE_FACILITY_TYPES

ROOT = Path(__file__).resolve().parent.parent
FONT_REGULAR = "ReportFormRegular"
FONT_BOLD = "ReportFormBold"
BLACK = colors.black
GRAY = colors.HexColor("#999999")
LIGHT_SHADE = colors.HexColor("#F2F2F2")
WHITE = colors.white

PAGE_WIDTH = 177 * mm  # A4 - 좌우 마진(각 16.5mm 상당)

# TODO(schema): 판독 모델명은 현재 시스템 고정값. AIResult에 모델명 컬럼이
# 생기면 getattr(detail.analysis, "model_name", None)로 교체.
DEFAULT_MODEL_NAME = "convnextv2-tiny-run4"

# 담당·처리자는 현재 프로젝트 운영상 항상 동일한 1인 담당자가 접수부터
# 최종승인까지 전결로 처리하므로 이름을 고정값으로 표기함.
FIXED_OFFICER_NAME = "박종민 주무관"



# --------------------------------------------------------------------------
# 폰트 / 텍스트 유틸 (기존 report_pdf_form_service.py와 동일 — 그대로 재사용)
# --------------------------------------------------------------------------
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
    bold_candidates = [r"C:\Windows\Fonts\malgunbd.ttf", regular]
    bold = next(path for path in map(Path, bold_candidates) if path.is_file())
    pdfmetrics.registerFont(TTFont(FONT_REGULAR, str(regular)))
    pdfmetrics.registerFont(TTFont(FONT_BOLD, str(bold)))


def _plain(value) -> str:
    return "-" if value is None or value == "" else str(value)


def _safe(value) -> str:
    return escape(_plain(value))


def _date(value, fmt: str = "%Y-%m-%d %H:%M") -> str:
    return "-" if value is None else value.strftime(fmt)


def _dot_date(value) -> str:
    return "-" if value is None else value.strftime("%Y. %m. %d.")


def _level(value: str | None) -> str:
    return {
        "CRITICAL": "매우긴급",
        "HIGH": "긴급",
        "MEDIUM": "보통",
        "LOW": "낮음",
    }.get((value or "").upper(), _plain(value))


# 부위별 손상 관찰 — 프론트(AnalysisResultCard.jsx)와 동일한 순서·라벨.
# ai_result.ai_explanation(JSON)의 "observation" 키에서 그대로 옴.
# 부위별 손상 관찰 — 팀원마다(또는 시설유형마다) observation에 들어있는
# 부위 종류·개수·순서가 다를 수 있어 고정 리스트로 만들면 안 됨.
# 실제 JSON에 있는 키를 있는 순서 그대로 렌더링하고, 알고 있는 키만 한글로
# 바꿔주고 모르는 키는 원문 그대로 표시(= 나중에 이 표에 추가하면 됨).
_DAMAGE_PART_LABELS = {
    "roof": "지붕",
    "structure": "기둥",
    "wall": "벽체",
    "exterior_wall": "외벽",
    "window": "창호",
    "floor": "바닥",
    "foundation": "기초",
    "flooding": "침수",
    "door": "출입구",
    "ceiling": "천장",
}
_DAMAGE_STATUS_LABELS = {
    "DAMAGED": "손상",
    "UNDAMAGED": "이상 없음",
    "NOT_VISIBLE": "확인 불가",
}


def _damage_observation(detail: ReportDetailResponse):
    """AI 분석 결과(ai_explanation JSON)의 observation을 부위별 표로 정리.

    observation에 들어있는 부위를 실제 JSON에 있는 것만, 있는 순서 그대로
    표로 만듦(고정된 부위 목록을 강제하지 않음 — 팀원/시설유형마다 다를 수
    있어서). observation 자체가 없거나 비어 있으면 None을 반환해 문장으로
    대체한다.
    """
    raw = detail.analysis.explanation
    if not raw:
        return None
    try:
        parsed = json.loads(raw)
    except (TypeError, ValueError):
        return None
    observation = parsed.get("observation") or {}
    parts = {k: v for k, v in observation.items() if k != "summary"}
    if not parts:
        return None
    rows = []
    for key, entry in parts.items():
        entry = entry or {}
        status = entry.get("status") or "NOT_VISIBLE"
        note = entry.get("note") or "-"
        label = _DAMAGE_PART_LABELS.get(key, key)
        rows.append([label, _DAMAGE_STATUS_LABELS.get(status, status), note])
    summary = observation.get("summary")
    return rows, summary


_GRADE_LABELS = {
    "DS0": "정상",
    "DS1": "경미",
    "DS2": "중간",
    "DS3": "반파",
    "DS4": "전파",
}


def _grade_label(value: str | None) -> str:
    """DS 코드 대신 한글 등급명만 표기 (보고서에서는 DS0~4 표현을 쓰지 않음)."""
    raw = _plain(value)
    if raw == "-":
        return raw
    code = raw.upper().split()[0]
    return _GRADE_LABELS.get(code, raw)


def _grade_source_label(source: str | None) -> str:
    return {
        "AI_RESULT": "AI 예비판정",
        "OFFICIAL_REVIEW": "담당자 확정",
    }.get(source or "", "-")


# TODO(schema): 코드값이 늘어나면 이 표만 추가하면 됩니다 (DB 컬럼 변경 불필요).
_DISASTER_LABELS = {
    "EARTHQUAKE": "지진",
    "HEAVY_RAIN": "집중호우",
    "HEAVY_SNOW": "대설",
    "TYPHOON": "태풍",
    "WILDFIRE": "산불",
    "LANDSLIDE": "산사태",
}
_FACILITY_LABELS = {
    "HOUSE": "주택",
    "STORE": "상가",
    "FARMLAND": "농경지",
    "LIVESTOCK": "축사",
    "LIVESTOCK_FACILITY": "축사",
    "BUILDING": "건물",
    "ROAD": "도로",
    "RETAINING_WALL": "옹벽",
}


def _coded_label(value: str | None, table: dict[str, str]) -> str:
    """영문 코드 대신 한글 명칭만 표기 (예: HEAVY_RAIN → 집중호우).

    실제 DB 값이 "_FACILITY" 접미사가 붙은 변형(예: LIVESTOCK_FACILITY)으로
    들어올 수 있어, 정확히 일치하는 게 없으면 접미사를 뗀 값으로도 한 번 더
    찾아본다. 그래도 없으면 원문 그대로 반환(=아직 매핑을 모르는 신규 코드).
    """
    raw = _plain(value)
    if raw == "-":
        return raw
    key = raw.upper()
    if key in table:
        return table[key]
    if key.endswith("_FACILITY"):
        stripped = key[: -len("_FACILITY")]
        if stripped in table:
            return table[stripped]
    return raw


def _disaster_label(value: str | None) -> str:
    return _coded_label(value, _DISASTER_LABELS)


def _facility_label(value: str | None) -> str:
    return _coded_label(value, _FACILITY_LABELS)


def _severity_breakdown(detail: ReportDetailResponse):
    """복구 긴급도 산정 근거표 — 배점(만점)은 50/20/30/100으로 고정된 평가
    프레임을 사용함 (팀에서 발표 자료 등에 이미 써온 기준과 동일). 시설유형에
    따라 실제로 받을 수 있는 점수가 이 만점보다 낮게 구조적으로 제한되는
    경우(예: 주택 외 시설은 가구원 수 미적용)에도 "만점" 칸은 그대로 두고
    "산출 점수"·"산정 근거"에서 그 사실을 설명함.

    TODO(schema): ReportSeverityResponse에 damage_score/vulnerability_score/
    infrastructure_score 필드가 추가되면 실제 값이 채워집니다. 아직 없으면
    None을 반환해 호출부가 이전(요약만 표시)으로 자연스럽게 대체합니다.
    """
    ai_score = getattr(detail.severity, "damage_score", None)
    household = getattr(detail.severity, "vulnerability_score", None)
    facility_score = getattr(detail.severity, "infrastructure_score", None)
    if ai_score is None or household is None or facility_score is None:
        return None

    grade = getattr(detail.severity, "applied_damage_grade", None) or detail.analysis.damage_grade
    grade = (grade or "-").upper()
    facility_type = (detail.case.facility_type or "").upper()
    is_house = facility_type in HOUSEHOLD_ELIGIBLE_FACILITY_TYPES

    rows = [
        ["AI 피해등급 점수", "50점", f"{ai_score:g}점", f"{_grade_label(grade)} 등급 적용"],
    ]
    if is_house:
        rows.append([
            "가구원 수 점수", "20점", f"{household:g}점",
            "가구원 수 기준 적용(4점/인, 최대 20점)",
        ])
        rows.append([
            "시설·이재민 긴급도 점수", "30점", f"{facility_score:g}점",
            f"주택 피해등급({_grade_label(grade)}) 기준 적용",
        ])
    else:
        rows.append([
            "가구원 수 점수", "20점", f"{household:g}점",
            "주택 외 시설로 가구원 수 미적용",
        ])
        rows.append([
            "시설·이재민 긴급도 점수", "30점", f"{facility_score:g}점",
            f"시설유형({_facility_label(facility_type)}) 고정 배점 적용",
        ])
    total_score = ai_score + household + facility_score
    total_row = ["합계", "100점", f"{total_score:g}점", "-"]
    return rows, total_row


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


def _optimized_pdf_image(path: Path, *, max_edge: int = 1600) -> BytesIO:
    """PDF 삽입용 이미지만 축소·압축하며 원본 업로드 파일은 변경하지 않는다."""
    with PilImage.open(path) as source:
        image = ImageOps.exif_transpose(source)
        image.thumbnail((max_edge, max_edge), PilImage.Resampling.LANCZOS)
        if image.mode != "RGB":
            background = PilImage.new("RGB", image.size, "white")
            if "A" in image.getbands():
                background.paste(image, mask=image.getchannel("A"))
            else:
                background.paste(image.convert("RGB"))
            image = background

        output = BytesIO()
        image.save(output, format="JPEG", quality=82, optimize=True)
        output.seek(0)
        return output


# --------------------------------------------------------------------------
# 표 스타일: 표 전체 위/아래만 굵은 검정선, 안쪽 줄 사이는 얇은 회색선
# (Style E에서 확정한 "공무원 양식" 표 컨벤션과 동일)
# --------------------------------------------------------------------------
def _framed_style(n_rows: int, *, shade_rows=(), shade_col=None) -> TableStyle:
    commands = [
        ("BOX", (0, 0), (-1, -1), 0.5, GRAY),
        ("INNERGRID", (0, 0), (-1, -1), 0.5, GRAY),
        ("LINEABOVE", (0, 0), (-1, 0), 1.3, BLACK),
        ("LINEBELOW", (0, n_rows - 1), (-1, n_rows - 1), 1.3, BLACK),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    for row in shade_rows:
        commands.append(("BACKGROUND", (0, row), (-1, row), LIGHT_SHADE))
    if shade_col is not None:
        commands.append(("BACKGROUND", (shade_col, 0), (shade_col, n_rows - 1), LIGHT_SHADE))
    return TableStyle(commands)


def render_official_report_pdf(detail: ReportDetailResponse) -> bytes:
    """행정업무운영편람 간이기안문 양식 기준 최종 보고서 (Style E)."""

    _register_fonts()
    buffer = BytesIO()
    optimized_image_buffers: list[BytesIO] = []

    body = ParagraphStyle(
        "off-body", fontName=FONT_REGULAR, fontSize=9.2, leading=13.5, textColor=BLACK,
    )
    center = ParagraphStyle("off-center", parent=body, alignment=TA_CENTER)
    bold = ParagraphStyle("off-bold", parent=body, fontName=FONT_BOLD)
    bold_center = ParagraphStyle("off-bold-center", parent=bold, alignment=TA_CENTER)
    small = ParagraphStyle("off-small", parent=body, fontSize=8, leading=11)
    small_center = ParagraphStyle("off-small-center", parent=small, alignment=TA_CENTER)
    small_gray = ParagraphStyle("off-small-gray", parent=small, textColor=GRAY)
    title_style = ParagraphStyle(
        "off-title", parent=bold_center, fontSize=16, leading=21,
    )
    subtitle_style = ParagraphStyle(
        "off-subtitle", parent=small_center, textColor=GRAY, spaceAfter=3 * mm,
    )
    section_style = ParagraphStyle(
        "off-section", parent=bold, fontSize=10.5, leading=15,
        spaceBefore=3 * mm, spaceAfter=2 * mm,
    )
    item1_style = ParagraphStyle(
        "off-item1", parent=body, leftIndent=0, spaceBefore=1.2 * mm, spaceAfter=1.2 * mm,
    )
    item2_style = ParagraphStyle(
        "off-item2", parent=body, leftIndent=5 * mm, spaceBefore=0.8 * mm, spaceAfter=0.8 * mm,
    )
    item3_style = ParagraphStyle(
        "off-item3", parent=body, leftIndent=10 * mm, spaceBefore=0.5 * mm, spaceAfter=0.5 * mm,
    )
    note_style = ParagraphStyle(
        "off-note", parent=body, fontName=FONT_REGULAR, fontSize=8.3,
        leading=12, textColor=GRAY,
    )

    def p(value, style=body):
        return Paragraph(_safe(value), style)

    def raw_p(html, style=body):
        return Paragraph(html, style)

    def section(number: int, text: str):
        return Paragraph(f"{number}. {escape(text)}", section_style)

    def item(symbol: str, text: str, level: int = 1):
        style = {1: item1_style, 2: item2_style, 3: item3_style}[level]
        return Paragraph(f"{escape(symbol)} {escape(text)}", style)

    def kv_table(rows, label_width=42 * mm):
        data = [[p(label, bold), p(value)] for label, value in rows]
        t = Table(data, colWidths=[label_width, PAGE_WIDTH - label_width])
        t.setStyle(_framed_style(len(rows), shade_col=0))
        return t

    def data_table(header, rows, total_row, widths):
        data = [[p(h, bold_center) for h in header]]
        for row in rows:
            data.append(
                [p(cell, body if i in (0, 3) else center) for i, cell in enumerate(row)]
            )
        data.append([p(cell, bold if i == 0 else bold_center) for i, cell in enumerate(total_row)])
        t = Table(data, colWidths=widths)
        style = _framed_style(len(data), shade_rows=(0, len(data) - 1))
        t.setStyle(style)
        return t

    def parts_table(header, rows, widths):
        """총계 행이 없는 3열 표(부위별 손상 관찰용) — data_table의 합계행 없는 버전."""
        data = [[p(h, bold_center) for h in header]]
        for row in rows:
            data.append(
                [p(cell, body if i in (0, 2) else center) for i, cell in enumerate(row)]
            )
        t = Table(data, colWidths=widths)
        t.setStyle(_framed_style(len(data), shade_rows=(0,)))
        return t

    def approval_strip():
        """관용 보고서 양식 참고 이미지와 동일한 좌/우 두 박스 구조.
        좌: 문서번호/보존기간/공개여부/결재일자 (4행)
        우: 기안/부서장/기관장 서명란 — 팀 실제 결재 라인으로 채움
        (기안=박종민, 부서장=임서현, 기관장=이수연)
        """
        left_w = 78 * mm
        left_label_w = 30 * mm
        left_rows = [
            ("문서번호", f"복구지원과-{detail.report_id}"),
            # TODO: 실제 기록물 보존기간 정책 필드가 생기면 교체 (현재 3년 기본값)
            ("보존기간", "3년"),
            ("공개여부", "부분공개(6)"),  # 개인정보(신고자 성명·연락처) 포함으로 고정
            ("결재일자", _dot_date(detail.approved_at)),
        ]
        left_table = Table(
            [[p(l, bold_center), p(v, center)] for l, v in left_rows],
            colWidths=[left_label_w, left_w - left_label_w],
        )
        left_table.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 1.1, BLACK),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, GRAY),
            ("BACKGROUND", (0, 0), (0, -1), LIGHT_SHADE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ]))

        gap = 4 * mm
        right_w = PAGE_WIDTH - left_w - gap
        col_w = right_w / 3
        right_table = Table(
            [
                [p("기안", bold_center), p("부서장", bold_center), p("기관장", bold_center)],
                [p("박종민", center), p("임서현", center), p("이수연", center)],
            ],
            colWidths=[col_w, col_w, right_w - 2 * col_w],
            rowHeights=[8 * mm, 24 * mm],
        )
        right_table.setStyle(TableStyle([
            ("BOX", (0, 0), (-1, -1), 1.1, BLACK),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, GRAY),
            ("BACKGROUND", (0, 0), (-1, 0), LIGHT_SHADE),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]))

        outer = Table([[left_table, "", right_table]], colWidths=[left_w, gap, right_w])
        outer.setStyle(TableStyle([
            ("LEFTPADDING", (0, 0), (-1, -1), 0),
            ("RIGHTPADDING", (0, 0), (-1, -1), 0),
            ("TOPPADDING", (0, 0), (-1, -1), 0),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))
        return outer

    def divider():
        t = Table([[""]], colWidths=[PAGE_WIDTH])
        t.setStyle(TableStyle([("LINEBELOW", (0, 0), (-1, 0), 1.1, BLACK)]))
        return t

    def image_grid():
        """사진 개수가 고정(4장)이 아니라 실제 등록된 사진 수만큼 늘어남.
        한 줄에 최대 2장까지만 배치(per_row=2) — 4장이면 2장씩 2줄로 나눠
        사진을 더 크게 보여줌. 한 줄에 들어가는 사진이 적을수록(특히 1장뿐
        일 때) 칸 너비와 사진 크기도 그만큼 커져서 화면을 채움. 캡션·
        촬영일시·촬영자·좌표 등 텍스트는 전부 빼고 사진만 중앙정렬로 표시함.
        """
        images = detail.images or []
        per_row = 2
        blocks = []

        if not images:
            blocks.append(
                p("(등록된 피해사진이 없습니다)", small_center)
            )
        else:
            for start in range(0, len(images), per_row):
                chunk = images[start:start + per_row]
                col_w = PAGE_WIDTH / len(chunk)
                row_h = 100 * mm if len(chunk) == 1 else 90 * mm
                max_w = col_w - 8 * mm
                max_h = row_h - 8 * mm
                cells = []
                for item_img in chunk:
                    path = _resolve_image(item_img.image_url or item_img.thumbnail_url)
                    if path:
                        optimized = _optimized_pdf_image(path)
                        optimized_image_buffers.append(optimized)
                        image = Image(optimized)
                        scale = min(max_w / image.imageWidth, max_h / image.imageHeight)
                        image.drawWidth = image.imageWidth * scale
                        image.drawHeight = image.imageHeight * scale
                        image.hAlign = "CENTER"
                        pic = image
                    else:
                        pic = p("(등록 사진 없음)", small_center)
                    cells.append(pic)
                row_table = Table(
                    [cells],
                    colWidths=[col_w] * len(chunk),
                    rowHeights=[row_h],
                )
                row_table.setStyle(TableStyle([
                    ("BOX", (0, 0), (-1, -1), 0.5, GRAY),
                    ("INNERGRID", (0, 0), (-1, -1), 0.5, GRAY),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ]))
                blocks.append(KeepTogether([row_table]))
                blocks.append(Spacer(1, 2 * mm))

        return blocks

    def timeline_table(events):
        rows = []
        for event in events:
            cell_lines = [
                Paragraph(_date(event.occurred_at), small_gray),
                raw_p(
                    f"<b>{escape(event.title)}</b>"
                    f"·{escape(_plain(event.actor))}",
                    body,
                ),
                p(event.description, body),
            ]
            rows.append([p("●", bold_center), cell_lines])
        t = Table(rows, colWidths=[8 * mm, PAGE_WIDTH - 8 * mm])
        t.setStyle(TableStyle([
            ("LINEBEFORE", (0, 0), (0, -1), 1.3, BLACK),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("TOPPADDING", (0, 0), (-1, -1), 3),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ("LEFTPADDING", (0, 0), (-1, -1), 4),
            ("LEFTPADDING", (1, 0), (1, -1), 6),
        ]))
        return t

    def footer(canvas, document):
        canvas.saveState()
        canvas.setFont(FONT_REGULAR, 8)
        canvas.setFillColor(BLACK)
        canvas.drawCentredString(A4[0] / 2, 12 * mm, f"- {document.page} -")
        canvas.restoreState()

    document = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="피해판독 및 지원검토 결과 보고",
        author=FIXED_OFFICER_NAME,
    )

    story = [approval_strip(), Spacer(1, 5 * mm)]

    story.append(
        Paragraph(
            "피해판독 및 지원검토 결과 보고",
            title_style,
        )
    )
    grade_label = _grade_label(detail.analysis.damage_grade)
    story.append(Spacer(1, 3 * mm))
    story.append(Paragraph("행정안전부 재난복구지원국 복구지원과", bold_center))
    story.append(Spacer(1, 3 * mm))
    story.append(divider())
    story.append(Spacer(1, 3 * mm))

    # 1. 신고 개요 — 촬영일시는 이미지(사진) 레벨 정보라 여기서 제외,
    # 2번 섹션의 사진 캡션 행으로 이동. 신고자와 연락처는 별도 행으로 분리.
    story.append(
        KeepTogether([
            section(1, "신고 개요"),
            kv_table(
                [
                    ("신고번호", detail.case.case_number),
                    ("재난명 및 유형", _disaster_label(detail.case.disaster_type)),
                    ("발생일시", _date(detail.case.damage_occurred_at)),
                    ("피해 위치", detail.case.address),
                    ("피해시설 종류", _facility_label(detail.case.facility_type)),
                    ("신고자", _plain(detail.case.reporter_name)),
                    ("연락처", _plain(detail.case.contact_number)),
                    ("접수일시", _date(detail.case.received_at or detail.case.reported_at)),
                ]
            ),
        ])
    )
    story.append(Spacer(1, 4 * mm))

    # 2. AI 예비판정 결과
    story.append(section(2, "AI 예비판정 결과"))
    story.append(
        item(
            "가.",
            f"AI 판독 모델을 이용하여 신고된 피해사진 {len(detail.images)}장에 대해 "
            "1차 분석을 실시하였음.",
        )
    )
    story.append(Spacer(1, 2 * mm))
    model_name = getattr(detail.analysis, "model_name", None) or DEFAULT_MODEL_NAME
    story.append(
        KeepTogether([
            kv_table(
                [
                    ("판독 모델", model_name),
                    ("추천 피해등급", grade_label),
                    ("판정 신뢰도", f"{detail.analysis.confidence * 100:.1f}%" if detail.analysis.confidence is not None else "-"),
                    ("분석 소요시간", f"{detail.analysis.analysis_time:.2f}초" if detail.analysis.analysis_time is not None else "-"),
                    ("판독 시각", _date(detail.analysis.analyzed_at)),
                ]
            )
        ])
    )
    story.append(Spacer(1, 2 * mm))
    if detail.analysis.damage_grade_source == "OFFICIAL_REVIEW":
        judgement = (
            "담당자 검토를 통해 최종 피해등급이 확정됨."
        )
    elif detail.analysis.inspection_required:
        judgement = (
            "판정 신뢰도가 담당자 검토 기준에 미달하여 최종 등급이 확정되지 않았으며, "
            "현장조사를 통한 재확인이 필요한 것으로 분류됨."
        )
    else:
        judgement = "판정 신뢰도가 담당자 검토 기준을 충족하여 AI 예비판정 결과를 활용함."
    story.append(item("나.", judgement))
    # AI 분석 결과(ai_explanation JSON)의 observation을 부위별 표로 반영.
    # AI 분석 자체가 없을 때만(explanation 파싱 불가) 문장으로 대체.
    observation_data = _damage_observation(detail)
    if observation_data:
        obs_rows, obs_summary = observation_data
        story.append(item("1)", "부위별 손상 관찰은 다음과 같음.", level=2))
        story.append(Spacer(1, 2 * mm))
        story.append(
            parts_table(
                ["부위", "상태", "설명"],
                obs_rows,
                widths=[24 * mm, 24 * mm, PAGE_WIDTH - 48 * mm],
            )
        )
        if obs_summary:
            story.append(Spacer(1, 1.5 * mm))
            story.append(Paragraph(escape(obs_summary), item2_style))
    else:
        story.append(item("1)", "부위별 손상 관찰: AI 분석 결과가 없어 확인 불가.", level=2))
    story.append(Spacer(1, 3 * mm))
    story.extend(image_grid())
    story.append(Spacer(1, 3 * mm))
    if detail.analysis.inspection_required:
        dda_note = "본 결과는 AI 예비판정이며, 최종 피해등급은 담당자 검토 후 확정됨."
    else:
        dda_note = "본 결과는 판정 신뢰도 기준을 충족하여 자동 판정으로 최종 확정됨."
    story.append(item("다.", dda_note))
    story.append(Spacer(1, 4 * mm))

    # 3. 피해심각도 및 복구 긴급도 산정
    breakdown = _severity_breakdown(detail)
    section3_children = [
        section(3, "피해심각도 및 복구 긴급도 산정"),
        item(
            "가.",
            "복구 긴급도 산정 규칙에 따라 AI 피해등급 점수, 가구원 수 점수, "
            "시설·이재민 긴급도 점수를 종합하여 복구 긴급도를 산정하였음.",
        ),
    ]
    if breakdown:
        rows, total_row = breakdown
        if "미적용" in rows[1][3]:  # 가구원 수 미적용 (시설유형이 주택이 아님)
            section3_children.append(item("나.", "본 사건은 시설유형이 주택이 아니어서 가구원 수 점수는 적용되지 않았음."))
        section3_children.append(Spacer(1, 2 * mm))
        section3_children.append(
            data_table(
                ["평가 항목", "배점(만점)", "산출 점수", "산정 근거"],
                rows,
                total_row,
                widths=[50 * mm, 24 * mm, 24 * mm, PAGE_WIDTH - 98 * mm],
            )
        )
        section3_children.append(Spacer(1, 2 * mm))
        section3_children.append(
            item(
                "다.",
                f"산정 결과 복구 긴급도 총점은 {detail.severity.urgency_score:g}점"
                f"({total_row[1]} 만점)으로, "
                f"'{_level(detail.severity.urgency_level)}' 단계에 해당하는 것으로 분류됨.",
            )
        )
        if detail.severity.adjustment_reason:
            section3_children.append(item("라.", f"담당자 수정 사유: {detail.severity.adjustment_reason}"))
    else:
        # TODO(schema): 세부 점수가 채워지면 위 breakdown 표가 자동으로 사용됩니다.
        section3_children.append(
            kv_table(
                [
                    ("복구 긴급도 점수", f"{detail.severity.urgency_score:g}점"),
                    ("복구 긴급도 단계", _level(detail.severity.urgency_level)),
                    (
                        "현장조사 필요 여부",
                        "필요" if detail.analysis.inspection_required else (
                            "불필요" if detail.analysis.inspection_required is False else "-"
                        ),
                    ),
                ]
            )
        )
    story.append(KeepTogether(section3_children))
    story.append(Spacer(1, 4 * mm))

    # 4. 지원 검토 결과
    calculation_basis = getattr(detail.subsidy, "calculation_basis", None)
    story.append(
        KeepTogether([
            section(4, "지원 검토 결과"),
            item(
                "가.",
                calculation_basis
                or "「자연재난 구호 및 복구 비용 부담기준 등에 관한 규정」에 따라 "
                "예상 지원금을 산정하였음.",
            ),
            Spacer(1, 2 * mm),
            kv_table(
                [
                    ("피해등급", grade_label),
                    ("시설 유형", _facility_label(detail.case.facility_type)),
                    ("예상 지원금", f"{(detail.subsidy.estimated_amount or 0):,.0f}원"),
                    ("최종 지원금", f"{(detail.subsidy.confirmed_amount or 0):,.0f}원"),
                    ("지원금 수정 사유", detail.subsidy.adjustment_reason or "-"),
                ]
            ),
        ])
    )
    story.append(Spacer(1, 2 * mm))
    story.append(
        Paragraph(
            "※ 예상 지원금은 AI 예비판정 등급을 기준으로 한 산정치이며, "
            "담당자 현장조사 후 최종 등급에 따라 재산정될 수 있음.",
            note_style,
        )
    )
    story.append(Spacer(1, 4 * mm))

    # 5. 최종 처리 결과
    confirmed = detail.subsidy.confirmed_amount or detail.subsidy.estimated_amount or 0
    story.append(
        KeepTogether([
            section(5, "최종 처리 결과"),
            kv_table(
                [
                    ("처리 결과", detail.approval_result),
                    ("최종 피해등급", grade_label),
                    ("지원 대상 여부", "대상" if confirmed > 0 else "검토 필요"),
                    ("최종 지원금", f"{confirmed:,.0f}원"),
                    ("처리자", FIXED_OFFICER_NAME),
                    ("처리일시", _date(detail.approved_at)),
                    ("피해 판정 수정 사유", detail.verification.reviewer_comment or "-"),
                    ("긴급도 수정 사유", detail.severity.adjustment_reason or "-"),
                    ("지원금 수정 사유", detail.subsidy.adjustment_reason or "-"),
                ]
            ),
        ])
    )
    story.append(Spacer(1, 4 * mm))

    # 6. NDMS 연계 정보 — 연계 미구현으로 고정 문구 (기존 코드와 동일하게 유지)
    # ※ 처리 이력 섹션은 요청에 따라 삭제됨 (timeline_table 함수는 남겨두되 미사용)
    story.append(
        KeepTogether([
            section(6, "NDMS 연계 정보"),
            kv_table(
                [
                    ("연계 상태", "연계 대기"),
                    ("연계 대상", "승인 건"),
                    ("연계 예정 항목", "피해등급 / 피해심각도 / 지원금 / 검토의견"),
                    ("연계 유의사항", "담당자 최종 승인 후 NDMS로 전송됨."),
                ]
            ),
        ])
    )
    story.append(Spacer(1, 4 * mm))

    attachment_lines = [
        f"1. 원본 피해사진 {len(detail.images)}건.",
        "2. 위치도 및 현장도 1부.",
        "3. AI 분석 로그 1부.",
        "4. 관련 법령 및 지원기준 1부.  끝.",
    ]
    story.append(
        raw_p(
            "붙임&nbsp;&nbsp;" + "<br/>&nbsp;&nbsp;&nbsp;&nbsp;".join(
                escape(line) for line in attachment_lines
            ),
            body,
        )
    )

    document.build(story, onFirstPage=footer, onLaterPages=footer)
    return buffer.getvalue()
