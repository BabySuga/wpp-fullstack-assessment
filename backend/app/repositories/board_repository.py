from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

from ..models.board import Board

class BoardRepository:
    def get_all(self, db: Session) -> List[Board]:
        result = db.execute(select(Board).order_by(Board.created_at.desc()))
        return list(result.scalars().all())

    def get_by_id(self, db: Session, board_id: UUID) -> Optional[Board]:
        result = db.execute(select(Board).where(Board.id == board_id))
        return result.scalars().first()

    def create(self, db: Session, name: str) -> Board:
        board = Board(name=name)
        db.add(board)
        db.commit()
        db.refresh(board)
        return board

    def delete(self, db: Session, board_id: UUID) -> bool:
        board = self.get_by_id(db, board_id)
        if board:
            db.delete(board)
            db.commit()
            return True
        return False
