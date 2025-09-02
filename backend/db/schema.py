from pydantic import BaseModel
from typing import Optional, List

class User(BaseModel):
    id:int
    name:str
    email:str
    password:str
    role: Optional[str] = "user"

class UserBase(BaseModel):
    name: str
    email: str
    role: Optional[str] = "user"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        orm_mode = True
