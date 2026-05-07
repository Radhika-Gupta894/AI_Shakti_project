import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load .env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env")
    exit(1)

engine = create_engine(DATABASE_URL)

def fix_db():
    try:
        with engine.connect() as conn:
            print("📡 Checking columns for table 'criteria'...")
            
            # Check for weightage
            try:
                conn.execute(text("SELECT weightage FROM criteria LIMIT 1"))
                print("✅ 'weightage' column already exists.")
            except Exception:
                print("➕ Adding 'weightage' column...")
                conn.execute(text("ALTER TABLE criteria ADD COLUMN weightage FLOAT DEFAULT 0.0"))
                conn.commit()
                print("✅ Added 'weightage'.")

            # Check for max_score
            try:
                conn.execute(text("SELECT max_score FROM criteria LIMIT 1"))
                print("✅ 'max_score' column already exists.")
            except Exception:
                print("➕ Adding 'max_score' column...")
                conn.execute(text("ALTER TABLE criteria ADD COLUMN max_score FLOAT DEFAULT 100.0"))
                conn.commit()
                print("✅ Added 'max_score'.")

            print("📡 Checking columns for table 'users'...")
            for col in ["phone", "department", "designation", "bio", "profile_picture"]:
                try:
                    conn.execute(text(f"SELECT {col} FROM users LIMIT 1"))
                    print(f"✅ '{col}' column already exists.")
                except Exception:
                    print(f"➕ Adding '{col}' column...")
                    conn.execute(text(f"ALTER TABLE users ADD COLUMN {col} TEXT"))
                    conn.commit()
                    print(f"✅ Added '{col}'.")
                
            print("🚀 Database schema update complete!")
            
    except Exception as e:
        print(f"❌ Error during DB fix: {e}")

if __name__ == "__main__":
    fix_db()
