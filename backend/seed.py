# seed.py
# Datos iniciales del sistema. Es IDEMPOTENTE: se puede ejecutar las veces
# que haga falta sin duplicar ni romper nada.
#
#   venv/Scripts/python seed.py        (Windows)
#   venv/bin/python seed.py            (Linux/Mac)
#
# Crea/actualiza:
#   - Las 2 cuentas de acceso del sistema (NO hay registro público: estas
#     dos cuentas son las únicas puertas de entrada, contraseñas con bcrypt).
#   - Los 5 servicios de la oficina con prefijo, descripción y ventanilla.
#   - Desactiva los servicios de prueba antiguos ("Biblioteca", "Caja")
#     para que no aparezcan en la pantalla; no borra nada.

from dotenv import load_dotenv

load_dotenv()

import models
from database import SessionLocal, engine
from migraciones import asegurar_columnas
from models import Servicio, Usuario
from seguridad import ROL_ADMINISTRATIVO, ROL_ALUMNO, hashear_password

# (prefijo, nombre, descripción, ventanilla)
SERVICIOS_OFICIALES = [
    ("C", "Constancia de estudios",
     "Emisión de constancias de matrícula, egreso y quinto superior", "Ventanilla 1"),
    ("A", "Consulta académica",
     "Récord de notas, convalidaciones y rectificación de matrícula", "Ventanilla 2"),
    ("M", "Mesa de partes",
     "Recepción de solicitudes, expedientes y documentos en general", "Ventanilla 3"),
    ("P", "Pagos y aranceles",
     "Consulta de deudas, fraccionamiento y constancia de no adeudo", "Caja 1"),
    ("T", "Trámite de título",
     "Bachillerato, título profesional y duplicado de diploma", "Ventanilla 4"),
]

# (nombre, email, contraseña, rol) — anótalas y pruébalas ANTES de la demo.
CUENTAS = [
    ("Rosa Peña Aquije", "rpena@unica.edu.pe", "Ventanilla#2026", ROL_ADMINISTRATIVO),
    ("Luis Huamán Soto", "lhuaman@unica.edu.pe", "Alumno#2026", ROL_ALUMNO),
]

SERVICIOS_PRUEBA_A_OCULTAR = ("Biblioteca", "Caja")


def sembrar():
    # Asegura el esquema antes de tocar datos (por si aún no corrió la app).
    models.Base.metadata.create_all(bind=engine)
    asegurar_columnas()

    db = SessionLocal()
    try:
        for nombre, email, password, rol in CUENTAS:
            usuario = db.query(Usuario).filter(Usuario.email == email).first()
            if usuario is None:
                db.add(Usuario(
                    nombre=nombre, email=email,
                    password=hashear_password(password), rol=rol,
                ))
                print(f"[seed] cuenta creada: {email} ({rol})")
            else:
                # Deja la cuenta en un estado conocido para el día de la demo.
                usuario.nombre = nombre
                usuario.password = hashear_password(password)
                usuario.rol = rol
                print(f"[seed] cuenta actualizada: {email} ({rol})")

        for prefijo, nombre, descripcion, ventanilla in SERVICIOS_OFICIALES:
            servicio = db.query(Servicio).filter(Servicio.nombre == nombre).first()
            if servicio is None:
                db.add(Servicio(
                    nombre=nombre, prefijo=prefijo,
                    descripcion=descripcion, ventanilla=ventanilla, activo=True,
                ))
                print(f"[seed] servicio creado: {prefijo} · {nombre}")
            else:
                servicio.prefijo = prefijo
                servicio.descripcion = descripcion
                servicio.ventanilla = ventanilla
                servicio.activo = True
                print(f"[seed] servicio actualizado: {prefijo} · {nombre}")

        ocultados = (
            db.query(Servicio)
            .filter(Servicio.nombre.in_(SERVICIOS_PRUEBA_A_OCULTAR))
            .update({"activo": False})
        )
        if ocultados:
            print(f"[seed] {ocultados} servicio(s) de prueba desactivados (no borrados)")

        db.commit()
    finally:
        db.close()

    print()
    print("Credenciales para la demo (guárdalas):")
    for nombre, email, password, rol in CUENTAS:
        print(f"  {rol:<15} {email:<25} {password}")


if __name__ == "__main__":
    sembrar()
