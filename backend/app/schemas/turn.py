from datetime import time

from pydantic import BaseModel, ConfigDict, Field

from app.models.turn import TurnStateEnum
from app.schemas.client import ClientBrief
from app.schemas.day import WorkdayRead
from app.schemas.service import ServiceBrief
from app.schemas.user import UserBrief

class TurnBase(BaseModel):
    id_client: int
    id_service: int = Field(..., description="FK al servicio")
    id_workday: int
    id_barber: int
    start_time: time

class TurnCreate(TurnBase):
    pass

class TurnUpdate(BaseModel):
    id_client: int | None = None
    id_service: int | None = None
    id_workday: int | None = None
    id_barber: int | None = None
    start_time: time | None = None

class StateTurnUpdate(BaseModel):
    state: TurnStateEnum

class TurnRead(BaseModel):
    id: int
    id_client: int
    id_service: int
    id_workday: int
    id_barber: int
    start_time: time
    state: TurnStateEnum
    model_config = ConfigDict(from_attributes=True)

class TurnReadDetailed(TurnRead):
    client: ClientBrief
    service: ServiceBrief
    barber: UserBrief
    workday: WorkdayRead