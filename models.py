from typing import Optional, List
from sqlalchemy import ForeignKeyConstraint
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session

DATABASE_URL = "sqlite:///formula1.db"
engine = create_engine(DATABASE_URL)


class Standings(SQLModel, table=True):
    __tablename__ = "standings"

    driver_name: str = Field(primary_key=True, foreign_key="drivers.driver_name")
    nationality: Optional[str] = None
    team_name: str = Field(foreign_key="teams.team_name")
    points: Optional[int] = None



class Drivers(SQLModel, table=True):
    __tablename__ = "drivers"
    driver_name: str = Field(primary_key=True, foreign_key="standings.driver_name")
    nationality: Optional[str] = None
    team_name: str = Field(foreign_key="teams.team_name")
    number: Optional[int] = None
    grand_prixs: Optional[int] = None
    career_points: Optional[float] = None
    highest_race_finish: Optional[str] = None
    podiums: Optional[int] = None
    highest_grid_position: Optional[int] = None
    pole_positions: Optional[int] = None
    world_championships: Optional[int] = None
    dnfs: Optional[int] = None


class Teams(SQLModel, table=True):
    __tablename__ = "teams"
    team_name: str = Field(primary_key=True, foreign_key="standings.team_name")
    driver1: Optional[str] = None
    driver2: Optional[str] = None
    grand_prixs: Optional[int] = None
    total_points: Optional[float] = None
    highest_race_finish: Optional[str] = None
    podiums: Optional[int] = None
    highest_grid_position: Optional[int] = None
    pole_positions: Optional[int] = None
    world_championships: Optional[int] = None
