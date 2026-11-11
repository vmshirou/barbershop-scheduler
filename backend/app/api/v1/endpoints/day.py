from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.models.day import Workday
from app.models.user import User
from app.schemas.day import WorkdayCreate, WorkdayRead, WorkdayUpdate

router = APIRouter(prefix="/jornadas", tags=["jornadas"])


@router.get("/", response_model=list[WorkdayRead])
def listar(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return db.query(Workday).order_by(Workday.datestamp, Workday.start_time).all()


@router.get("/{id}", response_model=WorkdayRead)
def obtener(
    id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    j = db.get(Workday, id)
    if not j:
        raise HTTPException(404, "Jornada no encontrada")
    return j


@router.post(
    "/", response_model=WorkdayRead, status_code=201,
    dependencies=[Depends(require_admin)],
)
def crear(data: WorkdayCreate, db: Session = Depends(get_db)):
    j = Workday(**data.model_dump())
    db.add(j)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe una jornada con esa fecha y hora de inicio")
    db.refresh(j)
    return j


@router.put(
    "/{id}", response_model=WorkdayRead,
    dependencies=[Depends(require_admin)],
)
def editar(id: int, data: WorkdayUpdate, db: Session = Depends(get_db)):
    j = db.get(Workday, id)
    if not j:
        raise HTTPException(404, "Jornada no encontrada")
    updates = data.model_dump(exclude_unset=True)
    for k, v in updates.items():
        setattr(j, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe una jornada con esa fecha y hora de inicio")
    db.refresh(j)
    return j


@router.delete(
    "/{id}", status_code=204,
    dependencies=[Depends(require_admin)],
)
def eliminar(id: int, db: Session = Depends(get_db)):
    j = db.get(Workday, id)
    if not j:
        raise HTTPException(404, "Jornada no encontrada")
    if j.turns:
        raise HTTPException(409, "No se puede eliminar: la jornada tiene turnos")
    db.delete(j)
    db.commit()