"""API router for authentication and Role-Based Access Control (RBAC).
Provides endpoints for multi-role registration, OAuth2 password login,
current user profile inspection, and sample role-protected routes.
"""

from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.auth import create_access_token, get_current_user, get_password_hash, require_roles, verify_password
from app.database import get_db
from app.models import (
    AdminProfile,
    CollectionCenterProfile,
    ConsumerProfile,
    FarmerProfile,
    TransporterProfile,
    User,
    UserRole,
)
from app.schemas import (
    CropListingCreate,
    FarmerKycSubmitRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication & RBAC"])


# ==============================================================================
# 1. User Registration (Multi-Role Transactional)
# ==============================================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user with role-specific profile",
    description=(
        "Atomically registers a new user with their associated role profile "
        "(FARMER, TRANSPORTER, COLLECTION_CENTER, or CONSUMER). "
        "Fails if the phone number already exists or if matching profile data is omitted."
    ),
)
def register_user(
    payload: UserRegisterRequest,
    db: Session = Depends(get_db),
):
    # Check for existing user with the same phone number
    existing_user = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with phone number '{payload.phone_number}' is already registered.",
        )

    # Begin atomic transaction for User + Profile creation
    try:
        new_user = User(
            phone_number=payload.phone_number,
            hashed_password=get_password_hash(payload.password),
            full_name=payload.full_name,
            role=payload.role,
            is_active=True,
        )
        db.add(new_user)
        db.flush()  # Generates new_user.id without committing the transaction

        # Instantiate matching profile based on user role
        if payload.role == UserRole.FARMER:
            farmer_data = payload.farmer_profile.model_dump()
            profile = FarmerProfile(user_id=new_user.id, **farmer_data)
            db.add(profile)

        elif payload.role == UserRole.TRANSPORTER:
            transporter_data = payload.transporter_profile.model_dump()
            profile = TransporterProfile(user_id=new_user.id, **transporter_data)
            db.add(profile)

        elif payload.role == UserRole.COLLECTION_CENTER:
            cc_data = payload.collection_center_profile.model_dump()
            profile = CollectionCenterProfile(user_id=new_user.id, **cc_data)
            db.add(profile)

        elif payload.role == UserRole.CONSUMER:
            consumer_data = payload.consumer_profile.model_dump()
            profile = ConsumerProfile(user_id=new_user.id, **consumer_data)
            db.add(profile)

        elif payload.role == UserRole.ADMIN:
            from app.schemas import AdminProfileCreate
            admin_data = (payload.admin_profile or AdminProfileCreate()).model_dump()
            profile = AdminProfile(user_id=new_user.id, **admin_data)
            db.add(profile)

        db.commit()
        db.refresh(new_user)
        return new_user

    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed due to a server error: {str(exc)}",
        ) from exc


# ==============================================================================
# 2. User Login (OAuth2 Password Flow & JSON Flow)
# ==============================================================================

@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login via OAuth2 password flow (phone number in username field)",
    description="Standard OAuth2 form login. Provide the registered phone number in the 'username' field.",
)
def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db),
):
    # Look up user by phone number passed in form_data.username
    user = db.query(User).filter(User.phone_number == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently suspended or inactive",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "phone_number": user.phone_number,
            "role": user.role.value,
        }
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
    )


@router.post(
    "/login/json",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login via raw JSON payload",
    description="Convenience endpoint for frontend SPA applications posting application/json bodies.",
)
def login_json(
    payload: UserLoginRequest,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.phone_number == payload.phone_number).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone number or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is currently suspended or inactive",
        )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "phone_number": user.phone_number,
            "role": user.role.value,
        }
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
    )


# ==============================================================================
# 3. User Self-Inspection (/auth/me)
# ==============================================================================

@router.get(
    "/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    summary="Fetch current user profile and role details",
    description="Protected endpoint returning full authenticated user details and active role profile.",
)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


# ==============================================================================
# 4. Role-Based Access Control (RBAC) Demonstration Endpoints
# ==============================================================================

@router.get(
    "/farmer/dashboard",
    status_code=status.HTTP_200_OK,
    summary="Farmer-only protected resource",
)
def get_farmer_dashboard(current_user: User = Depends(require_roles([UserRole.FARMER]))):
    profile = current_user.farmer_profile
    return {
        "message": f"Welcome Farmer {current_user.full_name} to your harvest advisory portal.",
        "user_id": str(current_user.id),
        "kyc_verified": profile.is_kyc_verified if profile else False,
        "kyc_status": profile.kyc_status if profile else "PENDING_SUBMISSION",
        "profile": profile,
    }


@router.post(
    "/farmer/kyc",
    status_code=status.HTTP_200_OK,
    summary="Submit government KYC records and land documents for verification",
)
def submit_farmer_kyc(
    payload: FarmerKycSubmitRequest,
    current_user: User = Depends(require_roles([UserRole.FARMER])),
    db: Session = Depends(get_db),
):
    profile = current_user.farmer_profile
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    from datetime import datetime, timezone

    # Update KYC credentials & location details
    profile.id_proof_type = payload.id_proof_type
    profile.id_proof_number = payload.id_proof_number
    profile.land_size_acres = payload.land_size_acres
    if payload.survey_number:
        profile.survey_number = payload.survey_number
    if payload.village:
        profile.village = payload.village
    if payload.district:
        profile.district = payload.district
    if payload.state:
        profile.state = payload.state
    if payload.pincode:
        profile.pincode = payload.pincode
    if payload.photo_url:
        profile.photo_url = payload.photo_url
    if payload.kyc_document_url:
        profile.kyc_document_url = payload.kyc_document_url

    profile.kyc_status = "UNDER_REVIEW"
    profile.kyc_submitted_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(profile)

    return {
        "message": "Government KYC documents successfully submitted for administrative verification.",
        "kyc_status": profile.kyc_status,
        "is_kyc_verified": profile.is_kyc_verified,
        "profile": profile,
    }


@router.post(
    "/farmer/crops",
    status_code=status.HTTP_201_CREATED,
    summary="List a new crop consignment (STRICTLY GATED by KYC Verification)",
)
def create_crop_listing(
    payload: CropListingCreate,
    current_user: User = Depends(require_roles([UserRole.FARMER])),
    db: Session = Depends(get_db),
):
    profile = current_user.farmer_profile
    
    # -------------------------------------------------------------------------
    # GATING LOGIC: Farmers can ONLY start listing crops after KYC is verified!
    # -------------------------------------------------------------------------
    if not profile or not profile.is_kyc_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "KYC Verification Required: You can only publish crop consignments and "
                "trade on the marketplace after your government KYC registration is verified by the platform admin."
            ),
        )

    return {
        "message": f"Crop consignment '{payload.crop_name}' successfully listed on marketplace.",
        "listing": {
            "crop_name": payload.crop_name,
            "quantity_quintals": payload.quantity_quintals,
            "expected_price_per_qtl": payload.expected_price_per_qtl,
            "seller_farmer": current_user.full_name,
            "seller_phone": current_user.phone_number,
            "status": "ACTIVE_ON_MARKETPLACE",
            "is_kyc_verified_seller": True,
        },
    }



@router.get(
    "/transporter/fleet",
    status_code=status.HTTP_200_OK,
    summary="Transporter-only protected resource",
)
def get_transporter_fleet(current_user: User = Depends(require_roles([UserRole.TRANSPORTER]))):
    return {
        "message": f"Welcome Transporter {current_user.full_name}.",
        "vehicle_number": current_user.transporter_profile.vehicle_number if current_user.transporter_profile else None,
        "is_available": current_user.transporter_profile.is_available if current_user.transporter_profile else False,
    }


@router.get(
    "/logistics/overview",
    status_code=status.HTTP_200_OK,
    summary="Multi-role protected resource (Transporter & Collection Center)",
)
def get_logistics_overview(
    current_user: User = Depends(require_roles([UserRole.TRANSPORTER, UserRole.COLLECTION_CENTER]))
):
    return {
        "message": f"Logistics corridor access granted to {current_user.full_name} ({current_user.role.value}).",
        "role": current_user.role.value,
    }


# ==============================================================================
# 5. Platform Administration Endpoints (Admin Only)
# ==============================================================================

@router.get(
    "/admin/stats",
    status_code=status.HTTP_200_OK,
    summary="Platform statistics overview (Admin only)",
)
def get_admin_stats(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    total_users = db.query(User).count()
    farmers = db.query(User).filter(User.role == UserRole.FARMER).count()
    transporters = db.query(User).filter(User.role == UserRole.TRANSPORTER).count()
    centers = db.query(User).filter(User.role == UserRole.COLLECTION_CENTER).count()
    consumers = db.query(User).filter(User.role == UserRole.CONSUMER).count()
    verified_farmers = db.query(FarmerProfile).filter(FarmerProfile.is_kyc_verified == True).count()
    pending_kyc = db.query(FarmerProfile).filter(FarmerProfile.is_kyc_verified == False).count()

    return {
        "total_users": total_users,
        "farmers": farmers,
        "transporters": transporters,
        "collection_centers": centers,
        "consumers": consumers,
        "verified_farmers": verified_farmers,
        "pending_kyc": pending_kyc,
    }


@router.get(
    "/admin/users",
    response_model=list[UserResponse],
    status_code=status.HTTP_200_OK,
    summary="List all registered platform users (Admin only)",
)
def get_all_users(
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    return db.query(User).order_by(User.created_at.desc()).all()


@router.patch(
    "/admin/farmers/{farmer_profile_id}/verify-kyc",
    status_code=status.HTTP_200_OK,
    summary="Toggle/Approve Farmer KYC status (Admin only)",
)
def verify_farmer_kyc(
    farmer_profile_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    import uuid
    try:
        profile_uuid = uuid.UUID(farmer_profile_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid profile UUID")

    profile = db.query(FarmerProfile).filter(FarmerProfile.id == profile_uuid).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Farmer profile not found")

    profile.is_kyc_verified = not profile.is_kyc_verified
    profile.kyc_status = "VERIFIED" if profile.is_kyc_verified else "PENDING_SUBMISSION"
    db.commit()
    db.refresh(profile)
    return {
        "message": f"Farmer KYC verification updated to {profile.is_kyc_verified}",
        "is_kyc_verified": profile.is_kyc_verified,
        "kyc_status": profile.kyc_status,
        "farmer_profile_id": str(profile.id),
    }


@router.patch(
    "/admin/users/{user_id}/toggle-status",
    status_code=status.HTTP_200_OK,
    summary="Activate or deactivate a user account (Admin only)",
)
def toggle_user_status(
    user_id: str,
    current_user: User = Depends(require_roles([UserRole.ADMIN])),
    db: Session = Depends(get_db),
):
    import uuid
    try:
        target_uuid = uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user UUID")

    if target_uuid == current_user.id:
        raise HTTPException(status_code=400, detail="Admins cannot deactivate their own account")

    target_user = db.query(User).filter(User.id == target_uuid).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    target_user.is_active = not target_user.is_active
    db.commit()
    db.refresh(target_user)
    return {
        "message": f"User active status toggled to {target_user.is_active}",
        "user_id": str(target_user.id),
        "is_active": target_user.is_active,
    }

