"""restore policy_documents table for handbook evidence retrieval

Revision ID: d1e4f9a2b7c3
Revises: c8d29a7e31f4
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d1e4f9a2b7c3"
down_revision: Union[str, Sequence[str], None] = "c8d29a7e31f4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "policy_documents",
        sa.Column("document_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("document_code", sa.String(length=100), nullable=False),
        sa.Column("document_name", sa.String(length=255), nullable=False),
        sa.Column("article", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("policy_version", sa.String(length=100), nullable=False),
        sa.Column("keywords", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("document_id"),
        sa.UniqueConstraint(
            "document_code", "policy_version", name="uq_policy_document_version"
        ),
    )
    op.create_index(
        "ix_policy_documents_policy_version",
        "policy_documents",
        ["policy_version"],
    )


def downgrade() -> None:
    op.drop_index("ix_policy_documents_policy_version", table_name="policy_documents")
    op.drop_table("policy_documents")