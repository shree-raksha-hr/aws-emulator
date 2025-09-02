from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'])

class Hash():
    def bcrypt(password:str):
        return pwd_context.hash(password)
    
    def verify(hashed_pw,plain_pw):
        return pwd_context.verify(plain_pw, hashed_pw)
