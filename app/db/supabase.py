from supabase import create_client, Client
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

def get_supabase_client() -> Client:
    """
    Create and return a Supabase client instance.
    """
    try:
        client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        return client
    except Exception as e:
        logger.error(f"Failed to create Supabase client: {str(e)}")
        raise

# Create a singleton instance
supabase: Client = get_supabase_client() 