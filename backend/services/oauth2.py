from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from services.token import verify_token
from db.models import User
from jose import JWTError

oauth2_schema = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(data:str=Depends(oauth2_schema),db: Session = Depends(get_db)):
    try:
        payload = verify_token(data)
        print(payload)
        user = db.query(User).filter(User.email == payload.email).first()
        if user is None:
            raise HTTPException(401, "Could not validate")
        return user
    except JWTError:
        raise HTTPException(500, "jwt error")