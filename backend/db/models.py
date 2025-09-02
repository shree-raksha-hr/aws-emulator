from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime
from .database import Base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer,primary_key=True, index=True, autoincrement=True)
    name=Column(String)
    email=Column(String,unique=True)
    role=Column(String)
    password=Column(String)

class Bucket(Base):
    __tablename__ = "buckets"
    name = Column(String, primary_key=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

class DBInstance(Base):
    __tablename__ = "db_instances"
    id = Column(String, primary_key=True)
    identifier = Column(String, nullable=False)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    endpoint = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    engine = Column(String, nullable=False, default="mysql")
    status = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())