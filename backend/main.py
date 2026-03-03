from datetime import datetime, timedelta, timezone, date
from typing import Annotated
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text, desc

# Local imports
import jwt
from pwdlib import PasswordHash
import models
from database import get_auth_db, get_payroll_db, pg_engine, BaseAuth

# --- 0. AUTO-CREATE POSTGRES TABLE ---
BaseAuth.metadata.create_all(bind=pg_engine)

app = FastAPI(title="Leave Credit App")

# --- 1. MIDDLEWARE SETUP ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SECURITY CONFIG ---
SECRET_KEY = "f34fb792147d3f5b418cebec18fd2b192b961b2acae5cdb1136f9dc5acc7ae52"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- HELPERS ---
def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)

def get_password_hash(password):
    return password_hash.hash(password)

def get_user(db: Session, username: str):
    return db.query(models.UserTable).filter(models.UserTable.username == username).first()

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# --- DEPENDENCIES ---
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_auth_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None: raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
        
    user = get_user(db, username=username)
    if user is None: raise credentials_exception
    return user

# --- ROUTES ---

@app.get("/")
async def root():
    return {"message": "Leave Credit App API is running"}

# --- NEW: REGISTER USER ---
@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user_in: models.UserInDB, db: Session = Depends(get_auth_db)):
    db_user = get_user(db, username=user_in.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    new_user = models.UserTable(
        id = user_in.id,
        username=user_in.username,
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=get_password_hash(user_in.hashed_password),
        disabled=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully", "username": new_user.username}

@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_auth_db)
) -> models.Token:
    user = get_user(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})
    return models.Token(access_token=access_token, token_type="bearer")

@app.get("/LeaveHistory")
async def get_leave_history(
    current_user: Annotated[models.UserTable, Depends(get_current_user)],
    db: Session = Depends(get_payroll_db)
):
    # PALITAN: Mula vw_TimeOffSummary -> vw_LeaveApplication
    return db.query(models.vw_LeaveApplication).filter(
        models.vw_LeaveApplication.EmployeeId == current_user.id
    ).order_by(desc(models.vw_LeaveApplication.DateCreated)).all()

@app.post("/RequestLeave", status_code=status.HTTP_201_CREATED)
async def request_leave(
    leave_in: models.LeaveRequestCreate, 
    current_user: Annotated[models.UserTable, Depends(get_current_user)],
    db: Session = Depends(get_payroll_db)
):
    try:
        emp_query = text("SELECT HireDate FROM Employee WHERE EmployeeId = :id")
        emp_data = db.execute(emp_query, {"id": current_user.id}).mappings().first()

        last_record = db.query(models.vw_TimeOffSummary).filter(
            models.vw_TimeOffSummary.EmployeeId == current_user.id
        ).order_by(desc(models.vw_TimeOffSummary.Year)).first()

        earned_credits = 0.0
        current_pool = 0.0
        current_year = date.today().year

        if last_record:
            current_pool = float(last_record.Available or 0)
            earned_credits = float(last_record.Earned or 0)
        else:
            if emp_data and emp_data["HireDate"]:
                h_date = emp_data["HireDate"]
                if isinstance(h_date, str):
                    h_date = datetime.strptime(h_date[:10], "%Y-%m-%d").date()
                elif isinstance(h_date, datetime):
                    h_date = h_date.date()
                
                if current_year > h_date.year:
                    hire_month = h_date.month
                    earned_credits = 10.0 if hire_month <= 2 else float(12 - hire_month)
                    earned_credits = max(0.0, min(earned_credits, 10.0))
            current_pool = earned_credits

        days_requested = float((leave_in.EndDate - leave_in.BeginDate).days + 1)

        if days_requested > current_pool:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient balance. Available: {current_pool} credits."
            )

        new_leave = models.LeaveApplication(
            EmployeeId=current_user.id,
            CompanyId=last_record.CompanyId if last_record else 1,
            DateCreated=datetime.now(timezone.utc),
            BeginDate=leave_in.BeginDate,
            EndDate=leave_in.EndDate,
            TimeOffType=leave_in.TimeOffType,
            Description=leave_in.Description,
            UsedCredits=int(days_requested),
            ApprovalStatus="Pending",
            HoursOff=int(days_requested * 8)
        )

        db.add(new_leave)
        db.commit()
        return {"message": "Leave request submitted successfully."}

    except HTTPException as he:
        raise he
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/User/Me")
async def get_user_profile(
    current_user: Annotated[models.UserTable, Depends(get_current_user)],
    db_payroll: Session = Depends(get_payroll_db)
):
    last_record = db_payroll.query(models.vw_TimeOffSummary).filter(
        models.vw_TimeOffSummary.EmployeeId == current_user.id
    ).order_by(desc(models.vw_TimeOffSummary.Year)).first()

    if last_record:
        return {
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": last_record.EmployeeName or current_user.full_name,
            "company": last_record.CompanyName or "N/A",
            "company_code": last_record.CompanyCode or "N/A",
            "EmployeeId": last_record.EmployeeId or current_user.id,
            "credits": {
                "ending_balance": int(last_record.EndingBalance or 0),
                "earned": int(last_record.Earned or 0),
                "consumed": int(last_record.Consumed),
                "available": int(last_record.Available or 0),
            }
        }
    
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "company": "N/A",
        "company_code": "N/A",
        "EmployeeId": current_user.id,
        "credits": {
            "ending_balance": 0.0,
            "earned": 0.0,
            "consumed": 0.0,
            "available": 0.0,
        }
    }

# Ensure this is NOT indented inside another function
@app.post("/LeaveHistory/Cancel/{leave_id}")
async def cancel_leave_request(
    leave_id: int,
    current_user: Annotated[models.UserTable, Depends(get_current_user)],
    db: Session = Depends(get_payroll_db)
):
    leave_request = db.query(models.LeaveApplication).filter(
        models.LeaveApplication.LeaveApplicationId == leave_id,
        models.LeaveApplication.EmployeeId == current_user.id
    ).first()

    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Only allow cancellation if still pending
    if leave_request.ApprovalStatus != "Pending":
        raise HTTPException(status_code=400, detail="Only pending requests can be cancelled")

    leave_request.ApprovalStatus = "Cancelled"
    db.commit()
    return {"message": f"Leave request {leave_id} has been cancelled."}