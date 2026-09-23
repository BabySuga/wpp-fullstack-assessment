from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_request_validation_uses_canonical_error_shape():
    response = client.delete("/api/boards/not-a-uuid")

    assert response.status_code == 422
    assert response.json().keys() == {"error", "message", "field"}
    assert response.json()["error"] == "VALIDATION_ERROR"


def test_unmatched_route_uses_canonical_error_shape():
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {
        "error": "NOT_FOUND",
        "message": "Not Found",
        "field": None,
    }