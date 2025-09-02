from fastapi import APIRouter, Depends, HTTPException, WebSocket, Query, WebSocketDisconnect
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session
from db.database import get_db
import docker
import socket
from sqlalchemy.sql import func
from datetime import datetime
import asyncio
import json
from services.oauth2 import get_current_user
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Initialize Docker client (same as RDS)
client = docker.DockerClient(base_url='unix:///var/run/docker.sock')

# SQLAlchemy base and engine
Base = declarative_base()
SQLDB = 'sqlite:///./aws-emulator.db'  # Match database path from db/database.py
engine = create_engine(SQLDB, connect_args={"check_same_thread": False})

# SQLAlchemy model for EC2 instances
class Instance(Base):
    """
    SQLAlchemy model for the 'instances' table to store EC2 instance metadata.
    Fields:
    - id: Docker container ID (primary key).
    - identifier: User-provided unique identifier (e.g., 'ec2-myinstance').
    - ami_id: Docker image used as AMI (e.g., 'alpine:latest').
    - instance_type: Instance type (default 't2.micro').
    - status: Instance status ('running', 'stopped').
    - created_at: Creation timestamp.
    """
    __tablename__ = "instances"
    id = Column(String, primary_key=True)
    identifier = Column(String, nullable=False, unique=True)
    ami_id = Column(String, nullable=False)
    instance_type = Column(String, nullable=False, default="t2.micro")
    status = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

# Create the instances table when the module is imported
Base.metadata.create_all(bind=engine)

# Pydantic models for request/response validation
class InstanceCreate(BaseModel):
    """
    Pydantic model for creating an EC2 instance.
    Fields:
    - identifier: Unique name for the instance (e.g., 'myinstance').
    - ami_id: Docker image to use as AMI (e.g., 'alpine:latest').
    - instance_type: Optional instance type (default 't2.micro').
    """
    identifier: str = Field(..., example="myinstance")
    ami_id: str = Field(..., example="alpine:latest")
    instance_type: str = Field("t2.micro", example="t2.micro")

class InstanceResponse(BaseModel):
    """
    Pydantic model for EC2 instance response.
    Fields:
    - instance_id: Docker container ID.
    - identifier: Unique instance name.
    - ami_id: Docker image used.
    - instance_type: Instance type.
    - status: Instance status.
    """
    instance_id: str
    identifier: str
    ami_id: str
    instance_type: str
    status: str

class InstanceListResponse(BaseModel):
    """
    Pydantic model for listing EC2 instances.
    Fields:
    - instances: List of InstanceResponse objects.
    """
    instances: list[InstanceResponse]

# WebSocket dependency for authentication
security = HTTPBearer()

async def verify_token_ws(token: str = Query(...)):
    """
    WebSocket token verification using existing auth infrastructure.
    """
    try:
        print(f"Received token in verify_token_ws: {token}")
        
        # Use your existing auth infrastructure
        from db.database import SessionLocal
        from fastapi.security import HTTPAuthorizationCredentials
        
        credentials = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)
        db = SessionLocal()
        try:
            # Call get_current_user with proper parameters
            user = get_current_user(credentials, db)
            print(f"Authenticated user: {user.email}")
            return user
        finally:
            db.close()
            
    except Exception as e:
        print(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

# Define the FastAPI router for EC2
router = APIRouter(
    prefix="/ec2",
    tags=["ec2"]
)

@router.post("/instances", response_model=InstanceResponse)
def create_instance(request: InstanceCreate, db: Session = Depends(get_db)):
    """
    Create a new EC2 instance using a Docker container.
    - Creates a container with the specified AMI (Docker image) and 'sleep infinity'.
    - Stores metadata in SQLite (instances table).
    - Checks for duplicate identifiers.
    - Returns instance details.
    Raises HTTPException for Docker errors or duplicate identifiers.
    """
    # Check for duplicate identifier
    existing_instance = db.query(Instance).filter(Instance.identifier == f"ec2-{request.identifier}").first()
    if existing_instance:
        raise HTTPException(status_code=400, detail="Instance identifier already exists")

    try:
        # Run Docker container
        container = client.containers.run(
            request.ami_id,
            name=f"ec2-{request.identifier}",
            command="sleep infinity",
            detach=True
        )

        # Store metadata in DB
        db_instance = Instance(
            id=container.id,
            identifier=f"ec2-{request.identifier}",
            ami_id=request.ami_id,
            instance_type=request.instance_type,
            status="running",
            created_at=datetime.now()
        )
        db.add(db_instance)
        db.commit()
        db.refresh(db_instance)

        return InstanceResponse(
            instance_id=db_instance.id,
            identifier=db_instance.identifier,
            ami_id=db_instance.ami_id,
            instance_type=db_instance.instance_type,
            status=db_instance.status
        )
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating instance: {str(e)}")

@router.get("/instances", response_model=InstanceListResponse)
def list_instances(db: Session = Depends(get_db)):
    """
    List all EC2 instances.
    - Retrieves all instances from the SQLite 'instances' table.
    - Returns a list of instance details.
    """
    instances = db.query(Instance).all()
    return InstanceListResponse(
        instances=[
            InstanceResponse(
                instance_id=instance.id,
                identifier=instance.identifier,
                ami_id=instance.ami_id,
                instance_type=instance.instance_type,
                status=instance.status
            ) for instance in instances
        ]
    )

@router.post("/instances/{instance_id}/start", response_model=InstanceResponse)
def start_instance(instance_id: str, db: Session = Depends(get_db)):
    """
    Start a stopped EC2 instance.
    - Starts the Docker container by ID.
    - Updates status to 'running' in the database.
    - Returns updated instance details.
    Raises HTTPException if instance not found or Docker error occurs.
    """
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    try:
        container = client.containers.get(instance_id)
        container.start()
        instance.status = "running"
        db.commit()
        db.refresh(instance)
        return InstanceResponse(
            instance_id=instance.id,
            identifier=instance.identifier,
            ami_id=instance.ami_id,
            instance_type=instance.instance_type,
            status=instance.status
        )
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error starting instance: {str(e)}")

@router.post("/instances/{instance_id}/stop", response_model=InstanceResponse)
def stop_instance(instance_id: str, db: Session = Depends(get_db)):
    """
    Stop a running EC2 instance.
    - Stops the Docker container by ID.
    - Updates status to 'stopped' in the database.
    - Returns updated instance details.
    Raises HTTPException if instance not found or Docker error occurs.
    """
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    try:
        container = client.containers.get(instance_id)
        container.stop()
        instance.status = "stopped"
        db.commit()
        db.refresh(instance)
        return InstanceResponse(
            instance_id=instance.id,
            identifier=instance.identifier,
            ami_id=instance.ami_id,
            instance_type=instance.instance_type,
            status=instance.status
        )
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error stopping instance: {str(e)}")

@router.delete("/instances/{instance_id}")
def delete_instance(instance_id: str, db: Session = Depends(get_db)):
    """
    Delete an EC2 instance.
    - Removes the Docker container by ID.
    - Deletes the instance record from the database.
    - Returns 204 No Content on success.
    Raises HTTPException if instance not found or Docker error occurs.
    """
    instance = db.query(Instance).filter(Instance.id == instance_id).first()
    if not instance:
        raise HTTPException(status_code=404, detail="Instance not found")

    try:
        container = client.containers.get(instance_id)
        container.remove(force=True)  # Force remove even if running
        db.delete(instance)
        db.commit()
        return None
    except docker.errors.APIError as e:
        raise HTTPException(status_code=500, detail=f"Docker error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting instance: {str(e)}")

@router.websocket("/instances/{instance_id}/console")
async def ec2_console(websocket: WebSocket, instance_id: str, token: str = Query(...)):
    try:
        user = await verify_token_ws(token)
        print(f"WebSocket connected for user: {user.email}, instance: {instance_id}")
    except HTTPException as e:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    await websocket.accept()
    
    try:
        container = client.containers.get(instance_id)
        container.reload()
        if container.status != 'running':
            await websocket.send_text("Error: Container is not running. Please start the instance first.\r\n")
            await websocket.close()
            return
        
        exec_command = ["/bin/bash"] if 'ubuntu' in container.image.tags else ["/bin/sh"]
        exec_id = client.api.exec_create(
            container.id, 
            exec_command, 
            stdin=True, 
            stdout=True, 
            stderr=True, 
            tty=True
        )
        
        sock = client.api.exec_start(
            exec_id["Id"], 
            detach=False, 
            tty=True, 
            stream=True, 
            socket=True
        )._sock
        sock.settimeout(0.1)
        
        await websocket.send_text(f"Connected to {instance_id} console. Type 'exit' to disconnect.\r\n")
        
        async def read_from_container():
            while True:
                try:
                    data = sock.recv(4096)
                    if not data:
                        break
                    await websocket.send_text(data.decode('utf-8', errors='ignore'))
                except socket.timeout:
                    await asyncio.sleep(0.01)
                    continue
                except Exception as e:
                    print(f"Error reading from container: {e}")
                    break
        
        async def write_to_container():
            while True:
                try:
                    data = await websocket.receive_text()
                    sock.send(data.encode('utf-8'))
                except WebSocketDisconnect:
                    print("WebSocket disconnected")
                    break
                except Exception as e:
                    print(f"Error writing to container: {e}")
                    break
        
        await asyncio.gather(
            read_from_container(),
            write_to_container(),
            return_exceptions=True
        )
        
    except docker.errors.NotFound:
        await websocket.send_text("Error: Container not found\r\n")
    except docker.errors.APIError as e:
        await websocket.send_text(f"Docker Error: {str(e)}\r\n")
    except Exception as e:
        print(f"Console error: {e}")
        await websocket.send_text(f"Error: {str(e)}\r\n")
    finally:
        try:
            if 'sock' in locals():
                sock.close()
        except:
            pass
        try:
            await websocket.close()
        except:
            pass