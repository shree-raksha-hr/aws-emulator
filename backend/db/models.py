from sqlalchemy import Column, Integer, String, ForeignKey, Float
from .database import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer,primary_key=True, index=True, autoincrement=True)
    name=Column(String)
    email=Column(String,unique=True)
    role=Column(String)
    password=Column(String)