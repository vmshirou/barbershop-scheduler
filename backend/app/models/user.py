import enum
from sqlalchemy import Integer, String, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class RolEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    BARBER = "BARBER"

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    rol: Mapped[RolEnum] = mapped_column(Enum(RolEnum, name="rol_user"), nullable=False, default=RolEnum.BARBER)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    turns_like_barber: Mapped[list["Turn"]] = relationship(back_populates="barber")