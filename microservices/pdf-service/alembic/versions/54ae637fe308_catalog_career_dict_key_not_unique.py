"""catalog career dict key not unique

Revision ID: 54ae637fe308
Revises: 5baf5beea04a
Create Date: 2026-03-02 16:02:11.318794

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = '54ae637fe308'
down_revision: Union[str, Sequence[str], None] = '5baf5beea04a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Remove duplicate career keys first so the unique index can be created safely.
    op.execute(
        """
        WITH ranked AS (
            SELECT
                id,
                ROW_NUMBER() OVER (
                    PARTITION BY career_key
                    ORDER BY updated_at DESC, created_at DESC, id DESC
                ) AS rn
            FROM catalog_careers
        )
        DELETE FROM catalog_careers
        WHERE id IN (
            SELECT id FROM ranked WHERE rn > 1
        )
        """
    )
    op.drop_index(op.f('ix_catalog_careers_career_key'), table_name='catalog_careers')
    op.create_index(op.f('ix_catalog_careers_career_key'), 'catalog_careers', ['career_key'], unique=True)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f('ix_catalog_careers_career_key'), table_name='catalog_careers')
    op.create_index(op.f('ix_catalog_careers_career_key'), 'catalog_careers', ['career_key'], unique=False)
