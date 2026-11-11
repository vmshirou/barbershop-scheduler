from pydantic import BaseModel, ConfigDict, Field

from app.models.user import RolEnum

class UserBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    phone_number: str = Field(..., min_length=5, max_length=30)
    rol: RolEnum = RolEnum.BARBER

class UserCreate(UserBase):
    password: str = Field(..., min_length=6, max_length=72)

class UserUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    phone_number: str | None = Field(None, min_length=5, max_length=30)
    rol: RolEnum | None = None
    password: str | None = Field(None, min_length=6, max_length=72)

class UserRead(BaseModel):
    id: int
    name: str
    phone_number: str
    rol: RolEnum
    model_config = ConfigDict(from_attributes=True)

class UserBrief(BaseModel):
    id: int
    name: str
    model_config = ConfigDict(from_attributes=True)