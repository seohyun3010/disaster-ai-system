"""store official damage grade and applied severity grade

Revision ID: a41f7c9d2e60
Revises: d1e4f9a2b7c3
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a41f7c9d2e60"
down_revision: Union[str, Sequence[str], None] = "d1e4f9a2b7c3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("reviews") as batch_op:
        batch_op.add_column(
            sa.Column("confirmed_damage_grade", sa.String(length=10), nullable=True)
        )

    with op.batch_alter_table("severity_results") as batch_op:
        batch_op.add_column(
            sa.Column("applied_damage_grade", sa.String(length=10), nullable=True)
        )
        batch_op.add_column(
            sa.Column("damage_grade_source", sa.String(length=20), nullable=True)
        )


def downgrade() -> None:
    with op.batch_alter_table("severity_results") as batch_op:
        batch_op.drop_column("damage_grade_source")
        batch_op.drop_column("applied_damage_grade")

    with op.batch_alter_table("reviews") as batch_op:
        batch_op.drop_column("confirmed_damage_grade")
