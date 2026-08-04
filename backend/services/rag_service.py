from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from models.policy_document import PolicyDocument

POLICY_VERSION = "severity-rag-2025-2026.1"
POLICY_DIR = Path(__file__).resolve().parent.parent / "data" / "severity_policy_documents"

# loader:
#   "seed" - scripts/seed_handbook_policy.py 로 적재한 조항 사용 (PDF 텍스트 추출 불가 문서)
#   "pdf"  - PDF 텍스트를 추출해 청크로 적재
# facility_scoped:
#   True 이면 시설유형 필터가 적용된다. False 이면 전 시설 공통으로 항상 검색된다.
SOURCE_DOCUMENTS = (
    {
        "code": "HANDBOOK-2025",
        "name": "2025년 자연재난조사 및 복구계획수립 편람",
        "loader": "seed",
        "code_pattern": "HANDBOOK-2025-%",
        "facility_scoped": True,
        "version": "2025.1",
        "seed_hint": "python scripts/seed_handbook_policy.py 를 실행하세요.",
    },
)

# 시설유형 -> 편람 document_code 시설 구분자
FACILITY_SEGMENTS = {
    "house": "HOUSE",
    "주택": "HOUSE",
    "livestock": "LIVESTOCK",
    "축사": "LIVESTOCK",
    "greenhouse": "FARMFAC",
    "farmfacility": "FARMFAC",
    "비닐하우스": "FARMFAC",
    "농림시설": "FARMFAC",
    "farmland": "FARMLAND",
    "농경지": "FARMLAND",
    "vessel": "VESSEL",
    "어선": "VESSEL",
    "aqua": "AQUA",
    "양식장": "AQUA",
    "etc": "ETC",
    "공장": "ETC",
    "광산": "ETC",
}

# 시설 필터가 걸려도 항상 후보에 포함되는 공통 구분자
COMMON_SEGMENT = "COMMON"


@dataclass(frozen=True)
class RetrievedPolicy:
    document: PolicyDocument
    matched_content: str
    relevance_score: float


def _split_text(text: str, max_chars: int = 1400) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    sentences = re.split(r"(?<=[.。])\s+", normalized)
    chunks: list[str] = []
    current = ""
    for sentence in sentences:
        if current and len(current) + len(sentence) > max_chars:
            chunks.append(current)
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        chunks.append(current)
    return chunks


def _count_documents(db: Session, source: dict) -> int:
    return db.scalar(
        select(func.count(PolicyDocument.document_id)).where(
            PolicyDocument.document_code.like(source["code_pattern"]),
            PolicyDocument.policy_version == source["version"],
        )
    ) or 0


def _load_pdf_source(db: Session, source: dict) -> None:
    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="PDF RAG 모듈이 없습니다. pip install -r requirements-rag.txt 를 실행하세요.",
        ) from exc

    path = POLICY_DIR / source["filename"]
    if not path.exists():
        raise HTTPException(
            status_code=503,
            detail=f"RAG 정책 PDF를 찾을 수 없습니다: {source['filename']}",
        )

    reader = PdfReader(str(path))
    for page_number, page in enumerate(reader.pages, 1):
        for chunk_number, content in enumerate(
            _split_text(page.extract_text() or ""), 1
        ):
            db.add(
                PolicyDocument(
                    document_code=(
                        f"{source['code']}-P{page_number:03d}-C{chunk_number:02d}"
                    ),
                    document_name=source["name"],
                    article=f"PDF {page_number}페이지",
                    content=content,
                    policy_version=source["version"],
                    keywords=content.lower(),
                    is_active=True,
                )
            )
    db.flush()


def ensure_policy_documents(db: Session) -> None:
    """각 소스가 DB에 적재되어 있는지 확인하고, PDF 소스는 필요 시 적재한다."""
    for source in SOURCE_DOCUMENTS:
        if _count_documents(db, source):
            continue

        if source["loader"] == "seed":
            raise HTTPException(
                status_code=503,
                detail=(
                    f"{source['name']} 조항이 적재되지 않았습니다. "
                    f"{source.get('seed_hint', '')}"
                ),
            )

        _load_pdf_source(db, source)


def _tokens(query: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[0-9A-Za-z가-힣]+", query.lower())
        if len(token) > 1
    }


def _facility_conditions(source: dict, facility_type: str | None):
    """시설 필터 조건을 만든다. 해당 없으면 None."""
    if not facility_type or not source.get("facility_scoped"):
        return None
    prefix = source["code"]
    segment = FACILITY_SEGMENTS.get(facility_type.lower())
    if not segment:
        # 편람 사유시설에 없는 유형(도로·옹벽 등 공공시설)은 공통 조항만 인출
        return PolicyDocument.document_code.like(f"{prefix}-{COMMON_SEGMENT}-%")
    return or_(
        PolicyDocument.document_code.like(f"{prefix}-{segment}-%"),
        PolicyDocument.document_code.like(f"{prefix}-{COMMON_SEGMENT}-%"),
    )


def _rank_source(
    db: Session, source: dict, tokens: set[str], facility_type: str | None
) -> list[RetrievedPolicy]:
    conditions = [
        PolicyDocument.document_code.like(source["code_pattern"]),
        PolicyDocument.policy_version == source["version"],
        PolicyDocument.is_active.is_(True),
    ]
    facility_condition = _facility_conditions(source, facility_type)
    if facility_condition is not None:
        conditions.append(facility_condition)

    documents = db.scalars(select(PolicyDocument).where(*conditions)).all()

    ranked: list[RetrievedPolicy] = []
    for document in documents:
        searchable = (
            f"{document.article} {document.content} {document.keywords}".lower()
        )
        matches = sum(1 for token in tokens if token in searchable)
        score = matches / max(len(tokens), 1)
        ranked.append(RetrievedPolicy(document, document.content, round(score, 4)))

    ranked.sort(
        key=lambda item: (item.relevance_score, item.document.document_code),
        reverse=True,
    )
    return ranked


def retrieve_policy_documents(
    db: Session,
    query: str,
    per_document_limit: int = 3,
    total_limit: int | None = None,
    facility_type: str | None = None,
) -> list[RetrievedPolicy]:
    """승인된 각 소스에서 근거를 인출한다. 스코어링은 백엔드가 소유한다.

    total_limit 이 주어지면 소스별 최상위 1건을 먼저 확보한 뒤
    남은 자리를 점수 순으로 채운다(한 소스가 결과를 독점하지 않도록).
    """
    ensure_policy_documents(db)
    tokens = _tokens(query)

    per_source: list[list[RetrievedPolicy]] = []
    for source in SOURCE_DOCUMENTS:
        ranked = _rank_source(db, source, tokens, facility_type)
        relevant = [item for item in ranked if item.relevance_score > 0]
        per_source.append((relevant or ranked[:1])[:per_document_limit])

    if total_limit is None:
        results = [item for bucket in per_source for item in bucket]
        results.sort(key=lambda item: item.relevance_score, reverse=True)
        return results

    guaranteed: list[RetrievedPolicy] = []
    remainder: list[RetrievedPolicy] = []
    for bucket in per_source:
        if bucket:
            guaranteed.append(bucket[0])
            remainder.extend(bucket[1:])

    guaranteed.sort(key=lambda item: item.relevance_score, reverse=True)
    remainder.sort(key=lambda item: item.relevance_score, reverse=True)

    results = guaranteed[:total_limit]
    for item in remainder:
        if len(results) >= total_limit:
            break
        results.append(item)

    results.sort(key=lambda item: item.relevance_score, reverse=True)
    return results