import os
import csv
from typing import Optional

from sqlmodel import SQLModel, Session
from sqlalchemy import text

import models


DATA_DIR = os.path.dirname(__file__)
DRIVERS_CSV = os.path.join(DATA_DIR, "drivers_data.csv")
TEAMS_CSV = os.path.join(DATA_DIR, "teams_data.csv")
STANDINGS_CSV = os.path.join(DATA_DIR, "standings.csv")


def parse_int(val: Optional[str]) -> Optional[int]:
    if val is None or val == "":
        return None
    try:
        return int(float(val))
    except Exception:
        return None


def parse_float(val: Optional[str]) -> Optional[float]:
    if val is None or val == "":
        return None
    try:
        return float(val)
    except Exception:
        return None


def read_csv_rows(path: str):
    with open(path, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            yield {k.strip(): (v.strip() if v is not None else v) for k, v in row.items()}


def populate_teams(session: Session):
    count = 0
    for row in read_csv_rows(TEAMS_CSV):
        team = models.Teams(
            team_name=row.get('Name') or row.get('name'),
            driver1=row.get('Driver1'),
            driver2=row.get('Driver2'),
            grand_prixs=parse_int(row.get('Grand Prixs')),
            total_points=parse_float(row.get('Total Points')),
            highest_race_finish=row.get('Highest Race Finish'),
            podiums=parse_int(row.get('Podiums')),
            highest_grid_position=parse_int(row.get('Highest Grid Position')),
            pole_positions=parse_int(row.get('Pole Positions')),
            world_championships=parse_int(row.get('World Championships')),
        )
        session.add(team)
        count += 1
    print(f"populate_teams: added {count} rows")


def populate_drivers(session: Session):
    count = 0
    for row in read_csv_rows(DRIVERS_CSV):
        driver = models.Drivers(
            driver_name=row.get('Name') or row.get('name'),
            nationality=row.get('Nationality'),
            team_name=row.get('Team'),
            number=parse_int(row.get('Number')),
            grand_prixs=parse_int(row.get('Grand Prixs')),
            career_points=parse_float(row.get('Career Points')),
            highest_race_finish=row.get('Highest Race Finish'),
            podiums=parse_int(row.get('Podiums')),
            highest_grid_position=parse_int(row.get('Highest Grid Position')),
            pole_positions=parse_int(row.get('Pole Positions')),
            world_championships=parse_int(row.get('World Championships')),
        )
        session.add(driver)
        count += 1
    print(f"populate_drivers: added {count} rows")


def populate_standings(session: Session):
    count = 0
    for row in read_csv_rows(STANDINGS_CSV):
        standing = models.Standings(
            driver_name=row.get('Driver') or row.get('Driver') or row.get('Driver'),
            nationality=row.get('Nationality'),
            team_name=row.get('Team'),
            points=parse_int(row.get('Points')),
        )
        session.add(standing)
        count += 1
    print(f"populate_standings: added {count} rows")


def main():
    # Create tables
    SQLModel.metadata.create_all(models.engine)

    # Use Session bound to the engine so commits persist to the file
    with Session(models.engine) as session:
        # Temporarily disable foreign key enforcement to avoid circular FK issues
        session.execute(text("PRAGMA foreign_keys = OFF"))
        populate_teams(session)
        populate_drivers(session)
        populate_standings(session)
        # show counts before commit (via ORM flush)
        session.flush()
        print("flushed session")
        session.commit()
        print("committed session")
        session.execute(text("PRAGMA foreign_keys = ON"))


if __name__ == '__main__':
    main()
