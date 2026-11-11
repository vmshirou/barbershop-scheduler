from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_db, require_admin
from app.core.security import hash_password
from app.models.user import RolEnum, User
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(
    prefix="/usuarios",
    tags=["usuarios"],
    dependencies=[Depends(require_admin)],
)


@router.get("/", response_model=list[UserRead])
def listar(rol: RolEnum | None = None, db: Session = Depends(get_db)):
    q = db.query(User)
    if rol is not None:
        q = q.filter(User.rol == rol)
    return q.order_by(User.id).all()


@router.post("/", response_model=UserRead, status_code=201)
def crear(data: UserCreate, db: Session = Depends(get_db)):
    u = User(
        name=data.name,
        phone_number=data.phone_number,
        rol=data.rol,
        password_hash=hash_password(data.password),
    )
    db.add(u)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya existe un usuario con ese teléfono")
    db.refresh(u)
    return u


@router.put("/{id}", response_model=UserRead)
def editar(id: int, data: UserUpdate, db: Session = Depends(get_db)):
    u = db.get(User, id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    updates = data.model_dump(exclude_unset=True)
    if "phone_number" in updates and db.query(User).filter(
        User.phone_number == updates["phone_number"], User.id != id
    ).first():
        raise HTTPException(409, "Teléfono ya en uso")
    if "name" in updates and db.query(User).filter(
            User.name == updates["name"], User.id != id
        ).first():
        raise HTTPException(409, "Ya existe un usuario con ese nombre")
    if "password" in updates:
        u.password_hash = hash_password(updates.pop("password"))
    for k, v in updates.items():
        setattr(u, k, v)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Teléfono ya en uso")
    db.refresh(u)
    return u


@router.delete("/{id}", status_code=204)
def eliminar(id: int, db: Session = Depends(get_db)):
    u = db.get(User, id)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    if u.turns_like_barber:
        raise HTTPException(409, "No se puede eliminar: tiene turnos asociados")
    db.delete(u)
    db.commit()