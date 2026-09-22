from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID

from ..database import get_db
from ..schemas.board import BoardCreate, BoardResponse
from ..services.board_service import BoardService
from ..repositories.board_repository import BoardRepository
from fastapi.responses import Response

router = APIRouter(prefix="/api/boards", tags=["boards"])

def get_board_service():
    board_repository = BoardRepository()
    return BoardService(board_repository=board_repository)

@router.get("", response_model=List[BoardResponse])
def list_boards(db: Session = Depends(get_db), board_service: BoardService = Depends(get_board_service)):
    return board_service.get_all_boards(db)

@router.post("", response_model=BoardResponse, status_code=201)
def create_board(board_in: BoardCreate, db: Session = Depends(get_db), board_service: BoardService = Depends(get_board_service)):
    return board_service.create_board(db, name=board_in.name)

@router.delete("/{board_id}", status_code=204)
def delete_board(board_id: UUID, db: Session = Depends(get_db), board_service: BoardService = Depends(get_board_service)):
    board_service.delete_board(db, board_id)
    return Response(status_code=204)
