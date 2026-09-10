"""Automated test suite verifying the production-grade FastAPI authentication
and Role-Based Access Control (RBAC) implementation.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models import (
    CollectionCenterProfile,
    ConsumerProfile,
    FarmerProfile,
    TransporterProfile,
    User,
    UserRole,
)
from main import app as fastapi_app
from passlib.context import CryptContext
import app.auth

# Optimize bcrypt rounds for instant unit test execution
app.auth.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__default_rounds=4)

# Create in-memory SQLite database for isolated, fast testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

from sqlalchemy import event


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables for each test and teardown afterwards."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    fastapi_app.dependency_overrides[get_db] = override_get_db
    with TestClient(fastapi_app) as test_client:
        yield test_client
    fastapi_app.dependency_overrides.clear()


# ==============================================================================
# 1. Multi-Role Registration Tests
# ==============================================================================

def test_register_farmer_success(client):
    payload = {
        "phone_number": "+919876543210",
        "password": "FarmerPassword123!",
        "full_name": "Ramesh Patel",
        "role": "FARMER",
        "farmer_profile": {
            "address": "Survey No 42, Guntur Rural, Andhra Pradesh",
            "latitude": 16.3067,
            "longitude": 80.4365,
            "photo_url": "https://storage.agrimarket.in/profiles/ramesh.jpg",
            "is_kyc_verified": True,
        },
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["phone_number"] == "+919876543210"
    assert data["role"] == "FARMER"
    assert data["is_active"] is True
    assert data["profile"] is not None
    assert data["profile"]["address"] == "Survey No 42, Guntur Rural, Andhra Pradesh"
    assert data["profile"]["is_kyc_verified"] is True


def test_register_transporter_success(client):
    payload = {
        "phone_number": "+919876543211",
        "password": "TransportPass123!",
        "full_name": "Suresh Logistics",
        "role": "TRANSPORTER",
        "transporter_profile": {
            "vehicle_number": "AP 07 TJ 9999",
            "max_payload_kg": 5000.0,
            "is_available": True,
        },
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "TRANSPORTER"
    assert data["profile"]["vehicle_number"] == "AP 07 TJ 9999"
    assert data["profile"]["max_payload_kg"] == 5000.0


def test_register_collection_center_success(client):
    payload = {
        "phone_number": "+919876543212",
        "password": "StoragePass123!",
        "full_name": "Kisan Agri Hub",
        "role": "COLLECTION_CENTER",
        "collection_center_profile": {
            "center_name": "Godavari Central Cold Storage",
            "address": "NH-16, Rajahmundry, Andhra Pradesh",
            "latitude": 17.0005,
            "longitude": 81.8040,
            "storage_capacity_kg": 25000.0,
        },
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "COLLECTION_CENTER"
    assert data["profile"]["center_name"] == "Godavari Central Cold Storage"


def test_register_consumer_success(client):
    payload = {
        "phone_number": "+919876543213",
        "password": "ConsumerPass123!",
        "full_name": "Ananya Sharma",
        "role": "CONSUMER",
        "consumer_profile": {
            "delivery_address": "Flat 402, Green Acres, Hyderabad",
            "latitude": 17.3850,
            "longitude": 78.4867,
        },
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["role"] == "CONSUMER"
    assert data["profile"]["delivery_address"] == "Flat 402, Green Acres, Hyderabad"


def test_register_duplicate_phone_conflict(client):
    payload = {
        "phone_number": "+919876543210",
        "password": "Password123!",
        "full_name": "First User",
        "role": "FARMER",
        "farmer_profile": {
            "address": "Village 1",
        },
    }
    # First registration should succeed
    res1 = client.post("/auth/register", json=payload)
    assert res1.status_code == 201

    # Second registration with same phone number should return 409 Conflict
    res2 = client.post("/auth/register", json=payload)
    assert res2.status_code == 409
    assert "already registered" in res2.json()["detail"]


def test_register_missing_profile_validation_error(client):
    # Registering as FARMER but omitting farmer_profile
    payload = {
        "phone_number": "+919876543299",
        "password": "Password123!",
        "full_name": "Incomplete User",
        "role": "FARMER",
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


# ==============================================================================
# 2. Login Flow Tests (OAuth2 & JSON)
# ==============================================================================

def test_login_oauth2_password_flow(client):
    # Register user
    reg_payload = {
        "phone_number": "+919111122222",
        "password": "SecurePassword123",
        "full_name": "Test Farmer",
        "role": "FARMER",
        "farmer_profile": {
            "address": "Village Road",
        },
    }
    client.post("/auth/register", json=reg_payload)

    # Login using OAuth2 form data (username=phone_number)
    login_data = {
        "username": "+919111122222",
        "password": "SecurePassword123",
    }
    response = client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    token_body = response.json()
    assert "access_token" in token_body
    assert token_body["token_type"] == "bearer"
    assert token_body["role"] == "FARMER"


def test_login_invalid_password(client):
    reg_payload = {
        "phone_number": "+919333344444",
        "password": "CorrectPassword",
        "full_name": "Test User",
        "role": "CONSUMER",
        "consumer_profile": {
            "delivery_address": "City Center",
        },
    }
    client.post("/auth/register", json=reg_payload)

    # Attempt login with incorrect password
    response = client.post(
        "/auth/login",
        data={"username": "+919333344444", "password": "WrongPassword"},
    )
    assert response.status_code == 401
    assert response.headers.get("WWW-Authenticate") == "Bearer"


# ==============================================================================
# 3. Protected /auth/me Tests
# ==============================================================================

def test_get_me_authenticated(client):
    # Register and login
    reg_payload = {
        "phone_number": "+919555566666",
        "password": "SecretPassword123",
        "full_name": "Fleet Commander",
        "role": "TRANSPORTER",
        "transporter_profile": {
            "vehicle_number": "KA 01 AB 1234",
            "max_payload_kg": 3500.0,
            "is_available": True,
        },
    }
    client.post("/auth/register", json=reg_payload)

    login_res = client.post(
        "/auth/login",
        data={"username": "+919555566666", "password": "SecretPassword123"},
    )
    token = login_res.json()["access_token"]

    # Call /auth/me with Bearer token
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/auth/me", headers=headers)
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["full_name"] == "Fleet Commander"
    assert me_data["role"] == "TRANSPORTER"
    assert me_data["profile"]["vehicle_number"] == "KA 01 AB 1234"


def test_get_me_unauthorized_without_token(client):
    response = client.get("/auth/me")
    assert response.status_code == 401


# ==============================================================================
# 4. Role-Based Access Control (RBAC) Enforcement Tests
# ==============================================================================

def test_rbac_authorized_access(client):
    # Register Farmer
    reg_payload = {
        "phone_number": "+919777788888",
        "password": "FarmerPassword123",
        "full_name": "Kisan Babu",
        "role": "FARMER",
        "farmer_profile": {
            "address": "Krishna District",
            "is_kyc_verified": True,
        },
    }
    client.post("/auth/register", json=reg_payload)

    login_res = client.post(
        "/auth/login",
        data={"username": "+919777788888", "password": "FarmerPassword123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Access Farmer-only dashboard -> should succeed (200)
    res = client.get("/auth/farmer/dashboard", headers=headers)
    assert res.status_code == 200
    assert "Welcome Farmer" in res.json()["message"]


def test_rbac_forbidden_wrong_role(client):
    # Register Consumer
    reg_payload = {
        "phone_number": "+919999900000",
        "password": "ConsumerPassword123",
        "full_name": "Retail Buyer",
        "role": "CONSUMER",
        "consumer_profile": {
            "delivery_address": "City Mall",
        },
    }
    client.post("/auth/register", json=reg_payload)

    login_res = client.post(
        "/auth/login",
        data={"username": "+919999900000", "password": "ConsumerPassword123"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Consumer attempts to access Farmer dashboard -> should be blocked with 403 Forbidden
    res = client.get("/auth/farmer/dashboard", headers=headers)
    assert res.status_code == 403
    assert "Access forbidden" in res.json()["detail"]


def test_rbac_multi_role_endpoint(client):
    # Register Transporter
    client.post(
        "/auth/register",
        json={
            "phone_number": "+919444455555",
            "password": "Password123",
            "full_name": "Logistics Pro",
            "role": "TRANSPORTER",
            "transporter_profile": {
                "vehicle_number": "TS 09 AB 5678",
                "max_payload_kg": 8000.0,
            },
        },
    )
    login_res = client.post(
        "/auth/login",
        data={"username": "+919444455555", "password": "Password123"},
    )
    transporter_token = login_res.json()["access_token"]

    # Transporter accessing /auth/logistics/overview -> 200 OK
    res = client.get(
        "/auth/logistics/overview",
        headers={"Authorization": f"Bearer {transporter_token}"},
    )
    assert res.status_code == 200


# ==============================================================================
# 5. Cascading Deletion Test
# ==============================================================================

def test_user_profile_cascade_delete(db_session):
    from app.auth import get_password_hash

    # Create User with FarmerProfile
    user = User(
        phone_number="+919222233333",
        hashed_password=get_password_hash("testpass"),
        full_name="Cascade Test User",
        role=UserRole.FARMER,
        is_active=True,
    )
    db_session.add(user)
    db_session.flush()

    farmer_profile = FarmerProfile(
        user_id=user.id,
        address="Test Farm Cascade",
    )
    db_session.add(farmer_profile)
    db_session.commit()

    user_id = user.id
    profile_id = farmer_profile.id

    # Verify both exist
    assert db_session.query(User).filter(User.id == user_id).first() is not None
    assert db_session.query(FarmerProfile).filter(FarmerProfile.id == profile_id).first() is not None

    # Delete User
    db_session.delete(user)
    db_session.commit()

    # Verify that profile was cascaded and deleted automatically
    assert db_session.query(User).filter(User.id == user_id).first() is None
    assert db_session.query(FarmerProfile).filter(FarmerProfile.id == profile_id).first() is None
