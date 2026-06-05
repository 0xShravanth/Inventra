from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text

from app.database import Base, engine
import app.models  # noqa: F401
from app.routers.customers import router as customers_router
from app.routers.orders import router as orders_router, dashboard_router
from app.routers.products import router as products_router

app = FastAPI(
    title="Inventory & Order Management API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(products_router)
app.include_router(customers_router)
app.include_router(orders_router)
app.include_router(dashboard_router)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    # UUID default relies on pgcrypto.gen_random_uuid()
    try:
        with engine.begin() as conn:
            conn.execute(text('CREATE EXTENSION IF NOT EXISTS "pgcrypto"'))
    except Exception:
        # Neon may restrict extension creation; tables can still be created.
        # If UUID inserts fail, enable pgcrypto in Neon manually.
        pass


@app.get("/")
def read_root():
    return {
        "message": "Inventory & Order Management API",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}

