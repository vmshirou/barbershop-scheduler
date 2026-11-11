from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.service import Service
from app.schemas.service import ServiceCreate, ServiceRead, ServiceUpdate

router = APIRouter(
    prefix="/servicios", tags=["servicios"], dependencies=[Depends(require_admin)]
)


@router.get("/", response_model=list[ServiceRead])
def listar(db: Session = Depends(get_db)):
    return db.query(Service).order_by(Service.id).all()


@router.get("/{id}", response_model=ServiceRead)
def obtener(id: int, db: Session = Depends(get_db)):
    s = db.get(Service, id)
    if not s:
        raise HTTPException(404, "Servicio no encontrado")
    return s


@router.post("/", response_model=ServiceRead, status_code=201)
def crear(data: ServiceCreate, db: Session = Depends(get_db)):
    s = Service(**data.model_dump())
    db.add(s)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un servicio con ese nombre")
    db.refresh(s)
    return s


@router.put("/{id}", response_model=ServiceRead)
def editar(id: int, data: ServiceUpdate, db: Session = Depends(get_db)):
    s = db.get(Service, id)
    if not s:
        raise HTTPException(404, "Servicio no encontrado")
    updates = data.model_dump(exclude_unset=True)
    if "name" in updates and db.query(Service).filter(
        Service.name == updates["name"], Service.id != id
    ).first():
        raise HTTPException(409, "Nombre de servicio ya en uso")
    for k, v in updates.items():
        setattr(s, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Nombre de servicio ya en uso")
    db.refresh(s)
    return s


@router.delete("/{id}", status_code=204)
def eliminar(id: int, db: Session = Depends(get_db)):
    s = db.get(Service, id)
    if not s:
        raise HTTPException(404, "Servicio no encontrado")
    if s.turns:
        raise HTTPException(409, "No se puede eliminar: tiene turnos asociados")
    db.delete(s)
    db.commit()