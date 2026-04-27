from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from sqlmodel import SQLModel, create_engine, Field, Session
from models import Standings, Drivers, Teams, engine

app = FastAPI()

@app.get("/standings")
def get_standings():
    with Session(engine) as session:
        standings = session.query(Standings).order_by(Standings.points.desc()).all()
        return standings

@app.get("/drivers")
def get_drivers(name: str = None):
    with Session(engine) as session:
        query = session.query(Drivers)
        if name:
            query = query.filter(Drivers.driver_name == name)
        drivers = query.all()
        return drivers

@app.get("/teams")
def get_teams(name: str = None):
    with Session(engine) as session:
        query = session.query(Teams)
        if name:
            query = query.filter(Teams.team_name == name)
        teams = query.all()
        return teams

app.mount("/", StaticFiles(directory="static", html=True), name="static")