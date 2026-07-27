"""add severity RAG tables

Revision ID: b7c3f92d51a0
Revises: 4658349909c7
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "b7c3f92d51a0"
down_revision: Union[str, Sequence[str], None] = "4658349909c7"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "policy_documents",
        sa.Column("document_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("document_code", sa.String(100), nullable=False),
        sa.Column("document_name", sa.String(255), nullable=False),
        sa.Column("article", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("policy_version", sa.String(100), nullable=False),
        sa.Column("keywords", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("document_id"),
        sa.UniqueConstraint(
            "document_code",
            "policy_version",
            name="uq_policy_document_version",
        ),
    )
    op.create_index("ix_policy_documents_policy_version", "policy_documents", ["policy_version"])
    op.create_table(
        "severity_results",
        sa.Column("result_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("case_id", sa.BigInteger(), nullable=False),
        sa.Column("damage_score", sa.Float(), nullable=False),
        sa.Column("human_risk_score", sa.Float(), nullable=False),
        sa.Column("vulnerability_score", sa.Float(), nullable=False),
        sa.Column("infrastructure_score", sa.Float(), nullable=False),
        sa.Column("secondary_damage_score", sa.Float(), nullable=False),
        sa.Column("severity_score", sa.Float(), nullable=False),
        sa.Column("severity_level", sa.String(20), nullable=False),
        sa.Column("recovery_urgency_score", sa.Float(), nullable=False),
        sa.Column("recovery_priority", sa.Integer(), nullable=False),
        sa.Column("urgency_level", sa.String(20), nullable=False),
        sa.Column("policy_version", sa.String(100), nullable=False),
        sa.Column("calculated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["case_id"], ["cases.case_id"]),
        sa.PrimaryKeyConstraint("result_id"),
    )
    op.create_index("ix_severity_results_case_id", "severity_results", ["case_id"])
    op.create_table(
        "policy_references",
        sa.Column("reference_id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("severity_result_id", sa.Integer(), nullable=False),
        sa.Column("document_id", sa.Integer(), nullable=False),
        sa.Column("matched_content", sa.Text(), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=False),
        sa.ForeignKeyConstraint(
            ["severity_result_id"], ["severity_results.result_id"], ondelete="CASCADE"
        ),
        sa.ForeignKeyConstraint(["document_id"], ["policy_documents.document_id"]),
        sa.PrimaryKeyConstraint("reference_id"),
    )
    op.create_index(
        "ix_policy_references_severity_result_id",
        "policy_references",
        ["severity_result_id"],
    )


def downgrade() -> None:
    op.drop_index("ix_policy_references_severity_result_id", table_name="policy_references")
    op.drop_table("policy_references")
    op.drop_index("ix_severity_results_case_id", table_name="severity_results")
    op.drop_table("severity_results")
    op.drop_index("ix_policy_documents_policy_version", table_name="policy_documents")
    op.drop_table("policy_documents")
