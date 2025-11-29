from .backup_routes import router as backup_router
from .notification_routes import router as notification_router
from .device_routes import router as device_router

__all__ = ['backup_router', 'notification_router', 'device_router']
