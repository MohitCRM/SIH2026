"""SQLAlchemy database models for Agricultural Marketplace authentication and RBAC.
Implements a 1-to-1 extension table pattern for user profiles.
"""

import enum
import uuid
from sqlalchemy import (
    Column,
    String,
    Boolean,
    Float,
    ForeignKey,
    DateTime,
    Enum as SAEnum,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.types import TypeDecorator, CHAR
from sqlalchemy.orm import relationship

from app.database import Base


class GUID(TypeDecorator):
    """Platform-independent GUID type.
    Uses PostgreSQL's native UUID type when on PostgreSQL, and CHAR(36) on SQLite.
    Stores and returns uuid.UUID objects seamlessly.
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        return str(value) if isinstance(value, uuid.UUID) else str(uuid.UUID(str(value)))

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(str(value))
        return value


class UserRole(str, enum.Enum):
    """Enumeration of system user roles."""
    FARMER = "FARMER"
    TRANSPORTER = "TRANSPORTER"
    COLLECTION_CENTER = "COLLECTION_CENTER"
    CONSUMER = "CONSUMER"
    ADMIN = "ADMIN"


class User(Base):
    """Base User entity for core identity and authentication."""
    __tablename__ = "users"

    id = Column(GUID, primary_key=True, default=uuid.uuid4, index=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(
        SAEnum(UserRole, name="user_role", native_enum=False),
        nullable=False,
        index=True,
    )
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # 1-to-1 extension profile relationships with cascading deletion
    farmer_profile = relationship(
        "FarmerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    transporter_profile = relationship(
        "TransporterProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    collection_center_profile = relationship(
        "CollectionCenterProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    consumer_profile = relationship(
        "ConsumerProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    admin_profile = relationship(
        "AdminProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )

    @property
    def profile(self):
        """Convenience property returning the active profile based on user role."""
        if self.role == UserRole.FARMER:
            return self.farmer_profile
        if self.role == UserRole.TRANSPORTER:
            return self.transporter_profile
        if self.role == UserRole.COLLECTION_CENTER:
            return self.collection_center_profile
        if self.role == UserRole.CONSUMER:
            return self.consumer_profile
        if self.role == UserRole.ADMIN:
            return self.admin_profile
        return None

    def __repr__(self) -> str:
        return f"<User(id={self.id}, phone={self.phone_number}, role={self.role})>"


class FarmerProfile(Base):
    """Extension profile for farmers offering produce.
    Stores physical farm address, geolocation, farmer photo, and government KYC records.
    """
    __tablename__ = "farmer_profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    # Physical farm location
    address = Column(String(255), nullable=False)
    state = Column(String(100), default="Andhra Pradesh", nullable=True)
    district = Column(String(100), default="Guntur", nullable=True)
    village = Column(String(100), nullable=True)
    pincode = Column(String(10), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    # Farmer photo
    photo_url = Column(String(500), nullable=True)

    # Government KYC Credentials & Land Verification
    land_size_acres = Column(Float, nullable=True)
    survey_number = Column(String(50), nullable=True)
    id_proof_type = Column(String(50), nullable=True)  # e.g. AADHAAR, KISAN_CREDIT_CARD, PATTA_PASSBOOK
    id_proof_number = Column(String(50), nullable=True)
    kyc_document_url = Column(String(500), nullable=True)
    
    # KYC Lifecycle: PENDING_SUBMISSION -> UNDER_REVIEW -> VERIFIED / REJECTED
    kyc_status = Column(String(30), default="PENDING_SUBMISSION", nullable=False)
    kyc_submitted_at = Column(DateTime(timezone=True), nullable=True)
    is_kyc_verified = Column(Boolean, default=False, nullable=False)

    user = relationship("User", back_populates="farmer_profile")

    def __repr__(self) -> str:
        return f"<FarmerProfile(user_id={self.user_id}, address='{self.address}', kyc_status='{self.kyc_status}', kyc={self.is_kyc_verified})>"



class TransporterProfile(Base):
    """Extension profile for logistics drivers and transporters."""
    __tablename__ = "transporter_profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    vehicle_number = Column(String(50), nullable=False)
    max_payload_kg = Column(Float, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    user = relationship("User", back_populates="transporter_profile")

    def __repr__(self) -> str:
        return f"<TransporterProfile(user_id={self.user_id}, vehicle='{self.vehicle_number}', payload={self.max_payload_kg})>"


class CollectionCenterProfile(Base):
    """Extension profile for aggregation and cold storage centers."""
    __tablename__ = "collection_center_profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    center_name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    storage_capacity_kg = Column(Float, nullable=False)

    user = relationship("User", back_populates="collection_center_profile")

    def __repr__(self) -> str:
        return f"<CollectionCenterProfile(user_id={self.user_id}, center='{self.center_name}')>"


class ConsumerProfile(Base):
    """Extension profile for retail buyers and consumers."""
    __tablename__ = "consumer_profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    delivery_address = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)

    user = relationship("User", back_populates="consumer_profile")

    def __repr__(self) -> str:
        return f"<ConsumerProfile(user_id={self.user_id}, delivery_address='{self.delivery_address}')>"


class AdminProfile(Base):
    """Extension profile for system administrators and platform operators."""
    __tablename__ = "admin_profiles"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(
        GUID,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True,
    )
    department = Column(String(100), default="Platform Operations", nullable=False)
    access_level = Column(String(50), default="SUPERADMIN", nullable=False)

    user = relationship("User", back_populates="admin_profile")

    def __repr__(self) -> str:
        return f"<AdminProfile(user_id={self.user_id}, department='{self.department}', level='{self.access_level}')>"
