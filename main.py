from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, HTTPException
from typing import List
from pydantic import BaseModel
from sqlmodel import SQLModel, create_engine, Field, Session
from models import Standings, Drivers, Teams, engine

app = FastAPI()


class NewRace(BaseModel):
    p1: str
    p2: str
    p3: str
    p4: str
    p5: str
    p6: str
    p7: str
    p8: str
    p9: str
    p10: str
    dnfs: List[str] = []

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

@app.post("/new_race")
def update_standings(race: NewRace):
    # Points mapping for positions 1..10 (standard F1)
    points_map = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}

    positions = [
        race.p1,
        race.p2,
        race.p3,
        race.p4,
        race.p5,
        race.p6,
        race.p7,
        race.p8,
        race.p9,
        race.p10,
    ]

    # Validate uniqueness among finishers
    if len(set(positions)) != len(positions):
        raise HTTPException(status_code=400, detail="Finishing driver names must be unique")

    # Validate DNF list doesn't overlap with finishers
    overlap = set(positions) & set(race.dnfs)
    if overlap:
        raise HTTPException(status_code=400, detail=f"Drivers cannot both finish and DNF: {', '.join(overlap)}")

    with Session(engine) as session:
        # Helper to get driver record
        def get_driver(name: str) -> Drivers:
            d = session.query(Drivers).filter(Drivers.driver_name == name).first()
            if not d:
                raise HTTPException(status_code=404, detail=f"Driver not found: {name}")
            return d

        # Process finishers
        for idx, name in enumerate(positions, start=1):
            driver = get_driver(name)
            pts = points_map.get(idx, 0)

            # Update Drivers stats
            driver.grand_prixs = (driver.grand_prixs or 0) + 1
            driver.career_points = (driver.career_points or 0) + pts
            # highest_race_finish: store as numeric string or keep existing if better
            try:
                current_best = int(driver.highest_race_finish) if driver.highest_race_finish is not None else None
            except Exception:
                current_best = None
            if current_best is None or idx < current_best:
                driver.highest_race_finish = str(idx)
            # Podiums for top 3
            if idx <= 3:
                driver.podiums = (driver.podiums or 0) + 1

            session.add(driver)

            # Update Teams stats
            if driver.team_name:
                team = session.query(Teams).filter(Teams.team_name == driver.team_name).first()
                if team:
                    team.grand_prixs = (team.grand_prixs or 0) + 1
                    team.total_points = (team.total_points or 0) + pts
                    # team highest finish
                    try:
                        team_best = int(team.highest_race_finish) if team.highest_race_finish is not None else None
                    except Exception:
                        team_best = None
                    if team_best is None or idx < team_best:
                        team.highest_race_finish = str(idx)
                    if idx <= 3:
                        team.podiums = (team.podiums or 0) + 1
                    session.add(team)

            # Update Standings
            standing = session.query(Standings).filter(Standings.driver_name == name).first()
            if standing:
                standing.points = (standing.points or 0) + pts
                session.add(standing)
            else:
                # create new standings row if missing
                new_stand = Standings(
                    driver_name=name,
                    nationality=driver.nationality,
                    team_name=driver.team_name or "",
                    points=pts,
                )
                session.add(new_stand)

        # Process DNFs: increment grand_prixs for DNFs, but no points
        for name in race.dnfs or []:
            driver = get_driver(name)
            driver.grand_prixs = (driver.grand_prixs or 0) + 1
            session.add(driver)
            if driver.team_name:
                team = session.query(Teams).filter(Teams.team_name == driver.team_name).first()
                if team:
                    team.grand_prixs = (team.grand_prixs or 0) + 1
                    session.add(team)

        session.commit()

    return {"status": "ok"}

app.mount("/", StaticFiles(directory="static", html=True), name="static")