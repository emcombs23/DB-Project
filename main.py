from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, HTTPException
from typing import List
from pydantic import BaseModel
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

@app.post("/new_race")
def update_standings(quali_results: dict, race_results: dict):
    # Points mapping for positions 1..10 (standard F1)
    position_points = {1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1}
    driver_list = []
    
    with Session(engine) as session:
        drivers = session.query(Drivers.driver_name).all()
        for driver in drivers:
            driver_list.append(driver[0])

        for driver in driver_list:
            driverTeam = session.query(Drivers.team_name).filter(Drivers.driver_name == driver).one()[0]
            driver_position = race_results[driver]
            driver_quali = quali_results[driver]
            if driver_position == "DNF":
                driver_position = 23
            #Points
            if driver_position <=10:
                #Standings
                points = position_points[driver_position]
                statement = select(Standings).where(Standings.driver_name == driver)
                record = session.exec(statement).one()
                record.points += points
                session.add(record)
                session.commit()
                session.refresh(record)
                #Driver
                statement = select(Drivers).where(Drivers.driver_name == driver)
                record = session.exec(statement).one()
                record.career_points += points
                session.add(record)
                session.commit()
                session.refresh(record)
                #Teams
                statement = select(Teams).where(Teams.team_name == driverTeam)
                record = session.exec(statement).one()
                record.total_points += points
                session.add(record)
                session.commit()
                session.refresh(record)

            #Podiums
            if driver_position <= 3:
                #Driver
                statement = select(Drivers).where(Drivers.driver_name == driver)
                record = session.exec(statement).one()
                record.podiums += 1
                session.add(record)
                session.commit()
                session.refresh(record)
                #Teams
                statement = select(Teams).where(Teams.team_name == driverTeam)
                record = session.exec(statement).one()
                record.podiums += 1
                session.add(record)
                session.commit()
                session.refresh(record)
            
            #Driver Grand Prixs
            statement = select(Drivers).where(Drivers.driver_name == driver)
            record = session.exec(statement).one()
            record.grand_prixs += 1
            session.add(record)
            session.commit()
            session.refresh(record)

            #Pole
            if driver_quali == 1:
                #Driver
                statement = select(Drivers).where(Drivers.driver_name == driver)
                record = session.exec(statement).one()
                record.pole_positions += 1
                session.add(record)
                session.commit()
                session.refresh(record)
                #Teams
                statement = select(Teams).where(Teams.team_name == driverTeam)
                record = session.exec(statement).one()
                record.pole_positions += 1
                session.add(record)
                session.commit()
                session.refresh(record)


            #Highest Quali
            driverHighestQuali = session.query(Drivers.highest_grid_position).filter(Drivers.driver_name == driver).one()[0]
            teamHighestQuali = session.query(Teams.highest_grid_position).filter(Teams.team_name == driverTeam).one()[0]
            #Driver
            if driver_quali < driverHighestQuali:
                statement = select(Drivers).where(Drivers.driver_name == driver)
                record = session.exec(statement).one()
                record.highest_grid_position = driver_quali
                session.add(record)
                session.commit()
                session.refresh(record)
            #Team
            if driver_quali < teamHighestQuali:
                statement = select(Teams).where(Teams.team_name == driverTeam)
                record = session.exec(statement).one()
                record.highest_grid_position = driver_quali
                session.add(record)
                session.commit()
                session.refresh(record)

            #Highest Finish
            driverHighestQuali = session.query(Drivers.highest_race_finish).filter(Drivers.driver_name == driver).one()[0]
            teamHighestQuali = session.query(Teams.highest_race_finish).filter(Teams.team_name == driverTeam).one()[0]
            #Driver
            if driver_quali < driverHighestQuali:
                statement = select(Drivers).where(Drivers.driver_name == driver)
                record = session.exec(statement).one()
                record.highest_race_finish = driver_position
                session.add(record)
                session.commit()
                session.refresh(record)
            #Team
            if driver_quali < teamHighestQuali:
                statement = select(Teams).where(Teams.team_name == driverTeam)
                record = session.exec(statement).one()
                record.highest_race_finish = driver_position
                session.add(record)
                session.commit()
                session.refresh(record)


            #DNFs
            if driver_position == 23:
                #Driver
                statement = select(Drivers).where(Drivers.driver_name == driver)
                record = session.exec(statement).one()
                record.dnfs += 1
                session.add(record)
                session.commit()
                session.refresh(record)
        #Teams Grand Prixs
        teams_list = []
        teams= session.query(Teams.team_name).all()
        for team in teams:
            teams_list.append(team[0])
        for team in teams_list:
            statement = select(Teams).where(Teams.team_name == team)
            record = session.exec(statement).one()
            record.grand_prixs += 1
            session.add(record)
            session.commit()
            session.refresh(record)


app.mount("/", StaticFiles(directory="static", html=True), name="static")