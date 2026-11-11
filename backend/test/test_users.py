"""CRUD usuarios (admin solo)."""
from app.models.user import User


def test_list_users_admin(client, admin_token):
    """Listar usuarios como admin."""
    response = client.get(
        "/api/v1/usuarios",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200


def test_create_user_admin(client, admin_token, db_session):
    """Crear usuario como admin."""
    existing = db_session.query(User).filter(User.phone_number == "5550004444").first()
    if not existing:
        response = client.post(
            "/api/v1/usuarios",
            json={"name": "Nuevo Barbero", "phone_number": "5550004444", "rol": "BARBER", "password": "password123"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 201, f"Crear usuario falló: {response.status_code} - {response.text}"
    else:
        response = client.put(
            "/api/v1/usuarios/1",
            json={"name": "Actualizado"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code in (200, 404)


def test_create_user_forbidden(client, regular_user_token):
    """Barbero intentando crear usuario - debe fallar."""
    response = client.post(
        "/api/v1/usuarios",
        json={"name": "Intruso", "phone_number": "5550005555", "rol": "BARBER", "password": "password123"},
        headers={"Authorization": f"Bearer {regular_user_token}"}
    )
    assert response.status_code in (403, 422)


def test_duplicate_phone(client, admin_token, db_session):
    """Intento de crear usuario con teléfono duplicado."""
    client.post(
        "/api/v1/usuarios",
        json={"name": "Barbero 1", "phone_number": "5550006666", "rol": "BARBER", "password": "password123"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    response = client.post(
        "/api/v1/usuarios",
        json={"name": "Barbero 2", "phone_number": "5550006666", "rol": "BARBER", "password": "password123"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code in (409, 422), f"Esperaba 409/422, got {response.status_code}: {response.text}"