"""Create or update the local development login account.

Usage:
    python scripts/seed_dev_user.py
    python scripts/seed_dev_user.py --email admin@example.com --password change-me
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone
from pathlib import Path

# Running ``python scripts/seed_dev_user.py`` puts scripts/ on sys.path.
# Add the backend root so application modules can be imported consistently.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from database.database import SessionLocal
from models.user import User
from services.auth_service import hash_password


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Create/update a development user.")
    parser.add_argument("--email", default="test@moi.go.kr")
    parser.add_argument("--password", default="test1234")
    parser.add_argument("--name", default="테스트 담당자")
    parser.add_argument("--role", default="OFFICIAL")
    parser.add_argument("--department", default="행정안전부")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    email = args.email.strip().lower()
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    with SessionLocal() as db:
        user = db.query(User).filter(User.email == email).first()
        created = user is None
        if created:
            next_id = max((row[0] for row in db.query(User.user_id).all()), default=0) + 1
            user = User(user_id=next_id, email=email, created_at=now)
            db.add(user)

        user.name = args.name
        user.password = hash_password(args.password)
        user.role = args.role
        user.department = args.department
        user.updated_at = now
        db.commit()

    action = "created" if created else "updated"
    print(f"Development user {action}: {email}")


if __name__ == "__main__":
    main()
