from src.infrastructure.database import SessionLocal
from src.infrastructure.models import User
from src.use_cases.auth_service import AuthService

db = SessionLocal()
service = AuthService()

# Let's get Shawky's user id
user = db.query(User).filter(User.username == "shawky").first()

updated_user = service.update_profile(user.id, {"telegram_chat_id": "TEST1234"}, db)

print("DB Chat ID:", updated_user.telegram_chat_id)
print("DB Bot Token:", updated_user.telegram_bot_token)
