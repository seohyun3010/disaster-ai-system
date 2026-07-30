"""add duplicate review workflow

Revision ID: 91dcb0e6d202
Revises: 73c16bb0c7f2
Create Date: 2026-07-30
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "91dcb0e6d202"
down_revision: Union[str, Sequence[str], None] = "73c16bb0c7f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("cases") as batch_op:
        batch_op.add_column(
            sa.Column(
                "duplicate_status",
                sa.String(20),
                nullable=False,
                server_default="NOT_CHECKED",
            )
        )
        batch_op.add_column(
            sa.Column("duplicate_of_case_id", sa.BigInteger(), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_cases_duplicate_of_case_id",
            "cases",
            ["duplicate_of_case_id"],
            ["case_id"],
        )

    with op.batch_alter_table("duplicate_results") as batch_op:
        batch_op.add_column(sa.Column("similarity_score", sa.Numeric(5, 4)))
        batch_op.add_column(sa.Column("match_reasons", sa.JSON()))
        batch_op.add_column(
            sa.Column(
                "decision_status",
                sa.String(20),
                nullable=False,
                server_default="SUSPECTED",
            )
        )
        batch_op.add_column(
            sa.Column("reviewed_by_user_id", sa.BigInteger())
        )
        batch_op.add_column(sa.Column("review_note", sa.Text()))
        batch_op.add_column(sa.Column("decided_at", sa.DateTime()))
        batch_op.create_foreign_key(
            "fk_duplicate_results_reviewed_by_user_id",
            "users",
            ["reviewed_by_user_id"],
            ["user_id"],
        )
        batch_op.create_unique_constraint(
            "uq_duplicate_results_case_target",
            ["case_id", "target_case_id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("duplicate_results") as batch_op:
        batch_op.drop_constraint(
            "uq_duplicate_results_case_target", type_="unique"
        )
        batch_op.drop_constraint(
            "fk_duplicate_results_reviewed_by_user_id",
            type_="foreignkey",
        )
        batch_op.drop_column("decided_at")
        batch_op.drop_column("review_note")
        batch_op.drop_column("reviewed_by_user_id")
        batch_op.drop_column("decision_status")
        batch_op.drop_column("match_reasons")
        batch_op.drop_column("similarity_score")

    with op.batch_alter_table("cases") as batch_op:
        batch_op.drop_constraint(
            "fk_cases_duplicate_of_case_id", type_="foreignkey"
        )
        batch_op.drop_column("duplicate_of_case_id")
        batch_op.drop_column("duplicate_status")
