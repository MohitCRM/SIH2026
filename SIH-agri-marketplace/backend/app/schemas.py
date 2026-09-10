"""Pydantic schemas for data validation, serialization, and role-based registration.
"""

from datetime import datetime
from typing import Optional, Union
import uuid

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models import UserRole


# ==============================================================================
# 1. Profile Creation Schemas
# ==============================================================================

class FarmerProfileCreate(BaseModel):
    address: str = Field(..., min_length=3, max_length=255, description="Physical farm/residence address")
    state: Optional[str] = Field(default="Andhra Pradesh", max_length=100)
    district: Optional[str] = Field(default="Guntur", max_length=100)
    village: Optional[str] = Field(default=None, max_length=100)
    pincode: Optional[str] = Field(default=None, max_length=10)
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Farm latitude coordinate")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Farm longitude coordinate")
    photo_url: Optional[str] = Field(default=None, max_length=500, description="Farmer profile or farm photo URL")
    
    # KYC details
    land_size_acres: Optional[float] = Field(default=None, gt=0)
    survey_number: Optional[str] = Field(default=None, max_length=50)
    id_proof_type: Optional[str] = Field(default=None, max_length=50)
    id_proof_number: Optional[str] = Field(default=None, max_length=50)
    kyc_document_url: Optional[str] = Field(default=None, max_length=500)
    kyc_status: Optional[str] = Field(default="PENDING_SUBMISSION")
    kyc_submitted_at: Optional[datetime] = None
    is_kyc_verified: bool = Field(default=False, description="Initial KYC status")


class FarmerKycSubmitRequest(BaseModel):
    id_proof_type: str = Field(..., description="ID Type: AADHAAR, KISAN_CREDIT_CARD, or PATTA_PASSBOOK")
    id_proof_number: str = Field(..., min_length=4, max_length=50, description="Document identifier number")
    land_size_acres: float = Field(..., gt=0, description="Total farm landholding in acres")
    survey_number: Optional[str] = Field(default=None, max_length=50, description="Revenue survey / khata number")
    village: Optional[str] = Field(default=None, max_length=100)
    district: Optional[str] = Field(default="Guntur", max_length=100)
    state: Optional[str] = Field(default="Andhra Pradesh", max_length=100)
    pincode: Optional[str] = Field(default=None, max_length=10)
    photo_url: Optional[str] = Field(default=None, max_length=500, description="Farmer photo URL")
    kyc_document_url: Optional[str] = Field(default=None, max_length=500, description="ID / Passbook document URL")


class CropListingCreate(BaseModel):
    crop_name: str = Field(..., min_length=2, max_length=100)
    quantity_quintals: float = Field(..., gt=0)
    expected_price_per_qtl: float = Field(..., gt=0)
    harvest_date: Optional[str] = None



class TransporterProfileCreate(BaseModel):
    vehicle_number: str = Field(..., min_length=3, max_length=50, description="Registered vehicle registration number (e.g. AP 39 TY 1234)")
    max_payload_kg: float = Field(..., gt=0, description="Maximum vehicle carrying capacity in kilograms")
    is_available: bool = Field(default=True, description="Current availability for dispatch")


class CollectionCenterProfileCreate(BaseModel):
    center_name: str = Field(..., min_length=2, max_length=150, description="Name of the aggregation or cold storage facility")
    address: str = Field(..., min_length=3, max_length=255, description="Physical location address of the center")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Facility latitude coordinate")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Facility longitude coordinate")
    storage_capacity_kg: float = Field(..., gt=0, description="Total storage/holding capacity in kilograms")


class ConsumerProfileCreate(BaseModel):
    delivery_address: str = Field(..., min_length=3, max_length=255, description="Default delivery destination address")
    latitude: Optional[float] = Field(default=None, ge=-90.0, le=90.0, description="Delivery latitude coordinate")
    longitude: Optional[float] = Field(default=None, ge=-180.0, le=180.0, description="Delivery longitude coordinate")


class AdminProfileCreate(BaseModel):
    department: str = Field(default="Platform Operations", max_length=100, description="Administrative department")
    access_level: str = Field(default="SUPERADMIN", max_length=50, description="Privilege tier")


# ==============================================================================
# 2. Profile Response Schemas (ORM Read)
# ==============================================================================

class FarmerProfileResponse(FarmerProfileCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class TransporterProfileResponse(TransporterProfileCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class CollectionCenterProfileResponse(CollectionCenterProfileCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class ConsumerProfileResponse(ConsumerProfileCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


class AdminProfileResponse(AdminProfileCreate):
    id: uuid.UUID
    user_id: uuid.UUID
    model_config = ConfigDict(from_attributes=True)


AnyProfileResponse = Union[
    FarmerProfileResponse,
    TransporterProfileResponse,
    CollectionCenterProfileResponse,
    ConsumerProfileResponse,
    AdminProfileResponse,
]


# ==============================================================================
# 3. User Registration Schema (Multi-role with dynamic profile matching)
# ==============================================================================

class UserRegisterRequest(BaseModel):
    phone_number: str = Field(
        ...,
        min_length=10,
        max_length=15,
        pattern=r"^\+?[1-9]\d{9,14}$",
        description="Mobile number with country code (e.g. +919876543210 or 9876543210)",
    )
    password: str = Field(
        ...,
        min_length=6,
        max_length=100,
        description="Password with at least 6 characters",
    )
    full_name: str = Field(..., min_length=2, max_length=120, description="Legal full name")
    role: UserRole = Field(..., description="Assigned user role in the agricultural marketplace")

    # Nested profile objects - one must be provided according to the selected role
    farmer_profile: Optional[FarmerProfileCreate] = None
    transporter_profile: Optional[TransporterProfileCreate] = None
    collection_center_profile: Optional[CollectionCenterProfileCreate] = None
    consumer_profile: Optional[ConsumerProfileCreate] = None
    admin_profile: Optional[AdminProfileCreate] = None

    @model_validator(mode="after")
    def validate_matching_profile_present(self) -> "UserRegisterRequest":
        """Ensures the appropriate profile payload is supplied matching the chosen role."""
        if self.role == UserRole.FARMER and self.farmer_profile is None:
            raise ValueError("Field 'farmer_profile' is required when role is 'FARMER'.")
        if self.role == UserRole.TRANSPORTER and self.transporter_profile is None:
            raise ValueError("Field 'transporter_profile' is required when role is 'TRANSPORTER'.")
        if self.role == UserRole.COLLECTION_CENTER and self.collection_center_profile is None:
            raise ValueError("Field 'collection_center_profile' is required when role is 'COLLECTION_CENTER'.")
        if self.role == UserRole.CONSUMER and self.consumer_profile is None:
            raise ValueError("Field 'consumer_profile' is required when role is 'CONSUMER'.")
        if self.role == UserRole.ADMIN and self.admin_profile is None:
            self.admin_profile = AdminProfileCreate()
        return self


# ==============================================================================
# 4. Authentication Schemas (Token & Login)
# ==============================================================================

class UserLoginRequest(BaseModel):
    phone_number: str = Field(..., description="Registered primary login mobile number")
    password: str = Field(..., min_length=1, description="Account password")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole


class TokenPayload(BaseModel):
    sub: str
    phone_number: str
    role: UserRole
    exp: int


# ==============================================================================
# 5. User Response Schema
# ==============================================================================

class UserResponse(BaseModel):
    id: uuid.UUID
    phone_number: str
    full_name: str
    role: UserRole
    is_active: bool
    created_at: datetime
    profile: Optional[AnyProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)
