"""FastAPI application entrypoint for SIH 2026 Agricultural Marketplace.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.router import router as auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically generate tables in development/local environments
    try:
        Base.metadata.create_all(bind=engine)
        
        # Seed demonstration accounts including Admin for instant evaluation
        from app.database import SessionLocal
        from app.models import (
            User,
            UserRole,
            AdminProfile,
            FarmerProfile,
            TransporterProfile,
            CollectionCenterProfile,
            ConsumerProfile,
        )
        from app.auth import get_password_hash

        db = SessionLocal()
        try:
            # 1. Admin Persona
            admin_user = db.query(User).filter(User.phone_number == "+919999999999").first()
            if not admin_user:
                admin_user = User(
                    phone_number="+919999999999",
                    hashed_password=get_password_hash("AdminPass123!"),
                    full_name="Kiran Pokuri (Administrator)",
                    role=UserRole.ADMIN,
                    is_active=True,
                )
                db.add(admin_user)
                db.flush()
                db.add(AdminProfile(
                    user_id=admin_user.id,
                    department="Platform Architecture & Operations",
                    access_level="SUPERADMIN",
                ))

            # 2. Farmer Persona
            farmer_user = db.query(User).filter(User.phone_number == "+919876543210").first()
            if not farmer_user:
                farmer_user = User(
                    phone_number="+919876543210",
                    hashed_password=get_password_hash("FarmerPass123!"),
                    full_name="Ramesh Patel",
                    role=UserRole.FARMER,
                    is_active=True,
                )
                db.add(farmer_user)
                db.flush()
                db.add(FarmerProfile(
                    user_id=farmer_user.id,
                    address="Survey No 42, Guntur Rural, Andhra Pradesh",
                    latitude=16.3067,
                    longitude=80.4365,
                    photo_url="https://images.unsplash.com/photo-1595273670150-bd0c3c392e46?w=400",
                    is_kyc_verified=False,
                ))

            # 3. Transporter Persona
            transporter_user = db.query(User).filter(User.phone_number == "+919876543211").first()
            if not transporter_user:
                transporter_user = User(
                    phone_number="+919876543211",
                    hashed_password=get_password_hash("TransportPass123!"),
                    full_name="Suresh Logistics",
                    role=UserRole.TRANSPORTER,
                    is_active=True,
                )
                db.add(transporter_user)
                db.flush()
                db.add(TransporterProfile(
                    user_id=transporter_user.id,
                    vehicle_number="AP 07 TJ 8888",
                    max_payload_kg=7500.0,
                    is_available=True,
                ))

            # 4. Collection Center Persona
            cc_user = db.query(User).filter(User.phone_number == "+919876543212").first()
            if not cc_user:
                cc_user = User(
                    phone_number="+919876543212",
                    hashed_password=get_password_hash("StoragePass123!"),
                    full_name="Kisan Agri Hub",
                    role=UserRole.COLLECTION_CENTER,
                    is_active=True,
                )
                db.add(cc_user)
                db.flush()
                db.add(CollectionCenterProfile(
                    user_id=cc_user.id,
                    center_name="Godavari Central Cold Storage",
                    address="NH-16, Rajahmundry, Andhra Pradesh",
                    latitude=17.0005,
                    longitude=81.8040,
                    storage_capacity_kg=25000.0,
                ))

            # 5. Consumer Persona
            consumer_user = db.query(User).filter(User.phone_number == "+919876543213").first()
            if not consumer_user:
                consumer_user = User(
                    phone_number="+919876543213",
                    hashed_password=get_password_hash("ConsumerPass123!"),
                    full_name="Ananya Sharma",
                    role=UserRole.CONSUMER,
                    is_active=True,
                )
                db.add(consumer_user)
                db.flush()
                db.add(ConsumerProfile(
                    user_id=consumer_user.id,
                    delivery_address="Flat 402, Green Acres, Hyderabad",
                    latitude=17.3850,
                    longitude=78.4867,
                ))

            db.commit()
        except Exception as seed_err:
            db.rollback()
        finally:
            db.close()
    except Exception:
        pass
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade API for Agricultural Marketplace featuring RBAC & 1-to-1 extension profiles.",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Authentication & RBAC router
app.include_router(auth_router)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
