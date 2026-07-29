"""merge report fields into cases and drop external_reports

Revision ID: f2c91d7a4b60
Revises: e4b8a7c2d913
Create Date: 2026-07-29
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f2c91d7a4b60"
down_revision: Union[str, Sequence[str], None] = "e4b8a7c2d913"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("cases") as batch_op:
        batch_op.drop_constraint(
            "fk_cases_external_report_id", type_="foreignkey"
        )
        batch_op.add_column(
            sa.Column("disaster_type", sa.String(100), nullable=True)
        )
        batch_op.add_column(
            sa.Column("facility_type", sa.String(100), nullable=True)
        )
        batch_op.add_column(sa.Column("sido", sa.String(100), nullable=True))
        batch_op.add_column(sa.Column("sigungu", sa.String(100), nullable=True))
        batch_op.add_column(
            sa.Column("reported_at", sa.DateTime(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("received_at", sa.DateTime(), nullable=True)
        )
        batch_op.add_column(sa.Column("raw_payload", sa.JSON(), nullable=True))

    op.execute(
        sa.text(
            """
            UPDATE cases AS c
            SET
                disaster_type = er.disaster_type,
                facility_type = er.facility_type,
                sido = er.sido,
                sigungu = er.sigungu,
                reported_at = er.reported_at,
                received_at = er.received_at,
                raw_payload = er.raw_payload
            FROM external_reports AS er
            WHERE c.external_report_id = er.external_report_id
            """
        )
    )
    op.drop_index(
        "ix_external_reports_external_report_id",
        table_name="external_reports",
    )
    op.drop_table("external_reports")


def downgrade() -> None:
    op.create_table(
        "external_reports",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("external_report_id", sa.String(255), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("disaster_type", sa.String(100), nullable=True),
        sa.Column("facility_type", sa.String(100), nullable=True),
        sa.Column("address", sa.String(255), nullable=True),
        sa.Column("sido", sa.String(100), nullable=True),
        sa.Column("sigungu", sa.String(100), nullable=True),
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
        sa.Column("reported_at", sa.DateTime(), nullable=True),
        sa.Column("received_at", sa.DateTime(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.Column("processing_status", sa.String(50), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("external_report_id"),
    )
    op.create_index(
        "ix_external_reports_external_report_id",
        "external_reports",
        ["external_report_id"],
    )
    op.execute(
        sa.text(
            """
            INSERT INTO external_reports (
                id, external_report_id, title, description, disaster_type,
                facility_type, address, sido, sigungu, latitude, longitude,
                reported_at, received_at, raw_payload, processing_status
            )
            SELECT
                case_id, external_report_id, COALESCE(title, 'Migrated report'),
                description, disaster_type, facility_type, address, sido,
                sigungu, latitude, longitude, reported_at,
                COALESCE(received_at, created_at, CURRENT_TIMESTAMP),
                raw_payload, 'MIGRATED'
            FROM cases
            WHERE external_report_id IS NOT NULL
            """
        )
    )
    with op.batch_alter_table("cases") as batch_op:
        batch_op.create_foreign_key(
            "fk_cases_external_report_id",
            "external_reports",
            ["external_report_id"],
            ["external_report_id"],
        )
        batch_op.drop_column("raw_payload")
        batch_op.drop_column("received_at")
        batch_op.drop_column("reported_at")
        batch_op.drop_column("sigungu")
        batch_op.drop_column("sido")
        batch_op.drop_column("facility_type")
        batch_op.drop_column("disaster_type")
