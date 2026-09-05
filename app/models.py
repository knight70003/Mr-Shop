from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    intent: str
    response: str
    context: dict