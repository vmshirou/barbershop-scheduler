"""Pruebas de turnos - la lógica de negocio más crítica."""
def test_create_turn_valid(client, admin_token, sample_service, sample_client, sample_workday, regular_user_token, db_session):
    """Crear turno válido - todos los requisitos cumplidos."""
    from app.models.user import User, RolEnum
    # Obtener el ID del barbero creado por regular_user_token fixture
    barber = db_session.query(User).filter(User.phone_number == "5550002222").first()
    barber_id = barber.id

    response = client.post(
        "/api/v1/turnos",
        json={
            "id_client": sample_client.id,
            "id_service": sample_service.id,
            "id_workday": sample_workday.id,
            "id_barber": barber_id,
            "start_time": "09:00"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201, f"Crear turno falló: {response.status_code} - {response.text}"


def test_turn_outside_workday_before(client, admin_token, sample_service, sample_client, sample_workday, regular_user_token, db_session):
    """Turno que empieza antes de la jornada debe fallar."""
    from app.models.user import User, RolEnum
    barber = db_session.query(User).filter(User.phone_number == "5550002222").first()
    barber_id = barber.id

    response = client.post(
        "/api/v1/turnos",
        json={
            "id_client": sample_client.id,
            "id_service": sample_service.id,
            "id_workday": sample_workday.id,
            "id_barber": barber_id,
            "start_time": "08:00"  # Antes de las 9:00
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400, f"Esperaba 400, got {response.status_code}"


def test_turn_overlap_same_barber(client, admin_token, sample_service, sample_client, sample_workday, regular_user_token, db_session):
    """Superposición de turnos para el mismo barbero debe fallar (409)."""
    from app.models.user import User, RolEnum
    barber = db_session.query(User).filter(User.phone_number == "5550002222").first()
    barber_id = barber.id

    # Crear primer turno a las 09:30
    create_resp = client.post(
        "/api/v1/turnos",
        json={
            "id_client": sample_client.id,
            "id_service": sample_service.id,
            "id_workday": sample_workday.id,
            "id_barber": barber_id,
            "start_time": "09:30"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert create_resp.status_code == 201, f"Primer turno falló: {create_resp.text}"
    
    # Intentar crear segundo turno a las 09:45 (se solapa con servicio de 30 min)
    response = client.post(
        "/api/v1/turnos",
        json={
            "id_client": sample_client.id,
            "id_service": sample_service.id,
            "id_workday": sample_workday.id,
            "id_barber": barber_id,
            "start_time": "09:45"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 409, f"Se esperaba 409 (solapamiento), got {response.status_code}: {response.text}"


def test_different_barbers_same_time(client, admin_token, sample_service, sample_client, sample_workday, regular_user_token, db_session):
    """Distintos barberos a la misma hora DEBE PERMITIRSE (201)."""
    from app.models.user import User, RolEnum
    
    # Obtener el primer barbero (creado por regular_user_token)
    barber1 = db_session.query(User).filter(User.phone_number == "5550002222").first()
    b1_id = barber1.id
    
    # Crear segundo barbero
    client.post(
        "/api/v1/usuarios",
        json={"name": "Barbero Extra", "phone_number": "5550009898", "rol": "BARBER", "password": "password123"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    barber2 = db_session.query(User).filter(User.phone_number == "5550009898").first()
    b2_id = barber2.id

    # Crear turno para barbero 1 a las 10:00
    client.post(
        "/api/v1/turnos",
        json={
            "id_client": sample_client.id,
            "id_service": sample_service.id,
            "id_workday": sample_workday.id,
            "id_barber": b1_id,
            "start_time": "10:00"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Crear turno para barbero 2 a la misma hora 10:00
    response = client.post(
        "/api/v1/turnos",
        json={
            "id_client": sample_client.id,
            "id_service": sample_service.id,
            "id_workday": sample_workday.id,
            "id_barber": b2_id,
            "start_time": "10:00"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201, f"Se esperaba 201 para barberos distintos, got {response.status_code}: {response.text}"


def test_turn_within_workday_duration(client, admin_token, sample_service, sample_client, sample_workday, regular_user_token, db_session):
    """Turno dentro del rango de la jornada debe ser válido."""
    from app.models.user import User, RolEnum
    barber = db_session.query(User).filter(User.phone_number == "5550002222").first()
    barber_id = barber.id

    response = client.post(
        "/api/v1/turnos",
        json={
            "id_client": sample_client.id,
            "id_service": sample_service.id,
            "id_workday": sample_workday.id,
            "id_barber": barber_id,
            "start_time": "11:00"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201, f"Esperaba 201, got {response.status_code}: {response.text}"


def test_turn_edit_overlap_excluir(client, admin_token, sample_service, sample_client, sample_workday, regular_user_token, db_session):
    """Editar turno: al excluir el turno propio, debería permitir cambiar de hora si no hay superposición."""
    from app.models.user import User, RolEnum
    barber = db_session.query(User).filter(User.phone_number == "5550002222").first()
    barber_id = barber.id

    # Crear turno a las 12:00
    create_resp = client.post(
        "/api/v1/turnos",
        json={
            "id_client": sample_client.id,
            "id_service": sample_service.id,
            "id_workday": sample_workday.id,
            "id_barber": barber_id,
            "start_time": "12:00"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert create_resp.status_code == 201, f"Crear turno falló: {create_resp.text}"
    turn_id = create_resp.json()["id"]
    
    # Editar a las 12:30 (excluyendo el actual)
    response = client.put(
        f"/api/v1/turnos/{turn_id}",
        json={"start_time": "12:30"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200, f"Editar turno falló: {response.status_code}: {response.text}"