from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(
    prefix="/user",
    tags=["user"]
)

