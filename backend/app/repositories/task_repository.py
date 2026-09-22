from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID

from ..models.task import Task

class TaskRepository:
    def get_by_board_id(self, db: Session, board_id: UUID, status: Optional[str] = None) -> List[Task]:
        query = select(Task).where(Task.board_id == board_id)
        if status:
            query = query.where(Task.status == status)
        query = query.order_by(Task.created_at.desc())
        result = db.execute(query)
        return list(result.scalars().all())

    def get_by_id(self, db: Session, task_id: UUID) -> Optional[Task]:
        result = db.execute(select(Task).where(Task.id == task_id))
        return result.scalars().first()

    def create(self, db: Session, board_id: UUID, title: str, description: Optional[str] = None) -> Task:
        task = Task(board_id=board_id, title=title, description=description)
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    def update(self, db: Session, task: Task, **fields) -> Task:
        for key, value in fields.items():
            if value is not None:
                setattr(task, key, value)
        db.commit()
        db.refresh(task)
        return task

    def delete(self, db: Session, task_id: UUID) -> bool:
        task = self.get_by_id(db, task_id)
        if task:
            db.delete(task)
            db.commit()
            return True
        return False
