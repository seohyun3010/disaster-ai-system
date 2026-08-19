"""add manual adjustment audit fields

Revision ID: b4e2c6f8a910
Revises: a41f7c9d2e60
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "b4e2c6f8a910"
down_revision: Union[str, Sequence[str], None] = "a41f7c9d2e60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("severity_results") as batch_op:
        batch_op.add_column(sa.Column("is_manual", sa.Boolean(), nullable=False, server_default=sa.false()))
        batch_op.add_column(sa.Column("manual_adjustment_reason", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("component_adjustment_reasons", sa.JSON(), nullable=True))
        batch_op.add_column(sa.Column("manually_adjusted_at", sa.DateTime(), nullable=True))
    with op.batch_alter_table("subsidies") as batch_op:
        batch_op.add_column(sa.Column("adjustment_reason", sa.Text(), nullable=True))
        batch_op.add_column(sa.Column("adjusted_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table("subsidies") as batch_op:
        batch_op.drop_column("adjusted_at")
        batch_op.drop_column("adjustment_reason")
    with op.batch_alter_table("severity_results") as batch_op:
        batch_op.drop_column("manually_adjusted_at")
        batch_op.drop_column("manual_adjustment_reason")
        batch_op.drop_column("component_adjustment_reasons")
        batch_op.drop_column("is_manual")
