from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from models.policy_document import PolicyDocument

POLICY_VERSION = "severity-rag-2025-2026.1"
POLICY_DIR = Path(__file__).resolve().parent.parent / "data" / "severity_policy_documents"

SOURCE_DOCUMENTS = (
    {
        "code": "HANDBOOK-2025",
        "name": "2025년 자연재난조사 및 복구계획수립 편람",
        "filename": "2025-natural-disaster-recovery-handbook.pdf",
        "version": "2025.1",
    },
    {
        "code": "NATURAL-DISASTER-ACT",
        "name": "자연재해대책법",
        "filename": "natural-disaster-countermeasures-act-20260102.pdf",
        "version": "2026.01.02",
    },
)


@dataclass(frozen=True)
class RetrievedPolicy:
    document: PolicyDocument
    matched_content: str
    relevance_score: float


def _split_text(text: str, max_chars: int = 1400) -> list[str]:
    normalized = re.sub(r"\s+", " ", text).strip()
    if not normalized:
        return []
    sentences = re.split(r"(?<=[.다)])\s+", normalized)
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


def ensure_policy_documents(db: Session) -> None:
    """Load only the two approved PDFs into the severity RAG document store."""
    expected = {source["code"] for source in SOURCE_DOCUMENTS}
    loaded = {
        code.split("-P", 1)[0]
        for code in db.scalars(
            select(PolicyDocument.document_code).where(
                PolicyDocument.policy_version.in_(
                    [source["version"] for source in SOURCE_DOCUMENTS]
                )
            )
        ).all()
        if "-P" in code
    }
    if expected.issubset(loaded):
        return

    try:
        from pypdf import PdfReader
    except ImportError as exc:
        raise HTTPException(
            status_code=503,
            detail="PDF RAG 모듈이 없습니다. pip install -r requirements-rag.txt를 실행하세요.",
        ) from exc

    for source in SOURCE_DOCUMENTS:
        prefix = f"{source['code']}-P"
        existing_count = db.scalar(
            select(func.count(PolicyDocument.document_id)).where(
                PolicyDocument.document_code.like(f"{prefix}%"),
                PolicyDocument.policy_version == source["version"],
            )
        )
        if existing_count:
            continue
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
                        document_code=f"{source['code']}-P{page_number:03d}-C{chunk_number:02d}",
                        document_name=source["name"],
                        article=f"PDF {page_number}페이지",
                        content=content,
                        policy_version=source["version"],
                        keywords=content.lower(),
                        is_active=True,
                    )
                )
        db.flush()


def _tokens(query: str) -> set[str]:
    return {
        token
        for token in re.findall(r"[0-9A-Za-z가-힣]+", query.lower())
        if len(token) > 1
    }


def retrieve_policy_documents(
    db: Session, query: str, per_document_limit: int = 3
) -> list[RetrievedPolicy]:
    """Retrieve evidence from each approved PDF; scoring remains backend-owned."""
    ensure_policy_documents(db)
    tokens = _tokens(query)
    results: list[RetrievedPolicy] = []
    for source in SOURCE_DOCUMENTS:
        documents = db.scalars(
            select(PolicyDocument).where(
                PolicyDocument.document_code.like(f"{source['code']}-P%"),
                PolicyDocument.policy_version == source["version"],
                PolicyDocument.is_active.is_(True),
            )
        ).all()
        ranked: list[RetrievedPolicy] = []
        for document in documents:
            searchable = (
                f"{document.article} {document.content} {document.keywords}".lower()
            )
            matches = sum(1 for token in tokens if token in searchable)
            score = matches / max(len(tokens), 1)
            ranked.append(
                RetrievedPolicy(document, document.content, round(score, 4))
            )
        ranked.sort(
            key=lambda item: (
                item.relevance_score,
                item.document.document_code,
            ),
            reverse=True,
        )
        relevant = [item for item in ranked if item.relevance_score > 0]
        results.extend((relevant or ranked[:1])[:per_document_limit])
    results.sort(key=lambda item: item.relevance_score, reverse=True)
    return results
