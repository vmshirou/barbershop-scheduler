from fastapi import APIRouter

from app.api.v1.endpoints import (
    auth, client, day, service, turn, user,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(user.router)
api_router.include_router(client.router)
api_router.include_router(service.router)
api_router.include_router(day.router)
api_router.include_router(turn.router)