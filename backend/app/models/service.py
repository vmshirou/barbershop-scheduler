from sqlalchemy import Integer, String, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)   # minutos
    price: Mapped[float] = mapped_column(Float, nullable=False)

    turns: Mapped[list["Turn"]] = relationship(back_populates="service")