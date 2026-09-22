import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.repositories.board_repository import BoardRepository
from app.repositories.task_repository import TaskRepository
from app.services.board_service import BoardService
from app.services.task_service import TaskService

# Use real PostgreSQL for testing
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/taskmanager_test"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def board_service():
    return BoardService(board_repository=BoardRepository())

@pytest.fixture
def task_service():
    return TaskService(
        task_repository=TaskRepository(),
        board_repository=BoardRepository()
    )
