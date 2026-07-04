import models
from database import engine
from fastapi import FastAPI

models.Base.metadata.create_all(bind=engine)

app = FastAPI()


@app.get("/")
def inicio():
    return {"mensaje": "El backend del sistema de turnos está funcionando"}
