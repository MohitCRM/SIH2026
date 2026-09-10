"""Live demonstration script executing real HTTP requests against the running FastAPI server.
"""

import json
import httpx

BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def main():
    client = httpx.Client(base_url=BASE_URL)

    # 1. Health Check
    print_section("1. HEALTH CHECK: GET /health")
    res = client.get("/health")
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))

    # 2. Register a Farmer
    print_section("2. REGISTER FARMER: POST /auth/register")
    farmer_payload = {
        "phone_number": "+919876543210",
        "password": "FarmerSecurePass123!",
        "full_name": "Ramesh Patel",
        "role": "FARMER",
        "farmer_profile": {
            "address": "Survey No 42, Guntur Rural, Andhra Pradesh",
            "latitude": 16.3067,
            "longitude": 80.4365,
            "photo_url": "https://storage.agri.in/farmers/ramesh.jpg",
            "is_kyc_verified": True
        }
    }
    res = client.post("/auth/register", json=farmer_payload)
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))

    # 3. Register a Transporter
    print_section("3. REGISTER TRANSPORTER: POST /auth/register")
    transporter_payload = {
        "phone_number": "+919876543211",
        "password": "TransportSecurePass123!",
        "full_name": "Suresh Logistics Express",
        "role": "TRANSPORTER",
        "transporter_profile": {
            "vehicle_number": "AP 07 TJ 8888",
            "max_payload_kg": 7500.0,
            "is_available": True
        }
    }
    res = client.post("/auth/register", json=transporter_payload)
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))

    # 4. Duplicate Registration Handling
    print_section("4. DUPLICATE REGISTRATION (CONFLICT): POST /auth/register")
    res = client.post("/auth/register", json=farmer_payload)
    print(f"Status: {res.status_code} (Expected 409 Conflict)")
    print(json.dumps(res.json(), indent=2))

    # 5. OAuth2 Form Login for Farmer
    print_section("5. OAUTH2 LOGIN (FARMER): POST /auth/login")
    login_form = {
        "username": "+919876543210",
        "password": "FarmerSecurePass123!"
    }
    res = client.post("/auth/login", data=login_form)
    print(f"Status: {res.status_code}")
    token_data = res.json()
    print(json.dumps(token_data, indent=2))
    farmer_token = token_data["access_token"]

    # 6. OAuth2 Form Login for Transporter
    print_section("6. OAUTH2 LOGIN (TRANSPORTER): POST /auth/login")
    login_form_transporter = {
        "username": "+919876543211",
        "password": "TransportSecurePass123!"
    }
    res = client.post("/auth/login", data=login_form_transporter)
    transporter_token = res.json()["access_token"]
    print(f"Status: {res.status_code}")
    print(f"Transporter Token acquired (truncated): {transporter_token[:35]}...")

    # 7. Authenticated User Profile Inspection
    print_section("7. CURRENT USER IDENTITY: GET /auth/me")
    farmer_headers = {"Authorization": f"Bearer {farmer_token}"}
    res = client.get("/auth/me", headers=farmer_headers)
    print(f"Status: {res.status_code}")
    print(json.dumps(res.json(), indent=2))

    # 8. RBAC Authorized: Farmer accessing Farmer Dashboard
    print_section("8. RBAC PERMITTED: GET /auth/farmer/dashboard (Farmer)")
    res = client.get("/auth/farmer/dashboard", headers=farmer_headers)
    print(f"Status: {res.status_code} (Expected 200 OK)")
    print(json.dumps(res.json(), indent=2))

    # 9. RBAC Forbidden: Transporter trying to access Farmer Dashboard
    print_section("9. RBAC FORBIDDEN: GET /auth/farmer/dashboard (Transporter)")
    transporter_headers = {"Authorization": f"Bearer {transporter_token}"}
    res = client.get("/auth/farmer/dashboard", headers=transporter_headers)
    print(f"Status: {res.status_code} (Expected 403 Forbidden)")
    print(json.dumps(res.json(), indent=2))

    # 10. RBAC Multi-role corridor: Transporter accessing Logistics Overview
    print_section("10. RBAC MULTI-ROLE: GET /auth/logistics/overview (Transporter)")
    res = client.get("/auth/logistics/overview", headers=transporter_headers)
    print(f"Status: {res.status_code} (Expected 200 OK)")
    print(json.dumps(res.json(), indent=2))

    # 11. Unauthorized missing token
    print_section("11. MISSING AUTH TOKEN: GET /auth/me (No header)")
    res = client.get("/auth/me")
    print(f"Status: {res.status_code} (Expected 401 Unauthorized)")
    print(json.dumps(res.json(), indent=2))

if __name__ == "__main__":
    main()
