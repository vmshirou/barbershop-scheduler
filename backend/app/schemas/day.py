from datetime import date, time

from pydantic import BaseModel, ConfigDict, Field

class WorkdayBase(BaseModel):
    start_time: time
    duration: int = Field(..., gt=0, description="Duración en minutos")
    datestamp: date

class WorkdayCreate(WorkdayBase):
    pass

class WorkdayUpdate(BaseModel):
    start_time: time | None = None
    duration: int | None = Field(None, gt=0)
    datestamp: date | None = None

class WorkdayRead(WorkdayBase):
    id: int
    model_config = ConfigDict(from_attributes=True)