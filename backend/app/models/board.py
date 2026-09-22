from sqlalchemy import Column, String, DateTime, func, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from ..database import Base

class Board(Base):
    __tablename__ = "boards"

    id = Column(UUID(as_uuid=True), primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, server_default=func.now())

    tasks = relationship("Task", back_populates="board", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint("TRIM(name) <> ''", name="boards_name_check"),
    )
