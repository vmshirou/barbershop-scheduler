from datetime import time

from fastapi import HTTPException
from sqlalchemy.orm import Session, joinedload

from app.models.client import Client
from app.models.day import Workday
from app.models.service import Service
from app.models.turn import Turn
from app.models.user import RolEnum, User


def _to_min(t: time) -> int:
    return t.hour * 60 + t.minute


def validate_turn(
    db: Session,
    *,
    id_client: int,
    id_service: int,
    id_workday: int,
    id_barber: int,
    time: time,
    id_excluir: int | None = None,
) -> None:
    if not db.get(Client, id_client):
        raise HTTPException(400, "El cliente no existe")
    service = db.get(Service, id_service)
    if not service:
        raise HTTPException(400, "El servicio no existe")
    workday = db.get(Workday, id_workday)
    if not workday:
        raise HTTPException(400, "La jornada no existe")
    barber = db.get(User, id_barber)
    if not barber:
        raise HTTPException(400, "El barbero no existe")
    if barber.rol != RolEnum.BARBER:
        raise HTTPException(400, "id_barbero debe ser un usuario con rol 'barbero'")

    begin_turn = _to_min(time)
    turn_end = begin_turn + service.duration
    workday_begin = _to_min(workday.start_time)
    workday_end = workday_begin + workday.duration

    if begin_turn < workday_begin:
        raise HTTPException(
            400, f"El turno comienza antes de la jornada ({workday.start_time})"
        )
    if turn_end > workday_end:
        raise HTTPException(
            400, "El turno excede la duración total de la jornada"
        )

    # Eager load service para evitar N+1 y DetachedInstanceError
    q = db.query(Turn).options(joinedload(Turn.service)).filter(
        Turn.id_workday == id_workday,
        Turn.id_barber == id_barber,
    )
    if id_excluir is not None:
        q = q.filter(Turn.id != id_excluir)

    for t in q.all():
        begin = _to_min(t.start_time)
        end = begin + t.service.duration
        if begin_turn < end and begin < turn_end:
            raise HTTPException(
                409,
                f"Solapamiento con turno id={t.id} "
                f"(hora={t.start_time}, duracion={t.service.duration}min)",
            )