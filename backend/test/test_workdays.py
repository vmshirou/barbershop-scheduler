"""CRUD jornadas (admin solo)."""
from datetime import date, time


def test_list_workdays_admin(client, admin_token):
    """Listar jornadas como admin."""
    response = client.get(
        "/api/v1/jornadas",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200


def test_create_workday_admin(client, admin_token):
    """Crear jornada como admin."""
    response = client.post(
        "/api/v1/jornadas",
        json={"start_time": "14:00", "duration": 480, "datestamp": str(date.today())},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    # 201 Created o 409 si ya existe en la misma fecha/hora
    assert response.status_code in (201, 409)


def test_duplicate_workday_time(client, admin_token):
    """Fecha y hora de jornada duplicada."""
    # Usar hora distinta para evitar colisión con otras pruebas
    payload = {"start_time": "16:00", "duration": 480, "datestamp": str(date.today())}
    client.post(
        "/api/v1/jornadas",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    response = client.post(
        "/api/v1/jornadas",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 409