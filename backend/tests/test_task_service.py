import pytest
import uuid
from app.exceptions import ValidationError, NotFoundError

def test_create_task_success(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="My Task")
    assert task.id is not None
    assert task.title == "My Task"
    assert task.status == "TODO"

def test_create_task_default_status_todo(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="My Task")
    assert task.status == "TODO"

def test_create_task_empty_title(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    with pytest.raises(ValidationError) as exc:
        task_service.create_task(db_session, board_id=board.id, title="")
    assert "empty" in exc.value.message.lower()

def test_create_task_whitespace_title(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    with pytest.raises(ValidationError) as exc:
        task_service.create_task(db_session, board_id=board.id, title="   ")
    assert "empty" in exc.value.message.lower()

def test_create_task_nonexistent_board(db_session, task_service):
    with pytest.raises(NotFoundError):
        task_service.create_task(db_session, board_id=uuid.uuid4(), title="Task")

def test_filter_tasks_by_status(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    t1 = task_service.create_task(db_session, board_id=board.id, title="Task 1")
    t2 = task_service.create_task(db_session, board_id=board.id, title="Task 2")
    task_service.update_task(db_session, t1.id, status="IN_PROGRESS")
    
    tasks = task_service.get_tasks_by_board(db_session, board.id, status="IN_PROGRESS")
    assert len(tasks) == 1
    assert tasks[0].id == t1.id

def test_update_task_status(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1")
    
    updated = task_service.update_task(db_session, task.id, status="DONE")
    assert updated.status == "DONE"


def test_update_task_title_success(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Original title")

    updated = task_service.update_task(db_session, task.id, title="Updated title")
    assert updated.title == "Updated title"


def test_update_task_description_success(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1", description="Old description")

    updated = task_service.update_task(db_session, task.id, description="New description")
    assert updated.description == "New description"


def test_update_task_title_and_description_together(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Old title", description="Old description")

    updated = task_service.update_task(db_session, task.id, title="New title", description="New description")
    assert updated.title == "New title"
    assert updated.description == "New description"


def test_update_task_title_trims_surrounding_whitespace(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Original")

    updated = task_service.update_task(db_session, task.id, title="  Trimmed title  ")
    assert updated.title == "Trimmed title"


def test_update_task_rejects_empty_title(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1")

    with pytest.raises(ValidationError) as exc:
        task_service.update_task(db_session, task.id, title="")
    assert "empty" in exc.value.message.lower()


def test_update_task_rejects_whitespace_only_title(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1")

    with pytest.raises(ValidationError) as exc:
        task_service.update_task(db_session, task.id, title="   ")
    assert "empty" in exc.value.message.lower()


def test_update_task_allows_empty_description(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1", description="Initial")

    updated = task_service.update_task(db_session, task.id, description="")
    assert updated.description == ""


def test_update_task_title_and_description_without_status_change(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1", description="Old")

    updated = task_service.update_task(db_session, task.id, title="Updated task", description="New description")
    assert updated.title == "Updated task"
    assert updated.description == "New description"
    assert updated.status == "TODO"


def test_update_task_title_description_and_status_together(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1", description="Old")

    updated = task_service.update_task(db_session, task.id, title="Updated task", description="New description", status="IN_PROGRESS")
    assert updated.title == "Updated task"
    assert updated.description == "New description"
    assert updated.status == "IN_PROGRESS"


def test_update_task_invalid_status(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1")
    
    with pytest.raises(ValidationError):
        task_service.update_task(db_session, task.id, status="INVALID")

def test_update_task_not_found(db_session, task_service):
    with pytest.raises(NotFoundError):
        task_service.update_task(db_session, uuid.uuid4(), status="DONE")


def test_update_task_not_found_for_title_description(db_session, task_service):
    with pytest.raises(NotFoundError):
        task_service.update_task(db_session, uuid.uuid4(), title="Updated")


def test_delete_task_success(db_session, board_service, task_service):
    board = board_service.create_board(db_session, name="Test")
    task = task_service.create_task(db_session, board_id=board.id, title="Task 1")
    
    task_service.delete_task(db_session, task.id)
    
    tasks = task_service.get_tasks_by_board(db_session, board.id)
    assert len(tasks) == 0

def test_delete_task_not_found(db_session, task_service):
    with pytest.raises(NotFoundError):
        task_service.delete_task(db_session, uuid.uuid4())
