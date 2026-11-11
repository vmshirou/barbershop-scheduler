"""Casos de uso completos (integración)."""
from datetime import date, time
from app.models.user import User, RolEnum


def test_end_to_end_scheduling(client, admin_token, db_session):
    """Casos de uso completos: crear jornada -> crear servicio -> crear cliente -> agendar turnos."""
    # Asegurar barbero disponible - usar el que se crea en regular_user_token fixture
    barber = db_session.query(User).filter(User.rol == RolEnum.BARBER).first()
    if not barber:
        create_resp = client.post(
            "/api/v1/usuarios",
            json={"name": "Barbero Integration", "phone_number": "5550007777", "rol": "BARBER", "password": "password123"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert create_resp.status_code == 201, f"Crear barbero falló: {create_resp.text}"
        barber_id = create_resp.json()["id"]
    else:
        barber_id = barber.id

    # 1. Crear jornada con hora única
    wd_resp = client.post(
        "/api/v1/jornadas",
        json={"start_time": "11:00", "duration": 480, "datestamp": str(date.today())},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert wd_resp.status_code == 201, f"Crear jornada falló: {wd_resp.text}"
    workday_id = wd_resp.json()["id"]
    
    # 2. Crear servicio con nombre único
    import time
    svc_resp = client.post(
        "/api/v1/servicios",
        json={"name": f"Servicio_Int_{int(time.time())}", "duration": 30, "price": 15.0},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert svc_resp.status_code == 201, f"Crear servicio falló: {svc_resp.text}"
    service_id = svc_resp.json()["id"]
    
    # 3. Crear cliente con teléfono único
    cli_resp = client.post(
        "/api/v1/clientes",
        json={"name": "Juan Integration", "phone_number": f"555{int(time.time()) % 1000000:06d}", "notes": "Cliente frecuente"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert cli_resp.status_code == 201, f"Crear cliente falló: {cli_resp.text}"
    client_id = cli_resp.json()["id"]
    
    # 4. Agendar turno
    turn_resp = client.post(
        "/api/v1/turnos",
        json={
            "id_client": client_id,
            "id_service": service_id,
            "id_workday": workday_id,
            "id_barber": barber_id,
            "start_time": "11:30"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert turn_resp.status_code == 201, f"Crear turno falló: {turn_resp.text}"
    turn_id = turn_resp.json()["id"]
    
    # 5. Ver turnos de la jornada
    turns_resp = client.get(
        f"/api/v1/turnos/jornada/{workday_id}",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert turns_resp.status_code == 200, f"Obtener turnos falló: {turns_resp.text}"
    assert len(turns_resp.json()) >= 1, "Se esperaba al menos un turno en la jornada"
    
    # 6. Cambiar estado del turno
    state_resp = client.patch(
        f"/api/v1/turnos/{turn_id}/estado",
        json={"state": "SERVED"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert state_resp.status_code == 200, f"Cambiar estado falló: {state_resp.text}"