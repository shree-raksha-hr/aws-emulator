from fastapi import APIRouter, Depends, HTTPException
from db.database import get_db
from db.models import User
from sqlalchemy.orm import Session
from db.schema import UserCreate, UserResponse
from services.hashing import Hash
from typing import List

router = APIRouter(
    prefix="/user",
    tags=["user"]
)

@router.post("/")
def create_user(request:UserCreate, db:Session = Depends(get_db)):
    hashed_pw = Hash.bcrypt(request.password)
    new_user = User(name=request.name, email=request.email, password=hashed_pw,role=request.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user