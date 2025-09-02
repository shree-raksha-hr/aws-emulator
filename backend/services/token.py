from jose import JWTError, jwt
from fastapi import HTTPException
from db.schema import TokenData

SECRET_KEY="secret...shhhhhhh"

def create_access_token(data:dict):
    encoded_jwt = jwt.encode(data.copy(), SECRET_KEY, algorithm="HS256")
    return encoded_jwt

def verify_token(token:str):
    # print("Verifying token:", token) 
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms="HS256")
        email:str=payload.get("sub")
        if email is None:
            raise HTTPException(500, "email is none")
        return  TokenData(email=email)
    except JWTError as e:
        print("error",e)
        raise HTTPException(500, "erorrr")
