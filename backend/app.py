from flask import Flask, request, jsonify
from flask_cors import CORS
import bcrypt
from db import get_connection
import os
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash
import secrets
import string

load_dotenv()

app = Flask(__name__)
CORS(app)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend running!"})

# Register user
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({"error": "No data received"}), 400

        username = data.get("username")
        name = data.get("name")
        role = data.get("role")
        password = data.get("password")
        active = data.get("active", True)

        if not username or not password:
            return jsonify({"error": "Missing required fields"}), 400

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO users (username, name, role, password, active)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (username, name, role, hashed_password, active))

        user_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({
            "message": "User registered successfully",
            "id": user_id,
            "username": username,
            # echo back plaintext password for immediate display (admin use only)
            "password": password
        }), 201

    except Exception as e:
        print("Error in /api/register:", e)
        return jsonify({"error": str(e)}), 500


# Login
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, username, password, role, active FROM users WHERE username = %s",
        (username,),
    )
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return jsonify({"error": "User not found"}), 404

    user_id, username, hashed_password, role, active = user

    if not active:
        return jsonify({"error": "Account inactive"}), 403

    if bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8")):
        return jsonify({
            "message": "Login successful",
            "user": {"id": user_id, "username": username, "role": role, "active": active}
        }), 200
    else:
        return jsonify({"error": "Invalid password"}), 401


# Get all users
@app.route("/api/users", methods=["GET"])
def get_users():
    try:
        conn = get_connection()
        cur = conn.cursor()
        # Return only non-sensitive fields (do not expose password hashes)
        cur.execute("SELECT id, username, name, role, active FROM users")
        rows = cur.fetchall()

        users = []
        for r in rows:
            users.append({
                "id": r[0],
                "username": r[1],
                "name": r[2],
                "role": r[3],
                "active": r[4],
                # do not expose real passwords; frontend expects a password field so return null
                "password": None
            })

        cur.close()
        conn.close()

        return jsonify(users), 200
    except Exception as e:
        print("Error in /api/users:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>/active", methods=["PATCH"])
def update_user_active(user_id):
    try:
        data = request.get_json(force=True)
        if data is None or 'active' not in data:
            return jsonify({"error": "Missing 'active' in request body"}), 400

        active = bool(data.get('active'))

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE users SET active = %s WHERE id = %s RETURNING id, username, active", (active, user_id))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"id": row[0], "username": row[1], "active": row[2]}), 200
    except Exception as e:
        print("Error in /api/users/<id>/active:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/users/<int:user_id>/reset-password", methods=["PATCH"])
def reset_user_password(user_id):
    """Generate a new random password for the user, store its bcrypt hash, and return the plaintext to caller.
    Intended for admin/manager use only.
    """
    try:
        alphabet = string.ascii_letters + string.digits
        new_password = ''.join(secrets.choice(alphabet) for _ in range(8))

        hashed = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("UPDATE users SET password = %s WHERE id = %s RETURNING id, username", (hashed, user_id))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"id": row[0], "username": row[1], "password": new_password}), 200
    except Exception as e:
        print("Error in /api/users/<id>/reset-password:", e)
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=os.getenv("FLASK_DEBUG") == "True", port=port)