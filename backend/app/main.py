from contextlib import asynccontextmanager

from fastapi import FastAPI
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.settings import settings
from app.core.database import Base, SessionLocal, engine
from app.core.security import hash_password
from app.models import *  # noqa: F401,F403 (registra las tablas)
from app.models.user import RolEnum, User


def _seed_admin() -> None:
    db: Session = SessionLocal()
    try:
        if not db.query(User).filter(User.rol == RolEnum.ADMIN).first():
            db.add(
                User(
                    name=settings.first_admin_nombre,
                    phone_number=settings.first_admin_telefono,
                    rol=RolEnum.ADMIN,
                    password_hash=hash_password(settings.first_admin_password),
                )
            )
            db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _seed_admin()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}