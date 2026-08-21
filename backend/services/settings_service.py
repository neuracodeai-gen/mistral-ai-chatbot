"""Service for managing user settings."""

import logging
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from backend.database.models import DBUserSettings
from backend.models.settings import UserSettings, UserSettingsUpdate
import uuid

logger = logging.getLogger(__name__)


class SettingsService:
    """Service for managing user settings."""
    
    def get_settings(self, db: Session, user_id: str) -> Optional[UserSettings]:
        """Get user settings."""
        try:
            db_settings = db.query(DBUserSettings).filter(DBUserSettings.user_id == user_id).first()
            if not db_settings:
                return None
            return UserSettings.from_orm(db_settings)
        except Exception as e:
            logger.error(f"Error getting settings: {e}")
            raise
    
    def create_settings(self, db: Session, user_id: str) -> UserSettings:
        """Create default settings for a user."""
        try:
            db_settings = DBUserSettings(
                id=str(uuid.uuid4()),
                user_id=user_id,
                model_id="llama-3.3-70b-versatile",
                temperature=0.7,
                max_tokens=4096,
                top_p=0.9,
                custom_instructions=None,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(db_settings)
            db.commit()
            db.refresh(db_settings)
            return UserSettings.from_orm(db_settings)
        except Exception as e:
            logger.error(f"Error creating settings: {e}")
            db.rollback()
            raise
    
    def update_settings(
        self, 
        db: Session, 
        user_id: str, 
        settings_update: UserSettingsUpdate
    ) -> Optional[UserSettings]:
        """Update user settings."""
        try:
            db_settings = db.query(DBUserSettings).filter(DBUserSettings.user_id == user_id).first()
            if not db_settings:
                # Create if not exists
                db_settings = DBUserSettings(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    created_at=datetime.utcnow()
                )
                db.add(db_settings)
            
            # Update fields
            if settings_update.model_id is not None:
                db_settings.model_id = settings_update.model_id
            if settings_update.temperature is not None:
                db_settings.temperature = settings_update.temperature
            if settings_update.max_tokens is not None:
                db_settings.max_tokens = settings_update.max_tokens
            if settings_update.top_p is not None:
                db_settings.top_p = settings_update.top_p
            if settings_update.custom_instructions is not None:
                db_settings.custom_instructions = settings_update.custom_instructions
            
            db_settings.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(db_settings)
            
            return UserSettings.from_orm(db_settings)
        except Exception as e:
            logger.error(f"Error updating settings: {e}")
            db.rollback()
            raise
    
    def get_or_create_settings(self, db: Session, user_id: str) -> UserSettings:
        """Get settings for a user, or create default if not exists."""
        settings = self.get_settings(db, user_id)
        if not settings:
            settings = self.create_settings(db, user_id)
        return settings
