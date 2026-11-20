from app.core.database import SessionLocal
from app.models import User, Service, Workday, Turn

db = SessionLocal()

# Check admin user
admin = db.query(User).filter(User.rol == "ADMIN").first()
print(f"Admin: {admin}")

# Check barbers
barbers = db.query(User).filter(User.rol == "BARBER").all()
print(f"Barbers ({len(barbers)}):")
for b in barbers:
    print(f"  - {b.name}: {b.phone_number}")

# Check services
services = db.query(Service).all()
print(f"Services ({len(services)}):")
for s in services:
    print(f"  - {s.name}: {s.duration}min, \${s.price}")

# Check workdays
workdays = db.query(Workday).all()
print(f"Workdays ({len(workdays)}):")
for wd in workdays:
    print(f"  - {wd.datestamp}: {wd.start_time} - duration={wd.duration}min")

# Check turns
turns = db.query(Turn).all()
print(f"Turns ({len(turns)}):")
for t in turns:
    print(f"  - Turn {t.id}: barber_id={t.id_barber}, client_id={t.id_client}, service_id={t.id_service}, start={t.start_time}, workday_id={t.id_workday}")

# Check for overlaps per barber per workday
print("\nChecking for overlaps per barber per workday...")
for wd in workdays:
    wd_turns = db.query(Turn).filter(Turn.id_workday == wd.id).all()
    for barber_id in set(t.id_barber for t in wd_turns):
        barber_turns = [t for t in wd_turns if t.id_barber == barber_id]
        if len(barber_turns) > 1:
            times = sorted([(t.start_time, t.id) for t in barber_turns])
            print(f"  Barber {barber_id}: {len(barber_turns)} turns at {times}")

db.close()