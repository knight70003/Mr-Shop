from pydantic import BaseModel
from typing import Optional, List


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    intent: str
    response: str
    context: dict
    
class ImageAnalysisResponse(BaseModel):
    category: str
    color: str
    pattern: str
    occasion: str
    season: str
    suggested_outfit: str