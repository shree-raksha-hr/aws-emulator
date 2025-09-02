from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from db.models import User
from db.database import get_db
from services.hashing import Hash
from services.token import create_access_token
from db.schema import UserResponse
from services.oauth2 import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

@router.post('/login')
def login(db:Session = Depends(get_db), request:OAuth2PasswordRequestForm = Depends()):
    user = db.query(User).filter(User.email==request.username).first()
    if not user:
        raise HTTPException(404, "User not found")
    if not Hash.verify(user.password, request.password):
        raise HTTPException(404, "wrong password")
    access_token = create_access_token(data={"sub":user.email})
    return  {"access_token":access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def me(current_user:User = Depends(get_current_user)):
    return current_user
