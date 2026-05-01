import sqlite3
import datetime
import json

def seed_data():
    conn = sqlite3.connect('backend/shakti_ai.db')
    cursor = conn.cursor()

    # Create tables if they don't exist (simplified for seeding)
    cursor.execute('''CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, role TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS tenders (id INTEGER PRIMARY KEY, title TEXT, criteria TEXT, status TEXT)''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS bidders (id INTEGER PRIMARY KEY, name TEXT)''')

    # Insert Dummy Data
    cursor.execute("INSERT OR IGNORE INTO users (id, username, role) VALUES (1, 'admin', 'admin')")
    
    criteria = {
        "technical_criteria": [
            {"name": "Experience", "description": "5 years in tactical gear", "mandatory": True},
            {"name": "ISO 9001", "description": "Valid certification", "mandatory": True}
        ],
        "financial_criteria": [
            {"name": "Turnover", "description": "50 Cr average", "mandatory": True}
        ]
    }
    
    cursor.execute("INSERT OR IGNORE INTO tenders (id, title, criteria, status) VALUES (1, 'Tactical Gear Procurement', ?, 'active')", (json.dumps(criteria),))
    
    cursor.execute("INSERT OR IGNORE INTO bidders (id, name) VALUES (1, 'Bharat Electronics Ltd')")
    cursor.execute("INSERT OR IGNORE INTO bidders (id, name) VALUES (2, 'Modern Garments Pvt')")
    
    conn.commit()
    conn.close()
    print("Database seeded with dummy data.")

if __name__ == "__main__":
    seed_data()
