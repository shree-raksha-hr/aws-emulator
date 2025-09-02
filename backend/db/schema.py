from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

#===============User models================

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

#===============S3 models================
class ObjectUpload(BaseModel):
    key:str
    data:str

class ObjectResponse(BaseModel):
    key:str
    created_at: Optional[datetime]

class BucketCreate(BaseModel):
    name:str

class BucketResponse(BaseModel):
    name:str
    created_at:Optional[datetime]
    objects: Optional[List[ObjectResponse]] = []

#===============RDS models================
class DBBase(BaseModel):
    identifier:str
    username:str
    password:str

class DBCreate(DBBase):
    engine:str

class DBResponse(DBBase):
    instance_id:str
    endpoint:str
    port:int
    status:str

#===============Auth models================

class Login(BaseModel):
    username:str
    password:str

class Token(BaseModel):
    access_token:str
    token_type:str

class TokenData(BaseModel):
    email:Optional[str] = None