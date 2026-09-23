from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from .exceptions import NotFoundError, ValidationError
from .config import settings
from .routers import board_router, task_router

app = FastAPI(title="Mini Task Management Application")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={
        "error": "NOT_FOUND",
        "message": exc.message,
        "field": None
    })

@app.exception_handler(ValidationError)
async def validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=422, content={
        "error": "VALIDATION_ERROR",
        "message": exc.message,
        "field": exc.field
    })

@app.exception_handler(RequestValidationError)
async def request_validation_handler(request: Request, exc: RequestValidationError):
    # Extract the first error message and field for simplicity
    error = exc.errors()[0]
    field = str(error.get("loc", [""])[-1])
    return JSONResponse(status_code=422, content={
        "error": "VALIDATION_ERROR",
        "message": error.get("msg", "Invalid input"),
        "field": field
    })

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 404:
        error = "NOT_FOUND"
        message = "Resource not found"
    elif exc.status_code in (400, 422):
        error = "VALIDATION_ERROR"
        message = "Request validation failed"
    else:
        error = "HTTP_ERROR"
        message = "Request failed"

    if isinstance(exc.detail, str) and exc.status_code != 500:
        message = exc.detail

    return JSONResponse(status_code=exc.status_code, content={
        "error": error,
        "message": message,
        "field": None
    })

app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)

@app.exception_handler(Exception)
async def internal_error_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={
        "error": "INTERNAL_ERROR",
        "message": "An unexpected error occurred",
        "field": None
    })

@app.get("/health")
async def health_check():
    return {"status": "ok"}

app.include_router(board_router)
app.include_router(task_router)
