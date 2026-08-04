from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database.database import get_db
from services.rag_service import retrieve_policy_documents

router = APIRouter(prefix="/api/rag", tags=["rag"])

# 피해등급 -> 검색 확장 키워드
GRADE_KEYWORDS = {
    "DS0": "피해없음 조사대상 제외 경미",
    "DS1": "소파 경미 균열 미세균열 단순보수",
    "DS2": "반파 수리 대수선 부분교체 일부파손",
    "DS3": "전파 개축 재건축 주요구조부 파손 사용불가",
    "DS4": "전파 유실 매몰 완전파손 소실 형태없음",
}

# 시설유형 -> 검색 확장 키워드 (필터와 별개로 랭킹에 반영)
FACILITY_KEYWORDS = {
    "house": "주택 주거 세대 기둥 벽체 지붕",
    "livestock": "축사 한우사 유우사 돈사 계사 건축물관리대장",
    "greenhouse": "비닐하우스 온실 농림시설 피해면적",
    "farmland": "농경지 매몰 유실 필지",
    "vessel": "어선 어망 어구 선체 용골",
    "aqua": "양식 증양식 가두리 수산",
    "etc": "공장 광산 부대시설",
}


def _build_query(
    damage_grade: str | None,
    facility_type: str | None,
    keywords: str | None,
) -> str:
    parts: list[str] = ["피해조사 판정기준 지원기준 부담률"]
    if damage_grade:
        parts.append(damage_grade)
        parts.append(GRADE_KEYWORDS.get(damage_grade.upper(), ""))
    if facility_type:
        parts.append(FACILITY_KEYWORDS.get(facility_type.lower(), facility_type))
    if keywords:
        parts.append(keywords)
    return " ".join(part for part in parts if part)


@router.get("/documents")
def search_policy_documents(
    caseId: int | None = Query(default=None),
    damageGrade: str | None = Query(default=None),
    facilityType: str | None = Query(default="house"),
    keywords: str | None = Query(default=None),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """시설유형으로 적용 범위를 좁히고, 피해등급·관찰 키워드로 상위 N건을 인출한다."""
    query = _build_query(damageGrade, facilityType, keywords)
    retrieved = retrieve_policy_documents(
        db,
        query,
        per_document_limit=limit,
        total_limit=limit,
        facility_type=facilityType,
    )

    return {
        "caseId": caseId,
        "query": query,
        "facilityType": facilityType,
        "damageGrade": damageGrade,
        "count": len(retrieved),
        "items": [
            {
                "title": item.document.article,
                "summary": item.matched_content,
                "source": item.document.document_name,
                "article": None,
                "page": None,
                "score": item.relevance_score,
                "documentCode": item.document.document_code,
            }
            for item in retrieved
        ],
    }