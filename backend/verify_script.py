import subprocess
import time
import requests
import json
import sys
from sqlalchemy import create_engine, inspect

# 1. Database Configuration
print("=== Database Configuration ===")
with open('tests/conftest.py', 'r') as f:
    for line in f:
        if 'SQLALCHEMY_DATABASE_URL' in line:
            print("tests/conftest.py DB Config:", line.strip())
with open('app/config.py', 'r') as f:
    for line in f:
        if 'database_url' in line:
            print("app/config.py DB Config:", line.strip())

# 2. Database Schema Verification
print("\n=== Database Schema Verification ===")
engine = create_engine("postgresql://postgres:postgres@localhost:5432/taskmanager")
inspector = inspect(engine)

tables = inspector.get_table_names()
print(f"Tables found: {tables}")

for table in tables:
    if table in ['boards', 'tasks']:
        print(f"\nTable: {table}")
        print("Primary Keys:", inspector.get_pk_constraint(table))
        print("Foreign Keys:", inspector.get_foreign_keys(table))
        print("Check Constraints:", inspector.get_check_constraints(table))

# 3. API Verification
print("\n=== Starting Server ===")
server_process = subprocess.Popen(["uvicorn", "app.main:app", "--port", "8000"])
time.sleep(3) # Wait for server to start

try:
    print("\n=== API Verification ===")
    
    # POST /api/boards
    res = requests.post("http://localhost:8000/api/boards", json={"name": "Test Board"})
    print("POST /api/boards -> Status:", res.status_code)
    board_data = res.json()
    print("Response:", json.dumps(board_data))
    board_id = board_data.get('id')

    # GET /api/boards
    res = requests.get("http://localhost:8000/api/boards")
    print("GET /api/boards -> Status:", res.status_code)
    print("Response:", json.dumps(res.json()))

    # POST /api/boards/{id}/tasks
    res = requests.post(f"http://localhost:8000/api/boards/{board_id}/tasks", json={"title": "Test Task", "description": "Desc"})
    print(f"POST /api/boards/{board_id}/tasks -> Status:", res.status_code)
    task_data = res.json()
    print("Response:", json.dumps(task_data))
    task_id = task_data.get('id')

    # GET /api/boards/{id}/tasks
    res = requests.get(f"http://localhost:8000/api/boards/{board_id}/tasks")
    print(f"GET /api/boards/{board_id}/tasks -> Status:", res.status_code)
    print("Response:", json.dumps(res.json()))

    # PATCH /api/tasks/{id}
    res = requests.patch(f"http://localhost:8000/api/tasks/{task_id}", json={"status": "IN_PROGRESS"})
    print(f"PATCH /api/tasks/{task_id} -> Status:", res.status_code)
    print("Response:", json.dumps(res.json()))

    # DELETE /api/tasks/{id}
    res = requests.delete(f"http://localhost:8000/api/tasks/{task_id}")
    print(f"DELETE /api/tasks/{task_id} -> Status:", res.status_code)

    print("\n=== Error Handling Verification ===")
    # nonexistent Board
    res = requests.get("http://localhost:8000/api/boards/00000000-0000-0000-0000-000000000000/tasks")
    print("GET nonexistent board tasks -> Status:", res.status_code)
    print("Response:", json.dumps(res.json()))
    
    # nonexistent Task
    res = requests.patch("http://localhost:8000/api/tasks/00000000-0000-0000-0000-000000000000", json={"status": "DONE"})
    print("PATCH nonexistent task -> Status:", res.status_code)
    print("Response:", json.dumps(res.json()))

    # empty string
    res = requests.post("http://localhost:8000/api/boards", json={"name": ""})
    print("POST board empty string -> Status:", res.status_code)
    print("Response:", json.dumps(res.json()))

    # invalid UUID
    res = requests.delete("http://localhost:8000/api/boards/not-a-uuid")
    print("DELETE board invalid UUID -> Status:", res.status_code)
    print("Response:", json.dumps(res.json()))

    # invalid status
    res = requests.patch(f"http://localhost:8000/api/tasks/{task_id}", json={"status": "INVALID"})
    print("PATCH task invalid status -> Status:", res.status_code)
    print("Response:", json.dumps(res.json()))

    print("\n=== Cascade Verification ===")
    res = requests.post("http://localhost:8000/api/boards", json={"name": "Cascade Board"})
    cb_id = res.json().get('id')
    res = requests.post(f"http://localhost:8000/api/boards/{cb_id}/tasks", json={"title": "Cascade Task"})
    ct_id = res.json().get('id')
    print("Created board:", cb_id, "and task:", ct_id)
    
    res = requests.delete(f"http://localhost:8000/api/boards/{cb_id}")
    print("DELETE board -> Status:", res.status_code)
    
    with engine.connect() as conn:
        result = conn.execute(f"SELECT COUNT(*) FROM tasks WHERE id = '{ct_id}'")
        count = result.scalar()
        print(f"Task count in database after board deletion: {count}")

finally:
    server_process.terminate()
    server_process.wait()
