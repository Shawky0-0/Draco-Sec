import sys
import os

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "src")))

from src.infrastructure.database import SessionLocal
from src.infrastructure.models import User
from src.infrastructure.security import get_password_hash

def reset_password(username, new_password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User {username} not found!")
            return

        print(f"Resetting password for user: {username}")
        user.password_hash = get_password_hash(new_password)
        db.commit()
        print("Password reset successfully!")
        
    except Exception as e:
        print(f"Error resetting password: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Reset 'shawky' password to 'admin' as requested by user
    reset_password("shawky", "admin")
