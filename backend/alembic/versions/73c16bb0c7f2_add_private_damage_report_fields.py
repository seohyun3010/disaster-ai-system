"""add private damage report fields to cases

Revision ID: 73c16bb0c7f2
Revises: f2c91d7a4b60
Create Date: 2026-07-29
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "73c16bb0c7f2"
down_revision: Union[str, Sequence[str], None] = "f2c91d7a4b60"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("cases") as batch_op:
        batch_op.add_column(sa.Column("reporter_name", sa.String(100)))
        batch_op.add_column(
            sa.Column("resident_registration_number", sa.String(20))
        )
        batch_op.add_column(sa.Column("contact_number", sa.String(30)))
        batch_op.add_column(sa.Column("household_members", sa.Integer()))
        batch_op.add_column(sa.Column("bank_name", sa.String(100)))
        batch_op.add_column(sa.Column("account_number", sa.String(100)))
        batch_op.add_column(sa.Column("account_holder", sa.String(100)))
        batch_op.add_column(sa.Column("damage_occurred_at", sa.DateTime()))
        batch_op.add_column(sa.Column("damage_details", sa.JSON()))


def downgrade() -> None:
    with op.batch_alter_table("cases") as batch_op:
        batch_op.drop_column("damage_details")
        batch_op.drop_column("damage_occurred_at")
        batch_op.drop_column("account_holder")
        batch_op.drop_column("account_number")
        batch_op.drop_column("bank_name")
        batch_op.drop_column("household_members")
        batch_op.drop_column("contact_number")
        batch_op.drop_column("resident_registration_number")
        batch_op.drop_column("reporter_name")
