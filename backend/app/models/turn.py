import enum

from datetime import time
from sqlalchemy import Integer, Time, Enum, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class TurnStateEnum(str, enum.Enum):
    PENDING = "PENDING"
    SERVED = "SERVED"
    NO_SHOW = "NO_SHOW"

class Turn(Base):
    __tablename__ = "turns"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    id_client: Mapped[int] = mapped_column(
        ForeignKey("clients.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    id_service: Mapped[int] = mapped_column(
        ForeignKey("services.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    id_workday: Mapped[int] = mapped_column(
        ForeignKey("workdays.id", ondelete="CASCADE"), nullable=False, index=True
    )
    id_barber: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True
    )
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    state: Mapped[TurnStateEnum] = mapped_column(
        Enum(TurnStateEnum, name="estate_turn"),
        nullable=False,
        default=TurnStateEnum.PENDING,
    )

    client: Mapped["Client"] = relationship(back_populates="turns")
    service: Mapped["Service"] = relationship(back_populates="turns")
    workday: Mapped["Workday"] = relationship(back_populates="turns")
    barber: Mapped["User"] = relationship(back_populates="turns_like_barber")

    __table_args__ = (
        UniqueConstraint("id_workday", "id_barber", "start_time", name="uq_turn_workday_barber_time"),
    )