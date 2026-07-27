"""merge migration heads

Revision ID: 028a13e80b81
Revises: 820f03b9050c, 971fc9d435fb, b7c3f92d51a0
Create Date: 2026-07-27 10:36:21.285906

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '028a13e80b81'
down_revision: Union[str, Sequence[str], None] = ('820f03b9050c', '971fc9d435fb', 'b7c3f92d51a0')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
