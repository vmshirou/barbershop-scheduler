"""CRUD servicios (admin solo)."""
def test_list_services_admin(client, admin_token):
    """Listar servicios como admin."""
    response = client.get(
        "/api/v1/servicios",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200


def test_create_service_admin(client, admin_token):
    """Crear servicio como admin."""
    # Usar nombre único con timestamp
    import time
    service_name = f"Servicio_Test_{int(time.time() * 1000) % 1000000}"
    response = client.post(
        "/api/v1/servicios",
        json={"name": service_name, "duration": 30, "price": 15.0},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201, f"Crear servicio falló: {response.status_code} - {response.text}"
    assert response.json()["name"] == service_name


def test_duplicate_service_name(client, admin_token):
    """Nombre de servicio duplicado."""
    # Crear primer servicio
    client.post(
        "/api/v1/servicios",
        json={"name": "Corte_1", "duration": 30, "price": 15.0},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    # Intentar crear otro con mismo nombre
    response = client.post(
        "/api/v1/servicios",
        json={"name": "Corte_1", "duration": 30, "price": 20.0},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 409, f"Esperaba 409, got {response.status_code}: {response.text}"