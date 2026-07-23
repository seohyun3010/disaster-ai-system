from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, String, Text

from database.base import Base  # 팀 공용 Base 경로에 맞게 수정


class CaseImage(Base):
    __tablename__ = "case_images"

    image_id = Column(BigInteger, primary_key=True, autoincrement=True)
    case_id = Column(
        BigInteger,
        ForeignKey("cases.case_id"),
        nullable=False,
    )
    image_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    image_hash = Column(String(255), unique=True, nullable=True)
    taken_at = Column(DateTime, nullable=True)

    # ---- 2차 단계(relationship)에서 주석 해제 ----
    # from sqlalchemy.orm import relationship
    # case = relationship("Case", back_populates="case_images")
    # ai_results = relationship("AiResult", back_populates="image")
