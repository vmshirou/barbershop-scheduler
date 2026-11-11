from pydantic import BaseModel, ConfigDict, Field

class ClientBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    phone_number: str = Field(..., min_length=5, max_length=30)
    notes: str | None = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=120)
    phone_number: str | None = Field(None, min_length=5, max_length=30)
    notes: str | None = None

class ClientRead(ClientBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class ClientBrief(BaseModel):
    id: int
    name: str
    phone_number: str
    model_config = ConfigDict(from_attributes=True)