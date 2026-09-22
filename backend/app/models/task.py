from sqlalchemy import Column, String, DateTime, func, ForeignKey, CheckConstraint, Index, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    board_id = Column(UUID(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, server_default="TODO")
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    board = relationship("Board", back_populates="tasks")

    __table_args__ = (
        CheckConstraint("TRIM(title) <> ''", name="tasks_title_check"),
        CheckConstraint("status IN ('TODO', 'IN_PROGRESS', 'DONE')", name="tasks_status_check"),
        Index("ix_tasks_board_id_status", "board_id", "status"),
    )
