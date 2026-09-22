from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional

from ..models.task import Task
from ..repositories.task_repository import TaskRepository
from ..repositories.board_repository import BoardRepository
from ..exceptions import ValidationError, NotFoundError

VALID_STATUSES = {"TODO", "IN_PROGRESS", "DONE"}

class TaskService:
    def __init__(self, task_repository: TaskRepository, board_repository: BoardRepository):
        self.task_repository = task_repository
        self.board_repository = board_repository

    def get_tasks_by_board(self, db: Session, board_id: UUID, status: Optional[str] = None) -> List[Task]:
        board = self.board_repository.get_by_id(db, board_id)
        if not board:
            raise NotFoundError("Board not found")
        
        if status:
            status = status.strip().upper()
            if status not in VALID_STATUSES:
                raise ValidationError("Status must be one of: TODO, IN_PROGRESS, DONE", field="status")
                
        return self.task_repository.get_by_board_id(db, board_id, status)

    def create_task(self, db: Session, board_id: UUID, title: str, description: Optional[str] = None) -> Task:
        board = self.board_repository.get_by_id(db, board_id)
        if not board:
            raise NotFoundError("Board not found")
            
        if title is None or title.strip() == "":
            raise ValidationError("Title must not be empty", field="title")
            
        return self.task_repository.create(db, board_id, title=title, description=description)

    def update_task(self, db: Session, task_id: UUID, status: Optional[str] = None, title: Optional[str] = None, description: Optional[str] = None) -> Task:
        task = self.task_repository.get_by_id(db, task_id)
        if not task:
            raise NotFoundError("Task not found")
            
        fields_to_update = {}
        if status is not None:
            status = status.strip().upper()
            if status not in VALID_STATUSES:
                raise ValidationError("Status must be one of: TODO, IN_PROGRESS, DONE", field="status")
            fields_to_update["status"] = status
            
        if title is not None:
            if title.strip() == "":
                raise ValidationError("Title must not be empty", field="title")
            fields_to_update["title"] = title
            
        if description is not None:
            fields_to_update["description"] = description
            
        return self.task_repository.update(db, task, **fields_to_update)

    def delete_task(self, db: Session, task_id: UUID) -> None:
        deleted = self.task_repository.delete(db, task_id)
        if not deleted:
            raise NotFoundError("Task not found")
