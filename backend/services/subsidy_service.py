# from decimal import Decimal

# from sqlalchemy import select
# from sqlalchemy.orm import Session

# from models.case import Case
# from models.subsidy import Subsidy
# from models.ai_results import AIResult
# from schemas.subsidy import SubsidyUpsertRequest

# # 출처 및 검증 상태 (2026-07-30 기준):
# # - 계산 구조(지원기준지수, 재난지수, 별표3 매핑)는 1차 출처 확인됨:
# #   「자연재난 구호 및 복구 비용 부담기준 등에 관한 규정」(대통령령 제35875호) 별표1·별표3
# # - "반파는 전파의 50%" 규정은 별표1(제4조제2항 관련) 비고 2 원문으로 확인됨:
# #   "각 시설의 반파 시 지원기준은 전파 시 지원기준의 50퍼센트로 한다."
# # - 다만 "가.주택복구" 항목은 반파·전파·유실을 지원율(30%) 동일 적용으로 묶어두고,
# #   실제 금액 차이는 국토교통부장관이 등급별로 따로 고시하는 단가에서 나오는 구조라
# #   비고2의 50%가 정확히 어느 단계에 적용되는지는 이 문서만으로 완전히 확정되지 않음.
# #   실제 서비스 전환 시 팀 확인 후 고시 원문 단가로 교체 필요.
# SUBSIDY_RATE_TABLE = {
#     "DS0": Decimal("0"),           # 무피해 → 지원 대상 아님
#     "DS3": Decimal("18000000"),    # 반파 (전파의 50%, 별표1 비고 2 반영, 근사치)
#     "DS4": Decimal("36000000"),    # 전파
#     # DS1(경파), DS2(준파)은 아직 지원금 산정 근거 없음 — 영우님/팀 확인 후 추가
# }

# GRADE_LABELS = {
#     "DS0": "무피해",
#     "DS3": "반파",
#     "DS4": "전파",
# }

# # 법령상 정의 (AI 모델의 자체 손상등급 설명이 아니라, 별표1 비고 5·6 원문 인용)
# GRADE_CRITERIA = {
#     "DS0": "손상이 확인되지 않는 상태 (지원 대상 아님)",
#     "DS3": "기둥·벽체·지붕 등 주요 구조부가 파손되어 수리하지 않고는 주택 사용이 불가능한 경우",
#     "DS4": "기둥·벽체·지붕 등의 주요 구조부가 파손되어 개축하지 않고는 주택 사용이 불가능한 경우",
# }

# # "기준단가 × 피해비율 = 지원금" 형태로 화면에 보여주기 위한 값.
# # 실제 단가(원/㎡)가 아니라 "전파 등급 기준액"을 100%로 두고,
# # 별표1 비고2(반파는 전파의 50%)를 비율로 그대로 표현한 것.
# BASE_UNIT_PRICE = SUBSIDY_RATE_TABLE["DS4"]

# GRADE_RATIO_PERCENT = {
#     "DS0": 0,
#     "DS3": 50,
#     "DS4": 100,
# }

# CALCULATION_STANDARD_LABEL = (
#     "「자연재난 구호 및 복구 비용 부담기준 등에 관한 규정」 별표1(제4조제2항 관련)·별표3(제9조제1항 관련)"
# )


# def get_unit_price_and_ratio(damage_grade: str):
#     """등급에 해당하는 기준액(전파 등급 기준)과 비율(%)을 반환한다."""
#     if damage_grade not in GRADE_RATIO_PERCENT:
#         return None, None
#     return BASE_UNIT_PRICE, GRADE_RATIO_PERCENT[damage_grade]


# def build_calculation_note(damage_grade: str, estimated_amount: Decimal) -> str:
#     """피해등급에 맞춰 지원금 산정 근거 문구를 생성한다."""
#     grade_label = GRADE_LABELS.get(damage_grade, damage_grade)
#     criteria = GRADE_CRITERIA.get(damage_grade, "판정 기준 정보 없음")
#     amount_str = f"{int(estimated_amount):,}원"

#     if damage_grade == "DS4":
#         amount_reason = "전파 등급 기준액 100% 적용"
#     elif damage_grade == "DS3":
#         amount_reason = (
#             "전파 등급 기준액의 50% 적용 "
#             "(별표1[제4조제2항 관련] 비고 2: 각 시설의 반파 시 지원기준은 전파 시 지원기준의 50%로 한다)"
#         )
#     elif damage_grade == "DS0":
#         amount_reason = "무피해로 판정되어 지원 대상 아님"
#     else:
#         amount_reason = "산정 근거 확인 필요"

#     lines = [
#         f"[지급 대상 등급] {grade_label}",
#         f"[등급 판정 기준] {criteria} "
#         "(「자연재난 구호 및 복구 비용 부담기준 등에 관한 규정」 별표1 비고)",
#         f"[적용 법령] {CALCULATION_STANDARD_LABEL} 2. 재난복구사업을 위한 지원 - 가. 주택복구",
#         f"[지원금액 산출] {grade_label} 등급 기준액 {amount_str} — {amount_reason}",
#         "[AI 참고사항] 피해등급은 AI 영상 분석으로 1차 분류되었으며, 최종 등급은 담당자 확인 후 결정됩니다.",
#     ]
#     return "\n".join(lines)


# def serialize_subsidy(subsidy: Subsidy) -> dict:
#     """Subsidy ORM 객체를 API 응답용 dict로 변환 (기준액·비율 계산 포함)."""
#     unit_price, ratio_percent = get_unit_price_and_ratio(subsidy.damage_grade)
#     return {
#         "subsidy_id": subsidy.subsidy_id,
#         "case_id": subsidy.case_id,
#         "estimated_amount": subsidy.estimated_amount,
#         "confirmed_amount": subsidy.confirmed_amount,
#         "status": subsidy.status,
#         "damage_grade": subsidy.damage_grade,
#         "calculation_basis": subsidy.calculation_basis,
#         "calculation_standard": CALCULATION_STANDARD_LABEL if subsidy.damage_grade else None,
#         "unit_price": unit_price,
#         "damage_ratio_percent": ratio_percent,
#     }


# def calculate_subsidy(db: Session, case_id: int) -> Subsidy:
#     """행안부 산정기준에 따라 예상 지원금을 계산하고 저장한다."""
#     case = db.get(Case, case_id)
#     if case is None:
#         raise ValueError("사건을 찾을 수 없습니다.")

#     latest_ai = db.scalar(
#         select(AIResult)
#         .where(AIResult.case_id == case_id)
#         .order_by(AIResult.created_at.desc(), AIResult.result_id.desc())
#         .limit(1)
#     )
#     damage_grade = latest_ai.damage_grade if latest_ai else None
#     if damage_grade not in SUBSIDY_RATE_TABLE:
#         raise ValueError(
#             f"알 수 없는 피해등급입니다: {damage_grade!r}. "
#             f"허용값: {list(SUBSIDY_RATE_TABLE)}"
#         )

#     estimated_amount = SUBSIDY_RATE_TABLE[damage_grade]

#     subsidy = db.scalar(
#         select(Subsidy)
#         .where(Subsidy.case_id == case_id)
#         .order_by(Subsidy.subsidy_id.desc())
#         .limit(1)
#     )
#     if subsidy is None:
#         subsidy = Subsidy(case_id=case_id)
#         db.add(subsidy)

#     subsidy.estimated_amount = estimated_amount
#     subsidy.status = "PENDING"
#     subsidy.damage_grade = damage_grade
#     subsidy.calculation_basis = build_calculation_note(damage_grade, estimated_amount)

#     db.commit()
#     db.refresh(subsidy)
#     return subsidy


# def upsert_subsidy(
#     db: Session,
#     case_id: int,
#     payload: SubsidyUpsertRequest,
# ) -> Subsidy | None:
#     """Create or update the subsidy linked to an existing case."""
#     if db.get(Case, case_id) is None:
#         return None
#     subsidy = db.scalar(
#         select(Subsidy)
#         .where(Subsidy.case_id == case_id)
#         .order_by(Subsidy.subsidy_id.desc())
#         .limit(1)
#     )
#     if subsidy is None:
#         subsidy = Subsidy(case_id=case_id)
#         db.add(subsidy)
#     subsidy.estimated_amount = payload.estimated_amount
#     subsidy.confirmed_amount = payload.confirmed_amount
#     subsidy.status = payload.status
#     db.commit()
#     db.refresh(subsidy)
#     return subsidy


# def get_subsidy_by_case_id(
#     db: Session,
#     case_id: int,
# ) -> Subsidy | None:
#     statement = (
#         select(Subsidy)
#         .where(Subsidy.case_id == case_id)
#         .order_by(Subsidy.subsidy_id.desc())
#         .limit(1)
#     )
#     return db.scalar(statement)

from datetime import datetime
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from models.case import Case
from models.subsidy import Subsidy
from schemas.subsidy import SubsidyUpsertRequest
from services.damage_grade_service import resolve_damage_grade

# 출처 및 검증 상태 (2026-07-30 기준):
# - 계산 구조(지원기준지수, 반파율, 별표3 매핑)는 1차 출처 확인됨
#   (자연재난 구호 및 복구 비용 부담기준 등에 관한 규정 별표1·별표3)
# - "반파는 전파의 50%" 규정은 별표1(제4조제2항 관련) 비고 2 원문으로 확인됨:
#   "각 시설별 반파 시 지원기준지수는 전파 시 지원기준지수의 50퍼센트로 한다."
# - 다만 "가.주택복구" 항목은 반파·전파·유실 지원율(30%) 동일 적용으로 묶여있고,
#   실제 금액 차이는 국토교통부 고시에서 별도 등급별로 따로 고시하는 세부 기준에서 나오는 구조로,
#   비고2의 50%가 정확히 어느 단계에 적용되는지는 이 문서만으로 완전히 확정되지 않음.
#   실제 서비스 전환 시 반드시 확인 후 고시 원문 근거로 교체 필요.
SUBSIDY_RATE_TABLE = {
    "DS0": Decimal("0"),           # 무피해 - 지원금액 없음
    # DS1(경파): 기존에는 산정 근거 없어 미확정이었으나, 팀 결정에 따라 0원(지원 대상 제외)으로 처리 (2026-08-03)
    "DS1": Decimal("0"),           # 경파 - 지원 대상 제외 (0원)
    "DS3": Decimal("18000000"),    # 반파 (전파액의 50%, 별표1 비고 2 반영, 근사치)
    "DS4": Decimal("36000000"),    # 전파
    # DS2(준파): 여전히 지원금 산정 기준 없음 -> calculate_subsidy에서 별도 분기(보류) 처리 (2026-08-03)
}

GRADE_LABELS = {
    "DS0": "무피해",
    "DS1": "경파",
    "DS3": "반파",
    "DS4": "전파",
    "DS2": "준파",  # 보류 상태 표시용 라벨
}

# 법령상 정의 (AI 모델의 자체 손상등급 설명이 아니며, 별표1 비고 5·6 원문 인용)
GRADE_CRITERIA = {
    "DS0": "AI 1차 분류상 손상이 확인되지 않는 상태 (지원 대상 아님)",
    # TODO: 팀 확정 기준 문서 확인 후 교체 필요 - 현재는 임시 설명 문구 (법령 인용 아님)
    "DS1": "AI 1차 분류상 경미한 손상으로 판정된 상태 (지원 대상 제외 - 팀 결정, 2026-08-03)",
    "DS3": "기둥·벽체·지붕 등 주요 구조부가 파손되어 수리하지 않고는 주택 사용이 불가능한 경우",
    "DS4": "기둥·벽체·지붕 등의 주요 구조부가 파손되어 개축하지 않고는 주택 사용이 불가능한 경우",
}

# "기준단가 × 피해비율 = 지급금" 형태로 화면에 보여주기 위한 값
# 실제 근거(법령)는 등급 자체가 아니라 "전파 등급 기준액 100%로 잡고,
# 별표1 비고2(반파는 전파의 50%)를 비율로 그대로 표현한 것
BASE_UNIT_PRICE = SUBSIDY_RATE_TABLE["DS4"]

GRADE_RATIO_PERCENT = {
    "DS0": 0,
    "DS1": 0,
    "DS3": 50,
    "DS4": 100,
}

CALCULATION_STANDARD_LABEL = (
    "자연재난 구호 및 복구 비용 부담기준 등에 관한 규정 별표1(제4조제2항 관련)·별표3(제9조제1항 관련)"
)


def get_unit_price_and_ratio(damage_grade: str):
    """등급에 해당하는 기준단가(전파 등급 기준액)와 비율(%)을 반환한다."""
    if damage_grade not in GRADE_RATIO_PERCENT:
        return None, None
    return BASE_UNIT_PRICE, GRADE_RATIO_PERCENT[damage_grade]


def build_calculation_note(damage_grade: str, estimated_amount: Decimal) -> str:
    """피해등급에 맞춰 지원금 산정 근거 문구를 생성한다."""
    grade_label = GRADE_LABELS.get(damage_grade, damage_grade)
    criteria = GRADE_CRITERIA.get(damage_grade, "산정 기준 정보 없음")
    amount_str = f"{int(estimated_amount):,}원"

    if damage_grade == "DS4":
        amount_reason = "전파 등급 기준액의 100% 적용"
    elif damage_grade == "DS3":
        amount_reason = (
            "전파 등급 기준액의 50% 적용 "
            "(별표1[제4조제2항 관련] 비고 2: 각 시설별 반파 시 지원기준지수는 전파 시 지원기준지수의 50%로 한다)"
        )
    elif damage_grade == "DS1":
        # 팀 정책 결정 (2026-08-03): 경파는 지원 대상에서 제외하되, 0원으로 명시 처리 (계산 오류 아님을 명확히 표시)
        amount_reason = "경파로 판정되어 재난지원금 지원 대상에서 제외됨 (0원)"
    elif damage_grade == "DS0":
        amount_reason = "무피해로 판정되어 지급 대상 아님"
    else:
        amount_reason = "산정 근거 확인 필요"

    lines = [
        f"[지급 대상 등급] {grade_label}",
        f"[등급 판정 기준] {criteria} "
        "(자연재난 구호 및 복구 비용 부담기준 등에 관한 규정 별표1 비고)",
        f"[적용 법령] {CALCULATION_STANDARD_LABEL} 2. 자연복구사업을 위한 지원 - 가. 주택복구",
        f"[지원금액 산출] {grade_label} 등급 기준액 {amount_str} - {amount_reason}",
        "[AI 참고사항] 피해등급은 AI 영상 분석으로 1차 분류되었으며, 최종 등급은 담당자 확인 후 결정됩니다.",
    ]
    return "\n".join(lines)


def build_hold_note(damage_grade: str) -> str:
    """지원금 산정을 보류하는 사유를 생성한다 (DS2 준파 등). (2026-08-03 신규 추가)"""
    grade_label = GRADE_LABELS.get(damage_grade, damage_grade)
    lines = [
        f"[지급 대상 등급] {grade_label}",
        "[처리 상태] 보류",
        f"[보류 사유] 현재 AI 1차 분류상 {grade_label} 등급에 대한 지원금 산정 기준이 마련되어 있지 않습니다.",
        "[다음 절차] 담당자 현장조사를 통한 최종 피해등급 재판정이 필요합니다. 재판정 결과에 따라 지원금을 재계산합니다.",
    ]
    return "\n".join(lines)


def serialize_subsidy(subsidy: Subsidy) -> dict:
    """Subsidy ORM 객체를 API 응답용 dict로 변환 (기준단가·비율 계산 포함)."""
    unit_price, ratio_percent = get_unit_price_and_ratio(subsidy.damage_grade)
    return {
        "subsidy_id": subsidy.subsidy_id,
        "case_id": subsidy.case_id,
        "estimated_amount": subsidy.estimated_amount,
        "confirmed_amount": subsidy.confirmed_amount,
        "status": subsidy.status,
        "damage_grade": subsidy.damage_grade,
        "calculation_basis": subsidy.calculation_basis,
        "calculation_standard": CALCULATION_STANDARD_LABEL if subsidy.damage_grade else None,
        "unit_price": unit_price,
        "damage_ratio_percent": ratio_percent,
        "adjustment_reason": subsidy.adjustment_reason,
        "adjusted_at": subsidy.adjusted_at,
    }


def calculate_subsidy(db: Session, case_id: int) -> Subsidy:
    """피해등급에 따라 예상 지원금을 계산하고 저장한다."""
    case = db.get(Case, case_id)
    if case is None:
        raise ValueError("사건을 찾을 수 없습니다.")

    damage_grade = resolve_damage_grade(db, case_id).grade

    subsidy = db.scalar(
        select(Subsidy)
        .where(Subsidy.case_id == case_id)
        .order_by(Subsidy.subsidy_id.desc())
        .limit(1)
    )
    if subsidy is None:
        subsidy = Subsidy(case_id=case_id)
        db.add(subsidy)

    # DS2(준파): 지원금 산정 기준 미확정 -> 계산하지 않고 보류 상태로 저장 (2026-08-03 신규)
    # (기존 로직: DS2도 SUBSIDY_RATE_TABLE에 없어 아래 ValueError로 409 반환 -> 프론트에서 보류 UI로 대응했음)
    if damage_grade == "DS2":
        subsidy.estimated_amount = None
        subsidy.confirmed_amount = None
        subsidy.status = "HOLD"
        subsidy.damage_grade = damage_grade
        subsidy.calculation_basis = build_hold_note(damage_grade)
        db.commit()
        db.refresh(subsidy)
        return subsidy

    # ── 기존 코드 (2026-08-03 이전): DS1/DS2 둘 다 아래에서 ValueError로 막혀 있었음 ──
    # if damage_grade not in SUBSIDY_RATE_TABLE:
    #     raise ValueError(
    #         f"지원할 수 없는 피해등급입니다: {damage_grade!r}. "
    #         f"허용값: {list(SUBSIDY_RATE_TABLE)}"
    #     )
    if damage_grade not in SUBSIDY_RATE_TABLE:
        raise ValueError(
            f"지원할 수 없는 피해등급입니다: {damage_grade!r}. "
            f"허용값: {list(SUBSIDY_RATE_TABLE) + ['DS2(보류)']}"
        )

    estimated_amount = SUBSIDY_RATE_TABLE[damage_grade]

    subsidy.estimated_amount = estimated_amount
    subsidy.confirmed_amount = None
    subsidy.status = "PENDING"
    subsidy.damage_grade = damage_grade
    subsidy.calculation_basis = build_calculation_note(damage_grade, estimated_amount)

    db.commit()
    db.refresh(subsidy)
    return subsidy


def upsert_subsidy(
    db: Session,
    case_id: int,
    payload: SubsidyUpsertRequest,
) -> Subsidy | None:
    """Create or update the subsidy linked to an existing case."""
    if db.get(Case, case_id) is None:
        return None
    subsidy = db.scalar(
        select(Subsidy)
        .where(Subsidy.case_id == case_id)
        .order_by(Subsidy.subsidy_id.desc())
        .limit(1)
    )
    if subsidy is None:
        subsidy = Subsidy(case_id=case_id)
        db.add(subsidy)
    subsidy.estimated_amount = payload.estimated_amount
    subsidy.confirmed_amount = payload.confirmed_amount
    subsidy.status = payload.status
    if payload.adjustment_reason is not None:
        reason = payload.adjustment_reason.strip()
        if not reason:
            raise ValueError("지원금 수정 사유를 입력해야 합니다.")
        subsidy.adjustment_reason = reason
        subsidy.adjusted_at = datetime.now()
    db.commit()
    db.refresh(subsidy)
    return subsidy


def get_subsidy_by_case_id(
    db: Session,
    case_id: int,
) -> Subsidy | None:
    statement = (
        select(Subsidy)
        .where(Subsidy.case_id == case_id)
        .order_by(Subsidy.subsidy_id.desc())
        .limit(1)
    )
    return db.scalar(statement)
