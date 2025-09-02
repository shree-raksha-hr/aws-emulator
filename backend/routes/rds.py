from fastapi import APIRouter, Depends, HTTPException
from db.schema import DBCreate, DBResponse, List
from sqlalchemy.orm import Session
from db.database import get_db
from db.models import DBInstance
import docker
from datetime import datetime

client = docker.DockerClient(base_url='unix:///home/raksha/.docker/desktop/docker.sock')

router = APIRouter(
    prefix="/rds",
    tags=["rds"]
)

@router.post("/", response_model=DBResponse)
def create_db(request:DBCreate, db:Session = Depends(get_db)):
    engine=request.engine.lower()
    if engine=="postgres":
        image="postgres:latest"
        env={
            "POSTGRES_USER": request.username,
            "POSTGRES_PASSWORD": request.password
        }
        port_mapping = port_mapping = {"5432/tcp": None}
    elif engine=="mysql":
        image="mysql:latest"
        env ={
            "MYSQL_ROOT_PASSWORD": request.password,
            "MYSQL_USER": request.username,
            "MYSQL_PASSWORD": request.password,
        }
        port_mapping = {"3306/tcp":None}
    else:
        raise HTTPException(400, "Unsupported Engine")
    
    try:
        container = client.containers.run(
            image,
            name = f"db-{request.identifier}",
            environment=env,
            ports=port_mapping,
            detach=True
        )

        container.reload()
        port_info = list(container.attrs["NetworkSettings"]["Ports"].values())[0][0]["HostPort"]
        container_id = container.id

        db_instance = DBInstance(
            id=container_id,
            identifier=f"db-{request.identifier}",
            username = request.username,
            password = request.password,
            endpoint = "localhost",
            port=int(port_info),
            engine = request.engine,
            status = "running",
            created_at=datetime.now()
        )

        db.add(db_instance)
        db.commit()
        db.refresh(db_instance)

        return DBResponse(
            identifier=db_instance.identifier,
            username=db_instance.username,
            password=db_instance.password,
            instance_id=db_instance.id,
            endpoint=db_instance.endpoint,
            port=db_instance.port,
            status=db_instance.status
        )

    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")


@router.get("/", response_model = List[DBResponse])
def list_instances( db:Session = Depends(get_db)):
    instances = db.query(DBInstance).all()
    response=[]
    for i in instances:
        response.append({
            "identifier":i.identifier,
            "username":i.username,
            "password":i.password,
            "instance_id":i.id,
            "endpoint":i.endpoint,
            "port":i.port,
            "status":i.status
        })

    return response


@router.get("/{instance_id}", response_model=DBResponse)
def get_instance(instance_id,db:Session = Depends(get_db)):
    i = db.query(DBInstance).filter(DBInstance.id==instance_id).first()
    if not i:
        raise HTTPException(404, "Instance not found")
    return {
        "identifier":i.identifier,
        "username":i.username,
        "password":i.password,
        "instance_id":i.id,
        "endpoint":i.endpoint,
        "port":i.port,
        "status":i.status
    }

@router.delete("/{instance_id}")
def delete_instance(instance_id, db:Session=Depends(get_db)):
    instance = db.query(DBInstance).filter(DBInstance.id==instance_id).first()
    if not instance:
        raise HTTPException(404, "Instance not found")
    
    try:
        container = client.containers.get(instance.identifier)
        container.stop()
        container.remove()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {e}")
    
    db.delete(instance)
    db.commit()
    return {"msg":f"Deleted instance with id {instance_id}"}