from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate

router = APIRouter(
    prefix="/clientes", tags=["clientes"], dependencies=[Depends(require_admin)]
)


@router.get("/", response_model=list[ClientRead])
def listar(db: Session = Depends(get_db)):
    return db.query(Client).order_by(Client.id).all()


@router.get("/{id}", response_model=ClientRead)
def obtener(id: int, db: Session = Depends(get_db)):
    c = db.get(Client, id)
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    return c


@router.post("/", response_model=ClientRead, status_code=201)
def crear(data: ClientCreate, db: Session = Depends(get_db)):
    c = Client(**data.model_dump())
    db.add(c)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un cliente con ese teléfono")
    db.refresh(c)
    return c


@router.put("/{id}", response_model=ClientRead)
def editar(id: int, data: ClientUpdate, db: Session = Depends(get_db)):
    c = db.get(Client, id)
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    updates = data.model_dump(exclude_unset=True)
    if "phone_number" in updates and db.query(Client).filter(
        Client.phone_number == updates["phone_number"], Client.id != id
    ).first():
        raise HTTPException(409, "Teléfono ya en uso")
    for k, v in updates.items():
        setattr(c, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Teléfono ya en uso")
    db.refresh(c)
    return c


@router.delete("/{id}", status_code=204)
def eliminar(id: int, db: Session = Depends(get_db)):
    c = db.get(Client, id)
    if not c:
        raise HTTPException(404, "Cliente no encontrado")
    if c.turns:
        raise HTTPException(409, "No se puede eliminar: tiene turnos asociados")
    db.delete(c)
    db.commit()