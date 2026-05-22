"""add mesh_path to parts

Revision ID: 001
Revises:
Create Date: 2026-05-22
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("parts", sa.Column("mesh_path", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("parts", "mesh_path")
