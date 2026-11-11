from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db, require_admin
from app.crud.turn import validate_turn
from app.models.turn import Turn
from app.models.user import User
from app.schemas.turn import (
    TurnCreate,
    StateTurnUpdate,
    TurnRead,
    TurnReadDetailed,
    TurnUpdate,
)

router = APIRouter(prefix="/turnos", tags=["turnos"])


@router.get("/jornada/{id_jornada}", response_model=list[TurnReadDetailed])
def por_jornada(
    id_jornada: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(Turn)
        .filter(Turn.id_workday == id_jornada)
        .order_by(Turn.start_time)
        .all()
    )


@router.get(
    "/cliente/{id_cliente}",
    response_model=list[TurnReadDetailed],
    dependencies=[Depends(require_admin)],
)
def por_cliente(id_cliente: int, db: Session = Depends(get_db)):
    return (
        db.query(Turn)
        .filter(Turn.id_client == id_cliente)
        .order_by(Turn.id_workday, Turn.start_time)
        .all()
    )


@router.post(
    "/", response_model=TurnRead, status_code=201,
    dependencies=[Depends(require_admin)],
)
def crear(data: TurnCreate, db: Session = Depends(get_db)):
    validate_turn(
        db,
        id_client=data.id_client,
        id_service=data.id_service,
        id_workday=data.id_workday,
        id_barber=data.id_barber,
        time=data.start_time,
    )
    t = Turn(**data.model_dump())
    db.add(t)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un turno para ese barbero a esa hora en la jornada")
    db.refresh(t)
    return t


@router.put(
    "/{id}", response_model=TurnRead,
    dependencies=[Depends(require_admin)],
)
def editar(id: int, data: TurnUpdate, db: Session = Depends(get_db)):
    t = db.get(Turn, id)
    if not t:
        raise HTTPException(404, "Turno no encontrado")

    updates = data.model_dump(exclude_unset=True)
    merged = {
        "id_client": updates.get("id_client", t.id_client),
        "id_service": updates.get("id_service", t.id_service),
        "id_workday": updates.get("id_workday", t.id_workday),
        "id_barber": updates.get("id_barber", t.id_barber),
        "time": updates.get("start_time", t.start_time),
    }
    validate_turn(db, id_excluir=t.id, **merged)

    for k, v in updates.items():
        setattr(t, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un turno para ese barbero a esa hora en la jornada")
    db.refresh(t)
    return t


@router.patch("/{id}/estado", response_model=TurnRead)
def cambiar_estado(
    id: int,
    data: StateTurnUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    t = db.get(Turn, id)
    if not t:
        raise HTTPException(404, "Turno no encontrado")
    t.state = data.state
    db.commit()
    db.refresh(t)
    return t


@router.delete(
    "/{id}", status_code=204,
    dependencies=[Depends(require_admin)],
)
def eliminar(id: int, db: Session = Depends(get_db)):
    t = db.get(Turn, id)
    if not t:
        raise HTTPException(404, "Turno no encontrado")
    db.delete(t)
    db.commit()