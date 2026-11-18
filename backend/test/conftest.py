"""Fixtures compartidas para las pruebas de la API."""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import engine, Base, SessionLocal
from app.core.security import create_access_token, hash_password
from app.models.user import User, RolEnum
from datetime import date, time


@pytest.fixture(scope="session")
def client():
    """Test client de FastAPI."""
    return TestClient(app)


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Crear tablas una vez al inicio de la sesión."""
    Base.metadata.create_all(bind=engine)
    yield


@pytest.fixture(scope="function")
def db_session():
    """Sesión de BD por función con limpieza de tablas para aislamiento completo."""
    db = SessionLocal()
    try:
        # Limpiar todas las tablas antes de cada test (orden inverso de dependencias)
        for table in reversed(Base.metadata.sorted_tables):
            db.execute(table.delete())
        db.commit()
        yield db
    finally:
        db.rollback()
        db.close()


def _login_user(client, phone, password):
    """Helper para login de usuario."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": phone, "password": password}
    )
    return response


def _get_access_token(response):
    """Extract access_token from login response."""
    data = response.json()
    return data["token"]["access_token"]


@pytest.fixture(scope="function")
def admin_token(client, db_session):
    """Token de admin - crea el admin si no existe en la BD."""
    existing = db_session.query(User).filter(User.phone_number == "5550001111").first()
    if not existing:
        admin_user = User(
            name="Admin",
            phone_number="5550001111",
            rol=RolEnum.ADMIN,
            password_hash=hash_password("Admin1234!")
        )
        db_session.add(admin_user)
        db_session.commit()
        db_session.refresh(admin_user)
    response = _login_user(client, "5550001111", "Admin1234!")
    assert response.status_code == 200, f"Login admin falló: {response.status_code} - {response.text}"
    return _get_access_token(response)


@pytest.fixture(scope="function")
def regular_user_token(client, admin_token, db_session):
    """Token para usuario barbero - crea si no existe."""
    existing = db_session.query(User).filter(User.phone_number == "5550002222").first()
    if not existing:
        barber_user = User(
            name="Barbero Test",
            phone_number="5550002222",
            rol=RolEnum.BARBER,
            password_hash=hash_password("password123")
        )
        db_session.add(barber_user)
        db_session.commit()
        db_session.refresh(barber_user)
    response = _login_user(client, "5550002222", "password123")
    assert response.status_code == 200, f"Login barbero falló: {response.status_code} - {response.text}"
    return _get_access_token(response)


@pytest.fixture
def sample_service(db_session):
    """Servicio de ejemplo - usa nombre único."""
    from app.models.service import Service
    import time
    service_name = f"Corte_{int(time.time() * 1000) % 1000000}"
    service = Service(name=service_name, duration=30, price=15.0)
    db_session.add(service)
    db_session.commit()
    db_session.refresh(service)
    return service


@pytest.fixture
def sample_client(db_session):
    """Cliente de ejemplo - usa teléfono único."""
    from app.models.client import Client
    import time
    phone = f"555{int(time.time() * 1000) % 1000000:06d}"
    client_model = Client(name=f"Cliente_{phone}", phone_number=phone, notes="")
    db_session.add(client_model)
    db_session.commit()
    db_session.refresh(client_model)
    return client_model


@pytest.fixture
def sample_workday(db_session):
    """Jornada de ejemplo."""
    from app.models.day import Workday
    existing = db_session.query(Workday).filter(
        Workday.start_time == time(9, 0),
        Workday.datestamp == date.today()
    ).first()
    if not existing:
        wd = Workday(start_time=time(9, 0), duration=480, datestamp=date.today())
        db_session.add(wd)
        db_session.commit()
        db_session.refresh(wd)
    else:
        wd = existing
    return wd