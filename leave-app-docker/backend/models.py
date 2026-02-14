from datetime import date
from sqlalchemy import Column, Integer, String, Date, Boolean, Numeric, Text
from database import BasePayroll, BaseAuth
from pydantic import BaseModel

# --- SQL SERVER MODELS (Binds to BasePayroll) ---

class LeaveApplication(BasePayroll):
    __tablename__ = "LeaveApplication" 

    __table_args__ = {"implicit_returning": False}

    LeaveApplicationId = Column(Integer, primary_key=True, index=True, autoincrement=True) 
    EmployeeId = Column(Integer, index=True)
    DateCreated = Column(Date, default=date.today)
    BeginDate = Column(Date)
    EndDate = Column(Date)
    HoursOff = Column(Integer)
    Description = Column(String) 
    ApprovalStatus = Column(String)
    TimeOffType = Column(String)
    UsedCredits = Column(Integer)
    CompanyId = Column(Integer)
    Approver = Column(Integer, nullable=True)
    Label = Column(Integer, nullable=True)
    Status = Column(Integer, nullable=True)

class vw_LeaveApplication(BasePayroll):
    __tablename__ = "vw_LeaveApplication"

    __table_args__ = {"implicit_returning": False}

    LeaveApplicationId = Column(Integer, primary_key=True, index=True) 
    EmployeeId = Column(Integer, primary_key=True, index=True)
    DateCreated = Column(Date)
    BeginDate = Column(Date)
    EndDate = Column(Date)
    HoursOff = Column(Integer)
    Description = Column(Text)
    ApprovalStatus = Column(Text)
    TimeOffType = Column(Text)
    UsedCredits = Column(Integer)
    CompanyId = Column(Integer)



class vw_TimeOffSummary(BasePayroll):
    #must match the column names in SQL Server
    __tablename__ = "vw_TimeOffSummary"
    EmployeeId = Column(Integer, primary_key=True, index=True)
    CompanyId = Column(Integer, primary_key=True, index=True)
    CompanyCode = Column(String)
    CompanyName = Column(String)
    EmployeeName = Column(String)
    Year = Column(Integer, primary_key=True, index=True)
    TimeOffType = Column(String)
    OpeningBalance = Column(Integer)
    Earned = Column(Integer)
    Consumed = Column(Integer)
    EndingBalance = Column(Integer)
    Available = Column(Integer)

# --- POSTGRESQL MODELS (Binds to BaseAuth) ---
class UserTable(BaseAuth):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    hashed_password = Column(String)
    disabled = Column(Boolean, default=False)

# --- PYDANTIC MODELS (Schemas) ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class User(BaseModel):
    id: int
    username: str
    email: str | None = None
    full_name: str | None = None
    disabled: bool | None = None

class UserInDB(User):
    hashed_password: str

class LeaveRequestCreate(BaseModel):
    TimeOffType: str
    BeginDate: date
    EndDate: date
    Description: str