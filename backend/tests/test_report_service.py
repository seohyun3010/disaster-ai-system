import unittest
from datetime import datetime
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

import models  # noqa: F401 - 모든 테이블 메타데이터 등록
from database.database import Base
from models.ai_results import AIResult
from models.case import Case
from models.case_image import CaseImage
from models.reports import Report
from models.reviews import Review
from models.severity_result import SeverityResult
from models.subsidy import Subsidy
from models.user import User
from schemas.report import ReportGenerateRequest
from services.report_service import (
    build_report_detail,
    generate_report,
    list_report_details,
)
from services.report_pdf_service import render_report_pdf
# from services.report_pdf_form_service import render_form_report_pdf
from services.report_pdf_form_service import render_official_report_pdf


class ReportServiceTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.db = Session(self.engine)
        now = datetime(2026, 7, 30, 16, 44)
        user = User(user_id=1, name="김담당", department="재난복구과")
        case = Case(
            case_id=5,
            case_number="DS-2026-000005",
            external_report_id="SAFE-5",
            user_id=1,
            reporter_name="최은경",
            disaster_type="산사태",
            facility_type="주택",
            address="강원특별자치도 원주시 신림면 황둔리 314",
            description="주택 뒤편 사면 붕괴 피해",
            reported_at=now,
        )
        image = CaseImage(image_id=1, case_id=5, image_url="/uploads/test.png")
        self.report = Report(
            report_id=4,
            case_id=5,
            summary="최종 승인된 복구 지원 결과",
            created_at=now,
        )
        self.db.add_all(
            [
                user,
                case,
                image,
                self.report,
                AIResult(
                    result_id=1,
                    case_id=5,
                    case_number="DS-2026-000005",
                    image_id=1,
                    damage_grade="DS4",
                    confidence=0.91,
                    created_at=now,
                ),
                SeverityResult(
                    result_id=1,
                    case_id=5,
                    damage_score=90,
                    human_risk_score=20,
                    vulnerability_score=20,
                    infrastructure_score=20,
                    secondary_damage_score=85,
                    severity_score=62.5,
                    severity_level="HIGH",
                    recovery_urgency_score=70,
                    recovery_priority=2,
                    urgency_level="HIGH",
                    rule_version="2026.1",
                    calculated_at=now,
                ),
                Subsidy(
                    subsidy_id=1,
                    case_id=5,
                    estimated_amount=Decimal("12000000"),
                    confirmed_amount=Decimal("10000000"),
                    status="APPROVED",
                ),
                Review(
                    review_id=1,
                    case_id=5,
                    reviewer_id=1,
                    hitl_result=True,
                    comment="최종 승인",
                    reviewed_at=now,
                ),
            ]
        )
        self.db.commit()

    def tearDown(self):
        self.db.close()
        self.engine.dispose()

    def test_detail_contains_all_frontend_sections(self):
        detail = build_report_detail(self.db, self.report)
        self.assertEqual(detail.report_number, "RPT-004")
        self.assertEqual(detail.case.case_number, "DS-2026-000005")
        self.assertEqual(detail.analysis.damage_grade, "DS4")
        self.assertEqual(detail.severity.urgency_score, 70)
        self.assertEqual(detail.subsidy.confirmed_amount, Decimal("10000000"))
        self.assertEqual(detail.approval_result, "최종 승인")
        self.assertTrue(detail.timeline)

    def test_detail_and_pdf_include_all_case_images(self):
        self.db.add_all([
            CaseImage(
                image_id=image_id,
                case_id=5,
                image_url=f"/uploads/test-{image_id}.png",
            )
            for image_id in range(2, 7)
        ])
        self.db.commit()

        detail = build_report_detail(self.db, self.report)

        self.assertEqual(len(detail.images), 6)
        self.assertEqual([image.image_id for image in detail.images], list(range(1, 7)))
        self.assertTrue(render_official_report_pdf(detail).startswith(b"%PDF-"))

    def test_list_supports_server_search_and_pagination(self):
        result = list_report_details(
            self.db,
            search="최은경",
            sort="latest",
            limit=10,
            offset=0,
        )
        self.assertEqual(result.total, 1)
        self.assertEqual(result.items[0].report_number, "RPT-004")

        report_number_result = list_report_details(
            self.db,
            search="RPT-004",
            sort="latest",
            limit=10,
            offset=0,
        )
        self.assertEqual(report_number_result.total, 1)

    def test_generate_is_idempotent_for_the_same_case(self):
        first = generate_report(
            self.db,
            case_id=5,
            payload=ReportGenerateRequest(summary="수정된 요약"),
        )
        second = generate_report(
            self.db,
            case_id=5,
            payload=ReportGenerateRequest(),
        )
        self.assertEqual(first.report_id, second.report_id)
        self.assertEqual(second.summary, "수정된 요약")

    def test_pdf_download_content_is_generated(self):
        detail = build_report_detail(self.db, self.report)
        # 기존 1페이지 PDF 생성기도 회귀 확인을 위해 유지합니다.
        self.assertTrue(render_report_pdf(detail).startswith(b"%PDF-"))
        # content = render_form_report_pdf(detail)
        content = render_official_report_pdf(detail)
        self.assertTrue(content.startswith(b"%PDF-"))
        self.assertGreater(len(content), 5000)


if __name__ == "__main__":
    unittest.main()
