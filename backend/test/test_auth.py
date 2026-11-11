"""Pruebas de autenticación y tokens."""
def test_login_valid(client, admin_token):
    """Login con credenciales válidas (admin)."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "5550001111", "password": "Admin1234!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_invalid(client):
    """Login con credenciales inválidas."""
    response = client.post(
        "/api/v1/auth/login",
        data={"username": "5550001111", "password": "wrongpassword"}
    )
    assert response.status_code == 401


def test_me_with_token(client, admin_token):
    """Obtener perfil con token válido."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    # El modelo RolEnum usa valores mayúsculas: ADMIN, BARBER
    assert response.json()["rol"] in ("ADMIN", "admin")


def test_me_without_token(client):
    """Acceder a /me sin token debe fallar."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401