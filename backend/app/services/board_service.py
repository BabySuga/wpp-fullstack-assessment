from sqlalchemy.orm import Session
from uuid import UUID
from typing import List

from ..models.board import Board
from ..repositories.board_repository import BoardRepository
from ..exceptions import ValidationError, NotFoundError

class BoardService:
    def __init__(self, board_repository: BoardRepository):
        self.board_repository = board_repository

    def get_all_boards(self, db: Session) -> List[Board]:
        return self.board_repository.get_all(db)

    def get_board_by_id(self, db: Session, board_id: UUID) -> Board:
        board = self.board_repository.get_by_id(db, board_id)
        if not board:
            raise NotFoundError("Board not found")
        return board

    def create_board(self, db: Session, name: str) -> Board:
        if name is None or name.strip() == "":
            raise ValidationError("Name must not be empty", field="name")
        return self.board_repository.create(db, name=name)

    def delete_board(self, db: Session, board_id: UUID) -> None:
        board = self.board_repository.get_by_id(db, board_id)
        if not board:
            raise NotFoundError("Board not found")
        self.board_repository.delete(db, board_id)
