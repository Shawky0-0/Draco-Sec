import sqlite3

# Connect to database
conn = sqlite3.connect('db/dracosec.db')
cursor = conn.cursor()

# Update Enterprise users to 30 scans
cursor.execute("UPDATE users SET scans_remaining = 30 WHERE plan_tier = 'Enterprise'")
conn.commit()

# Verify the update
cursor.execute("SELECT username, plan_tier, scans_remaining FROM users WHERE plan_tier = 'Enterprise'")
results = cursor.fetchall()

print("Updated Enterprise users:")
for row in results:
    print(f"  Username: {row[0]}, Plan: {row[1]}, Scans: {row[2]}")

conn.close()
print("\nDatabase updated successfully!")
