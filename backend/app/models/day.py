from datetime import date, time

from sqlalchemy import Integer, Time, Date, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Workday(Base):
    __tablename__ = "workdays"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)  # minutos
    datestamp: Mapped[date] = mapped_column(Date, nullable=False, index=True)

    turns: Mapped[list["Turn"]] = relationship(
        back_populates="workday", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("datestamp", "start_time", name="uq_workday_datestamp_start_time"),
    )