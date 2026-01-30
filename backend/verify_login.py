import sys
import os

# Add backend root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "src")))

from src.infrastructure.database import SessionLocal
from src.infrastructure.models import User
from src.infrastructure.security import verify_password

def verify_login(username, password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"User {username} not found!")
            return False

        if verify_password(password, user.password_hash):
            print("Login Successful!")
            return True
        else:
            print("Login Failed: Invalid Password")
            return False
            
    except Exception as e:
        print(f"Error verifies login: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    verify_login("shawky", "password123")
