"""merge subsidy and duplicate review heads

Revision ID: 0fa5c8048f7c
Revises: 91dcb0e6d202, ff30abb9ce2b
Create Date: 2026-07-31 09:57:02.160576

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0fa5c8048f7c'
down_revision: Union[str, Sequence[str], None] = ('91dcb0e6d202', 'ff30abb9ce2b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
