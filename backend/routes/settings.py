"""API routes for user settings."""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from backend.models.settings import UserSettings, UserSettingsUpdate
from backend.services.settings_service import SettingsService
from backend.database.database import get_db

router = APIRouter(prefix="/settings", tags=["settings"])
security = HTTPBearer()


def get_user_id(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[str]:
    """Extract user ID from bearer token."""
    if credentials:
        return credentials.credentials
    return None


@router.get("/", response_model=UserSettings)
async def get_settings(
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> UserSettings:
    """Get user settings."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    settings_service = SettingsService()
    user_settings = settings_service.get_settings(db, user_id)
    
    if not user_settings:
        # Create default settings
        user_settings = settings_service.create_settings(db, user_id)
    
    return user_settings


@router.put("/", response_model=UserSettings)
async def update_settings(
    settings_update: UserSettingsUpdate,
    db: Session = Depends(get_db),
    user_id: Optional[str] = Depends(get_user_id)
) -> UserSettings:
    """Update user settings."""
    if not user_id:
        raise HTTPException(status_code=401, detail="User ID required")
    
    settings_service = SettingsService()
    user_settings = settings_service.update_settings(db, user_id, settings_update)
    
    if not user_settings:
        raise HTTPException(status_code=404, detail="Settings not found")
    
    return user_settings


@router.get("/default", response_model=UserSettings)
async def get_default_settings() -> UserSettings:
    """Get default settings."""
    return UserSettings(
        id="",
        user_id="",
        model_id="llama-3.3-70b-versatile",
        temperature=0.7,
        max_tokens=4096,
        top_p=0.9,
        custom_instructions=None
    )
