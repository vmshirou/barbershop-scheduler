from pydantic import BaseModel, ConfigDict, Field

class ServiceBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    duration: int = Field(..., gt=0, description="Duración en minutos")
    price: float = Field(..., ge=0)

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    duration: int | None = Field(None, gt=0)
    price: float | None = Field(None, ge=0)

class ServiceRead(ServiceBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ServiceBrief(BaseModel):
    id: int
    name: str
    duration: int
    price: float
    model_config = ConfigDict(from_attributes=True)