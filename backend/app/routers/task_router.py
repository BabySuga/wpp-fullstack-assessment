from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from ..database import get_db
from ..schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskStatus
from ..services.task_service import TaskService
from ..repositories.task_repository import TaskRepository
from ..repositories.board_repository import BoardRepository
from fastapi.responses import Response

router = APIRouter(tags=["tasks"])

def get_task_service():
    task_repository = TaskRepository()
    board_repository = BoardRepository()
    return TaskService(task_repository=task_repository, board_repository=board_repository)

@router.get("/api/boards/{board_id}/tasks", response_model=List[TaskResponse])
def list_tasks_for_board(board_id: UUID, status: Optional[str] = Query(None), db: Session = Depends(get_db), task_service: TaskService = Depends(get_task_service)):
    return task_service.get_tasks_by_board(db, board_id, status=status)

@router.post("/api/boards/{board_id}/tasks", response_model=TaskResponse, status_code=201)
def create_task(board_id: UUID, task_in: TaskCreate, db: Session = Depends(get_db), task_service: TaskService = Depends(get_task_service)):
    return task_service.create_task(db, board_id, title=task_in.title, description=task_in.description)

@router.patch("/api/tasks/{task_id}", response_model=TaskResponse)
def update_task(task_id: UUID, task_in: TaskUpdate, db: Session = Depends(get_db), task_service: TaskService = Depends(get_task_service)):
    # Pydantic validates status Enum, but we still pass it as string to service
    status_str = task_in.status.value if task_in.status else None
    return task_service.update_task(db, task_id, status=status_str, title=task_in.title, description=task_in.description)

@router.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: UUID, db: Session = Depends(get_db), task_service: TaskService = Depends(get_task_service)):
    task_service.delete_task(db, task_id)
    return Response(status_code=204)
