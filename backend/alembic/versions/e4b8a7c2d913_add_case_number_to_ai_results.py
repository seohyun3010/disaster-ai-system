"""add case_number to ai_results

Revision ID: e4b8a7c2d913
Revises: 6a14f0c85f31
Create Date: 2026-07-28

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "e4b8a7c2d913"
down_revision: Union[str, Sequence[str], None] = "6a14f0c85f31"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "ai_results",
        sa.Column("case_number", sa.String(length=255), nullable=True),
    )
    op.execute(
        """
        UPDATE ai_results AS ar
        SET case_number = c.case_number
        FROM cases AS c
        WHERE ar.case_id = c.case_id
        """
    )


def downgrade() -> None:
    op.drop_column("ai_results", "case_number")
