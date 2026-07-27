from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Float, ForeignKey, Integer, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base

if TYPE_CHECKING:
    from models.policy_document import PolicyDocument
    from models.severity_result import SeverityResult


class PolicyReference(Base):
    __tablename__ = "policy_references"

    reference_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    severity_result_id: Mapped[int] = mapped_column(
        ForeignKey("severity_results.result_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    document_id: Mapped[int] = mapped_column(
        ForeignKey("policy_documents.document_id"), nullable=False
    )
    matched_content: Mapped[str] = mapped_column(Text, nullable=False)
    relevance_score: Mapped[float] = mapped_column(Float, nullable=False)

    severity_result: Mapped["SeverityResult"] = relationship(
        back_populates="document_references"
    )
    document: Mapped["PolicyDocument"] = relationship(back_populates="references")
