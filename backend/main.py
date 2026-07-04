from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def inicio():
    return {"mensaje": "El backend del sistema de turnos está funcionando"}
