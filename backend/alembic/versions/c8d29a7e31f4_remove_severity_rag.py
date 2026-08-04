"""remove severity RAG tables and rename rule version column

Revision ID: c8d29a7e31f4
Revises: 0fa5c8048f7c
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d29a7e31f4"
down_revision: Union[str, Sequence[str], None] = "0fa5c8048f7c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table("policy_references")
    op.drop_table("policy_documents")
    with op.batch_alter_table("severity_results") as batch_op:
        batch_op.alter_column(
            "policy_version",
            new_column_name="rule_version",
            existing_type=sa.String(length=100),
            existing_nullable=False,
        )


def downgrade() -> None:
    with op.batch_alter_table("severity_results") as batch_op:
        batch_op.alter_column(
            "rule_version",
            new_column_name="policy_version",
            existing_type=sa.String(length=100),
            existing_nullable=False,
        )

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
    op.create_table(
        "policy_references",
        sa.Column("reference_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("severity_result_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("matched_content", sa.Text(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["document_id"], ["policy_documents.document_id"]
        ),
        sa.ForeignKeyConstraint(
            ["severity_result_id"],
            ["severity_results.result_id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("reference_id"),
    )
    op.create_index(
        "ix_policy_references_severity_result_id",
        "policy_references",
        ["severity_result_id"],
    )
