"""
Seed script for Barberia API.

Generates random data respecting domain logic and constraints:
- Services, Clients, Barbers (Users with rol=BARBER)
- Workdays with schedules (9:00 - 17:00, 480 min)
- Turns for each barber on each workday without overlaps

Constraints respected:
- Turn start_time >= workday.start_time (9:00)
- turn_end (start_time + service.duration) <= workday.end (17:00)
- No overlap of turns for same barber in same workday
- Different barbers CAN have turns at same time
- UniqueConstraint(id_workday, id_barber, start_time)
"""

import random
import string
from datetime import time, date, timedelta

from sqlalchemy.orm import Session, joinedload

from app.core.database import engine, SessionLocal, Base  # Agregado Base
from app.core.security import hash_password
from app.models.client import Client
from app.models.day import Workday
from app.models.service import Service
from app.models.turn import Turn, TurnStateEnum
from app.models.user import RolEnum, User


# ---------- Helpers de datos aleatorios ----------

def random_phone() -> str:
    """Genera un número de teléfono aleatorio formateado."""
    digits = "".join(random.choices(string.digits, k=10))
    return f"+52 {digits[:3]} {digits[3:6]} {digits[6:]}"


def random_name() -> str:
    """Genera un nombre aleatorio."""
    first_names = [
        "Juan", "Maria", "Carlos", "Laura", "Pedro", "Sofia", "Andres", "Ana",
        "Luis", "Elena", "Miguel", "Patricia", "David", "Roberta", "Fernando",
        "Beatriz", "Rafael", "Clara", "Santiago", "Valeria"
    ]
    last_names = [
        "Gomez", "Rodriguez", "Fernandez", "Lopez", "Martinez", "Sanchez",
        "Gonzalez", "Perez", "Ramirez", "Torres", "Nunez", "Jimenez", "Ruiz",
        "Diaz", "Morales", "Castro", "Vega", "Rivera", "Guerrero"
    ]
    return f"{random.choice(first_names)} {random.choice(last_names)}"


def random_service_name() -> str:
    """Nombre de servicio aleatorio."""
    names = [
        "Corte de cabello", "Afeitado", "Lavado y secado",
        "Barba y bigote", "Corte y barba", "Tratamiento capilar",
        "Peinado", "Coloración", "Mechas", "Lisado"
    ]
    return random.choice(names)


def random_duration() -> int:
    """Duración aleatoria en minutos (15-90)."""
    return random.choice([15, 20, 30, 45, 60, 75, 90])


def random_price() -> float:
    """Precio aleatorio."""
    return round(random.uniform(15.0, 80.0), 2)


# Constantes de la jornada
WORKDAY_START = time(9, 0)   # 9:00 AM
WORKDAY_END_MIN = 9 * 60 + 480  # 17:00 (540 + 480 = 1020 min desde medianoche)
WORKDAY_DURATION = 480  # 8 horas


def time_to_minutes(t: time) -> int:
    """Convierte objeto time a minutos desde medianoche."""
    return t.hour * 60 + t.minute


def minutes_to_time(minutes: int) -> time:
    """Convierte minutos desde medianoche a objeto time."""
    h = (minutes // 60) % 24
    m = minutes % 60
    return time(h, m)


# ---------- Creación de entidades ----------

def create_services(db: Session, qty: int = 6) -> list[Service]:
    """Crea servicios aleatorios."""
    services = []
    used_names = set()
    for _ in range(qty):
        name = random_service_name()
        # Asegurar unicidad dentro del lote actual
        counter = 1
        base_name = name
        while name in used_names:
            name = f"{base_name} {counter}"
            counter += 1
        used_names.add(name)
        # También verificar contra BD (por si hay datos previos)
        while db.query(Service).filter(Service.name == name).first():
            name = f"{base_name} {counter}"
            counter += 1
            used_names.add(name)
        duration = random_duration()
        price = random_price()
        svc = Service(name=name, duration=duration, price=price)
        db.add(svc)
        services.append(svc)
    db.commit()
    for s in services:
        db.refresh(s)
    return services


def create_barbers(db: Session, qty: int = 3) -> list[User]:
    """Crea barbers (users con rol=BARBER)."""
    barbers = []
    for _ in range(qty):
        name = random_name()
        phone = random_phone()
        # Verificar que el teléfono no exista
        while db.query(User).filter(User.phone_number == phone).first():
            phone = "+52 " + "".join(random.choices(string.digits, k=10))
        user = User(
            name=name,
            phone_number=phone,
            rol=RolEnum.BARBER,
            password_hash=hash_password("barber123"),
        )
        db.add(user)
        barbers.append(user)
    db.commit()
    for b in barbers:
        db.refresh(b)
    return barbers


def create_clients(db: Session, qty: int = 10) -> list[Client]:
    """Crea clientes aleatorios."""
    clients = []
    used_names = set()
    for _ in range(qty):
        name = random_name()
        # Asegurar unicidad del nombre dentro del lote actual
        counter = 1
        base_name = name
        while name in used_names:
            name = f"{base_name} {counter}"
            counter += 1
        used_names.add(name)
        # También verificar contra BD (por si hay datos previos)
        while db.query(Client).filter(Client.name == name).first():
            name = f"{base_name} {counter}"
            counter += 1
            used_names.add(name)
        
        phone = random_phone()
        # Verificar que el teléfono no exista
        while db.query(Client).filter(Client.phone_number == phone).first():
            phone = "+52 " + "".join(random.choices(string.digits, k=10))
        
        notes = f"Cliente frecuente desde 2024"
        client = Client(name=name, phone_number=phone, notes=notes)
        db.add(client)
        clients.append(client)
    db.commit()
    for c in clients:
        db.refresh(c)
    return clients


def schedule_turns_for_barber(
    db: Session,
    barber: User,
    workday: Workday,
    services: list[Service],
    clients: list[Client],
    turns_per_barber: int = 3,
) -> int:
    """
    Programa turnos para un barbero en una jornada específica.
    
    Retorna la cantidad de turnos efectivamente plantados.
    """
    workday_begin = time_to_minutes(WORKDAY_START)   # 540 (9:00)
    workday_end = workday_begin + WORKDAY_DURATION    # 1020 (17:00)
    
    planted = 0
    
    for t_idx in range(turns_per_barber):
        # Calcular hora de inicio distribuida evenly en la jornada
        # Dejar 60 min de margen al inicio y 60 al final = 420 min utilizables
        usable_min = WORKDAY_DURATION - 120  # 420 min
        interval = usable_min // (turns_per_barber + 1)
        
        # Posición: (idx + 1) * interval desde el margen inicial
        start_min_from_begin = (t_idx + 1) * interval
        start_minutes = workday_begin + 60 + start_min_from_begin  # +60 de margen inicial
        
        # Ajuste máximo: no exceder workday_end - duracion minima - 30
        min_svc_dur = min(s.duration for s in services)
        max_start = workday_end - min_svc_dur - 30
        
        if start_minutes > max_start:
            start_minutes = max_start
        if start_minutes < workday_begin:
            start_minutes = workday_begin
        
        start_time_t = minutes_to_time(start_minutes)
        
        # Elegir servicio y cliente aleatorios
        svc = random.choice(services)
        client = random.choice(clients)
        
        # Calcular hora de fin
        turn_end_min = start_minutes + svc.duration
        
        # Validar que no exceda la jornada
        if turn_end_min > workday_end:
            # Mover inicio más atrás
            start_minutes = workday_end - svc.duration - 30
            if start_minutes < workday_begin:
                continue  # no caben, saltar este índice
            start_time_t = minutes_to_time(start_minutes)
            turn_end_min = start_minutes + svc.duration
        
        # Validar superposición con turnos ya programados para este barbero en esta workday
        existing_turns = db.query(Turn).filter(
            Turn.id_barber == barber.id,
            Turn.id_workday == workday.id
        ).all()
        
        conflict = False
        for et in existing_turns:
            et_begin = time_to_minutes(et.start_time)
            et_end = et_begin + et.service.duration
            new_begin = start_minutes
            new_end = turn_end_min
            
            # Superposición: los intervalos se intersectan
            # new_begin < et_end AND new_end > et_begin
            if new_begin < et_end and new_end > et_begin:
                conflict = True
                # Mover el turno después del turno existente
                start_minutes = et_end
                if start_minutes > workday_end - svc.duration - 30:
                    start_minutes = workday_end - svc.duration - 30
                if start_minutes < workday_begin:
                    conflict = False
                    break
                start_time_t = minutes_to_time(start_minutes)
                turn_end_min = start_minutes + svc.duration
                break
        
        if conflict:
            continue  # reubicar o saltar
        
        # Crear el turno
        turn = Turn(
            id_client=client.id,
            id_service=svc.id,
            id_workday=workday.id,
            id_barber=barber.id,
            start_time=start_time_t,
            state=random.choice([TurnStateEnum.PENDING, TurnStateEnum.PENDING]),
        )
        db.add(turn)
        planted += 1
    
    if planted > 0:
        db.commit()
    
    return planted


def create_workdays(
    db: Session,
    barbers: list[User],
    services: list[Service],
    clients: list[Client],
    start_date: date = date(2025, 1, 1),
    days: int = 5,
    turns_per_barber: int = 3,
) -> list[Workday]:
    """
    Crea jornadas (workdays) con turnos para cada barbero.
    
    Cada jornada tiene:
    - start_time: 9:00
    - duration: 480 minutos (8 horas, termina a 17:00)
    """
    created = []
    
    for i in range(days):
        datestamp = start_date + timedelta(days=i)
        
        # Verificar si ya existe una jornada para esta fecha
        existing = db.query(Workday).filter(
            Workday.datestamp == datestamp,
            Workday.start_time == WORKDAY_START
        ).first()
        
        if existing:
            jd = existing
            print(f"   Jornada {datestamp} ya existe, reutilizando...")
        else:
            # Crear la jornada
            jd = Workday(start_time=WORKDAY_START, duration=WORKDAY_DURATION, datestamp=datestamp)
            db.add(jd)
            db.commit()
            db.refresh(jd)
        
        created.append(jd)
        
        # Programar turnos para cada barbero en esta jornada
        for barber in barbers:
            schedule_turns_for_barber(db, barber, jd, services, clients, turns_per_barber)
    
    return created


# ---------- Función principal de siembra ----------

def run_seed(
    num_barbers: int = 3,
    num_clients: int = 10,
    num_services: int = 6,
    num_workdays: int = 5,
    turns_per_barber: int = 3,
) -> None:
    """Ejecuta el seed completo."""
    Base.metadata.create_all(bind=engine)  # Crear tablas si no existen
    
    db: Session = SessionLocal()
    
    try:
        print("--- Iniciando siembra de datos ---")
        
        # 1. Servicios
        services = create_services(db, num_services)
        print(f"   [OK] {len(services)} servicios creados")
        
        # 2. Barbers
        barbers = create_barbers(db, num_barbers)
        print(f"   [OK] {len(barbers)} barbers creados")
        
        # 3. Clientes
        clients = create_clients(db, num_clients)
        print(f"   [OK] {len(clients)} clientes creados")
        
        # 4. Jornadas con turnos
        print("   Creando jornadas y turnos...")
        workdays = create_workdays(db, barbers, services, clients, days=num_workdays, turns_per_barber=turns_per_barber)
        print(f"   [OK] {len(workdays)} jornadas creadas con turnos")
        
        # 5. Verificación de consistencia
        print("   Verificando consistencia...")
        total_turns = db.query(Turn).count()
        print(f"   [OK] Total de turnos en BD: {total_turns}")
        
        # Verificar que todos los turnos cumplan la restricción de jornada
        violations = 0
        for wd in workdays:
            wd_turns = db.query(Turn).filter(Turn.id_workday == wd.id).all()
            for t in wd_turns:
                begin = time_to_minutes(t.start_time)
                end = begin + t.service.duration
                wd_begin = time_to_minutes(wd.start_time)
                wd_end = wd_begin + WORKDAY_DURATION
                if begin < wd_begin or end > wd_end:
                    violations += 1
                    print(f"     ⚠ Turno {t.id}: start={t.start_time}, service.dur={t.service.duration}, fuera de jornada")
        
        if violations == 0:
            print("   [OK] Todos los turnos están dentro de los límites de la jornada")
        
        # Verificar sin solapamientos por barbero por jornada
        overlap_count = 0
        for wd in workdays:
            wd_turns = db.query(Turn).options(joinedload(Turn.service)).filter(Turn.id_workday == wd.id).all()
            for barber_id in set(t.id_barber for t in wd_turns):
                barber_turns = [t for t in wd_turns if t.id_barber == barber_id]
                if len(barber_turns) > 1:
                    # Ordenar por hora de inicio
                    barber_turns.sort(key=lambda t: time_to_minutes(t.start_time))
                    for j in range(len(barber_turns) - 1):
                        t1 = barber_turns[j]
                        t2 = barber_turns[j + 1]
                        t1_begin = time_to_minutes(t1.start_time)
                        t1_end = t1_begin + t1.service.duration
                        t2_begin = time_to_minutes(t2.start_time)
                        # Verificar solapamiento
                        if t1_end > t2_begin:
                            overlap_count += 1
                            print(f"     ⚠ SOLAPAMIENTO: Barber {barber_id}, Turno {t1.id} ({t1.start_time} - {t1_end}) vs Turno {t2.id} ({t2.start_time})")
        
        print("\n--- Siembra completada exitosamente! ---")
        print(f"   - {len(workdays)} jornadas creadas")
        print(f"   - {len(barbers)} barbers creados")
        print(f"   - {len(clients)} clients creados")
        print(f"   - {total_turns} turnos totales creados")
        
    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error durante la siembra: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()


# ---------- Punto de entrada ----------

if __name__ == "__main__":
    run_seed()