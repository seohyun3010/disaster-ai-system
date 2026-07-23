from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String

from database.base import Base  # 팀 공용 Base 경로에 맞게 수정


class AiJob(Base):
    __tablename__ = "ai_jobs"

    job_id = Column(BigInteger, primary_key=True, autoincrement=True)
    case_id = Column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )
    status = Column(String(255), nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)

    # ---- 2차 단계(relationship)에서 주석 해제 ----
    # from sqlalchemy.orm import relationship
    # case = relationship("Case", back_populates="ai_jobs")
