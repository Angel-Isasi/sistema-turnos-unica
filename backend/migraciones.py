# migraciones.py
# Migraciones mínimas y aditivas sobre la base de datos ya existente.
#
# create_all() solo crea tablas que faltan: si la tabla ya existe en MySQL
# NO le agrega columnas nuevas. Como la base en Railway ya estaba creada,
# aquí revisamos qué columnas faltan y las agregamos con ALTER TABLE.
# Es idempotente: se puede ejecutar mil veces sin romper nada.

from sqlalchemy import inspect, text

from database import engine

# (tabla, columna, definición SQL de la columna)
COLUMNAS_REQUERIDAS = [
    ("servicios", "prefijo", "VARCHAR(5) NULL"),
    ("servicios", "descripcion", "VARCHAR(255) NULL"),
    ("servicios", "ventanilla", "VARCHAR(50) NULL"),
    ("auditoria", "turno_numero", "VARCHAR(20) NULL"),
    ("auditoria", "detalle", "VARCHAR(255) NULL"),
]


def asegurar_columnas():
    inspector = inspect(engine)
    tablas = set(inspector.get_table_names())

    with engine.begin() as conexion:
        for tabla, columna, definicion in COLUMNAS_REQUERIDAS:
            if tabla not in tablas:
                continue  # la tabla nueva la crea create_all con todo incluido
            existentes = {c["name"] for c in inspector.get_columns(tabla)}
            if columna not in existentes:
                conexion.execute(
                    text(f"ALTER TABLE {tabla} ADD COLUMN {columna} {definicion}")
                )
                print(f"[migraciones] {tabla}.{columna} agregada")
