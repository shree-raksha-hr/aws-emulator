from fastapi import FastAPI
from db.database import engine
from db import models
from routes import user, auth, ec2, rds, s3

from fastapi.middleware.cors import CORSMiddleware

app=FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(engine)

app.include_router(user.router)

app.include_router(auth.router)

app.include_router(ec2.router)

app.include_router(rds.router)

app.include_router(s3.router)