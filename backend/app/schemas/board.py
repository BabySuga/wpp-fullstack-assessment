from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class BoardCreate(BaseModel):
    name: str

class BoardResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
