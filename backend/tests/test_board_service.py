import pytest
import uuid
from app.exceptions import ValidationError, NotFoundError

def test_create_board_success(db_session, board_service):
    board = board_service.create_board(db_session, name="Test Board")
    assert board.id is not None
    assert board.name == "Test Board"

def test_create_board_empty_name(db_session, board_service):
    with pytest.raises(ValidationError) as exc:
        board_service.create_board(db_session, name="")
    assert "empty" in exc.value.message.lower()

def test_create_board_whitespace_name(db_session, board_service):
    with pytest.raises(ValidationError) as exc:
        board_service.create_board(db_session, name="   ")
    assert "empty" in exc.value.message.lower()

def test_delete_board_cascades_tasks(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test Board")
    task = task_service.create_task(db_session, board_id=board.id, title="Test Task")
    
    board_service.delete_board(db_session, board.id)
    
    with pytest.raises(NotFoundError):
        board_service.get_board_by_id(db_session, board.id)
    assert task_service.task_repository.get_by_id(db_session, task.id) is None

def test_delete_board_not_found(db_session, board_service):
    with pytest.raises(NotFoundError):
        board_service.delete_board(db_session, uuid.uuid4())

def test_get_all_boards(db_session, board_service):
    board_service.create_board(db_session, name="Board 1")
    board_service.create_board(db_session, name="Board 2")
    boards = board_service.get_all_boards(db_session)
    assert len(boards) == 2
