import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- 1. POSTGRESQL CONFIGURATION ---
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASS = urllib.parse.quote_plus(os.getenv("PG_PASS", "dC_it@gn25?"))
PG_HOST = os.getenv("PG_HOST", "auth-db") 
PG_PORT = os.getenv("PG_PORT", "5432")
PG_DB   = os.getenv("PG_DB", "auth_db")

PG_DATABASE_URL = f"postgresql://{PG_USER}:{PG_PASS}@{PG_HOST}:{PG_PORT}/{PG_DB}"

pg_engine = create_engine(PG_DATABASE_URL)
SessionAuth = sessionmaker(autocommit=False, autoflush=False, bind=pg_engine)
BaseAuth = declarative_base() 


# --- 2. SQL SERVER CONFIGURATION (Remote Server Fix) ---
SQL_USER = os.getenv("SQL_USER", "sa")
SQL_PASS = urllib.parse.quote_plus(os.getenv("SQL_PASS", "Ftp@2024?"))
SQL_HOST = os.getenv("SQL_HOST", "172.96.10.78")
SQL_PORT = os.getenv("SQL_PORT", "1433")
SQL_DB   = os.getenv("SQL_DB", "PayrollDB")

MSSQL_DATABASE_URL = (
    f"mssql+pyodbc://{SQL_USER}:{SQL_PASS}@{SQL_HOST}:{SQL_PORT}/{SQL_DB}"
    "?driver=ODBC+Driver+18+for+SQL+Server"
    "&TrustServerCertificate=yes"
    "&Encrypt=no"
    "&Connection+Timeout=30"
)


ms_engine = create_engine(
    MSSQL_DATABASE_URL, 
    fast_executemany=True,
    pool_pre_ping=True,
    pool_recycle=3600
)
SessionPayroll = sessionmaker(autocommit=False, autoflush=False, bind=ms_engine)
BasePayroll = declarative_base() 


# --- 3. DEPENDENCIES ---
def get_auth_db():
    db = SessionAuth()
    try:
        yield db
    finally:
        db.close()

def get_payroll_db():
    db = SessionPayroll()
    try:
        yield db
    finally:
        db.close()