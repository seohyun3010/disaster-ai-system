"""create external reports and expand cases

Revision ID: 6a14f0c85f31
Revises: 028a13e80b81
Create Date: 2026-07-28
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "6a14f0c85f31"
down_revision: Union[str, Sequence[str], None] = "028a13e80b81"
branch_labels = None
depends_on = None


def upgrade() -> None:
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
    # Preserve reports received by the previous implementation, which stored
    # incoming data directly in cases.
    op.execute(
        sa.text(
            """
            INSERT INTO external_reports (
                id, external_report_id, title, description, address,
                latitude, longitude, received_at, processing_status
            )
            SELECT
                case_id, external_report_id, COALESCE(title, 'Migrated report'),
                description, address, latitude, longitude,
                COALESCE(created_at, CURRENT_TIMESTAMP), 'MIGRATED'
            FROM cases
            WHERE external_report_id IS NOT NULL
            """
        )
    )
    with op.batch_alter_table("cases") as batch_op:
        batch_op.add_column(
            sa.Column(
                "duplicate_suspected",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            )
        )
        batch_op.add_column(
            sa.Column(
                "priority",
                sa.String(50),
                nullable=False,
                server_default="NORMAL",
            )
        )
        batch_op.add_column(
            sa.Column("completed_at", sa.DateTime(), nullable=True)
        )
        batch_op.add_column(
            sa.Column("assigned_user_id", sa.BigInteger(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_cases_external_report_id",
            "external_reports",
            ["external_report_id"],
            ["external_report_id"],
        )
        batch_op.create_foreign_key(
            "fk_cases_assigned_user_id",
            "users",
            ["assigned_user_id"],
            ["user_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("cases") as batch_op:
        batch_op.drop_constraint(
            "fk_cases_assigned_user_id", type_="foreignkey"
        )
        batch_op.drop_constraint(
            "fk_cases_external_report_id", type_="foreignkey"
        )
        batch_op.drop_column("assigned_user_id")
        batch_op.drop_column("completed_at")
        batch_op.drop_column("priority")
        batch_op.drop_column("duplicate_suspected")
    op.drop_index(
        "ix_external_reports_external_report_id", table_name="external_reports"
    )
    op.drop_table("external_reports")
