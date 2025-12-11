
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Assuming sqlite for now based on file list (db folder)
SQLALCHEMY_DATABASE_URL = "sqlite:///./db/dracosec.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def check_user():
    db = SessionLocal()
    try:
        user = db.execute(text("SELECT * FROM users WHERE id = 1")).fetchone()
        if user:
            print(f"User 1 found: {user}")
        else:
            print("User 1 NOT found")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_user()
