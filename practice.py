from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, HTTPException
from typing import List
from pydantic import BaseModel
from sqlmodel import SQLModel, create_engine, Field, Session
from models import Standings, Drivers, Teams, engine


with Session(engine) as session:
    driver_list = []
    drivers = session.query(Drivers.driver_name).all()
    for driver in drivers:
        driver_list.append(driver[0])
    print(driver_list)

    for driver in driver_list:
        print(driver)
        driverTeam = session.query(Drivers.team_name).filter(Drivers.driver_name == driver).one()[0]
        driverGrid = session.query(Drivers.highest_grid_position).filter(Drivers.driver_name == driver).one()[0]
        print(driverGrid)


