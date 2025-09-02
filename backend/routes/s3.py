from fastapi import APIRouter, Depends, HTTPException
import docker
from db.schema import BucketCreate, BucketResponse, ObjectUpload, ObjectResponse
from typing import List
from sqlalchemy.orm import Session
from db.models import Bucket, S3Object
from db.database import get_db
import os
from datetime import datetime

router = APIRouter(
    prefix="/s3",
    tags=["s3"]
)

BASE_PATH = "data/s3"

client = docker.DockerClient(base_url='unix:///var/run/docker.sock')

@router.post("/", response_model=BucketResponse)
def create_bucket(request:BucketCreate, db:Session=Depends(get_db)):
    bucket_path = os.path.join(BASE_PATH, request.name)

    if os.path.exists(bucket_path):
        raise HTTPException(400, "Bucket already exists")
    os.makedirs(bucket_path)

    db_bucket = Bucket(name=request.name, created_at=datetime.now(), objects=[])
    db.add(db_bucket)
    db.commit()
    db.refresh(db_bucket)

    return BucketResponse(name=request.name, created_at=db_bucket.created_at, objects=[])


@router.get("/", response_model=List[BucketResponse])
def get_all_buckets(db:Session=Depends(get_db)):
    buckets = db.query(Bucket).all()
    response=[]
    for b in buckets:
        objs = db.query(S3Object).filter(S3Object.bucket_name==b.name).all()
        objects = [ObjectResponse(key=o.key, created_at=o.created_at) for o in objs]
        response.append(BucketResponse(name=b.name, created_at=b.created_at, objects=objects))
    return response


@router.get("/{bucket_name}", response_model=BucketResponse)
def get_bucket(bucket_name,db:Session=Depends(get_db)):
    bucket = db.query(Bucket).filter(Bucket.name == bucket_name).first()
    if not bucket:
        raise HTTPException(404, "Bucket not found")
    objs = db.query(S3Object).filter(S3Object.bucket_name==bucket.name).all()
    objects = [ObjectResponse(key=o.key, created_at=o.created_at) for o in objs]
    return BucketResponse(name=bucket.name, created_at=bucket.created_at, objects=objects)


@router.delete("/{bucket_name}")
def delete_bucket(bucket_name,db:Session=Depends(get_db)):
    bucket = db.query(Bucket).filter(Bucket.name == bucket_name).first()
    if not bucket:
        raise HTTPException(404, "Bucket not found")
    
    bucket_path = os.path.join(BASE_PATH, bucket_name)
    if os.path.exists(bucket_path):
        for f in os.listdir(bucket_path):
            os.remove(os.path.join(bucket_path, f))
        os.rmdir(bucket_path)
    db.delete(bucket)
    db.commit()
    return {"msg" : "Deleted"}

@router.post("/{bucket_name}/objects", response_model=ObjectResponse)
def upload_object(bucket_name, request:ObjectUpload, db: Session = Depends(get_db)):
    bucket = db.query(Bucket).filter(Bucket.name == bucket_name).first()
    if not bucket:
        raise HTTPException(404, "Bucket not found")
    
    bucket_path = os.path.join(BASE_PATH, bucket_name)
    file_path = os.path.join(bucket_path,request.key)
    with open(file_path, "w") as f:
        f.write(request.data)

    obj = S3Object(key=request.key, bucket_name=bucket_name, data_path=file_path, created_at=datetime.now())
    db.add(obj)
    db.commit()
    db.refresh(obj)

    return ObjectResponse(key=obj.key, created_at=obj.created_at)

@router.get("/{bucket_name}/objects", response_model=List[ObjectResponse])
def list_objects(bucket_name, db: Session = Depends(get_db)):
    bucket = db.query(Bucket).filter(Bucket.name == bucket_name).first()
    if not bucket:
        raise HTTPException(404, "Bucket not found")
    return [ObjectResponse(key=o.key, created_at=o.created_at) for o in bucket.objects]

@router.get("/buckets/{bucket_name}/objects/{key}", response_model=ObjectResponse)
def get_object(bucket_name, key, db: Session = Depends(get_db)):
    obj = db.query(S3Object).filter_by(bucket_name=bucket_name, key=key).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")
    return ObjectResponse(key=obj.key, created_at=obj.created_at)

@router.delete("/buckets/{bucket_name}/objects/{key}")
def delete_object(bucket_name, key,db: Session = Depends(get_db)):
    obj = db.query(S3Object).filter_by(bucket_name=bucket_name, key=key).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Object not found")
    
    if os.path.exists(obj.data_path):
        os.remove(obj.data_path)
    db.delete(obj)
    db.commit()
    return {"msg" : "Deleted"}


