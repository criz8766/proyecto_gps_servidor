import psycopg2
import os
from sqlalchemy import create_engine

SQLALCHEMY_DATABASE_URL = (
    f"postgresql://{os.getenv('POSTGRES_USER', 'admin')}:"
    f"{os.getenv('POSTGRES_PASSWORD', 'admin')}@"
    f"{os.getenv('POSTGRES_HOST', 'postgres')}/"
    f"{os.getenv('POSTGRES_DB', 'farmacia')}"
)
engine = create_engine(SQLALCHEMY_DATABASE_URL)

def get_connection():
    return psycopg2.connect(
        host=os.getenv("POSTGRES_HOST", "postgres"),
        database=os.getenv("POSTGRES_DB", "farmacia"),
        user=os.getenv("POSTGRES_USER", "admin"),
        password=os.getenv("POSTGRES_PASSWORD", "admin")
    )

