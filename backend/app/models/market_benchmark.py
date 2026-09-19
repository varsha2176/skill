from sqlalchemy import Column, Integer, String, Float
from app.core.database import Base


class MarketBenchmark(Base):
    __tablename__ = "market_benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    skill_name = Column(String(200), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=True)
    global_market_avg = Column(Float, nullable=True)
    us_market_avg = Column(Float, nullable=True)
    europe_market_avg = Column(Float, nullable=True)
    asia_market_avg = Column(Float, nullable=True)
    yoy_growth_rate = Column(Float, nullable=True)
    demand_score = Column(Float, nullable=True)
    salary_premium_percent = Column(Float, nullable=True)
    trend = Column(String(50), nullable=True)
    forecast_1yr_demand = Column(Float, nullable=True)
    forecast_3yr_demand = Column(Float, nullable=True)
