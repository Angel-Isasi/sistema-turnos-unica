from datetime import datetime

from database import Base
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    rol = Column(String(20), nullable=False)
    creado_en = Column(DateTime, default=datetime.utcnow)


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    activo = Column(Boolean, default=True)


class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    numero = Column(String(20), nullable=False)
    estado = Column(String(20), default="creado")
    prioridad = Column(String(20), default="normal")
    creado_en = Column(DateTime, default=datetime.utcnow)

    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False)


class Atencion(Base):
    __tablename__ = "atenciones"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"), nullable=False)
    operador_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)
    inicio = Column(DateTime, default=datetime.utcnow)
    fin = Column(DateTime, nullable=True)
    observacion = Column(String(255), nullable=True)


class Auditoria(Base):
    __tablename__ = "auditoria"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    accion = Column(String(50), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_host = Column(String(100), nullable=True)
    resultado = Column(String(10), nullable=False)
