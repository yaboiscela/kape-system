from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
import bcrypt
from db import get_connection
import os
from dotenv import load_dotenv
import secrets
import string
from datetime import timedelta

load_dotenv()

app = Flask(__name__)
CORS(app)

# ---------------- JWT CONFIG ----------------
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecretkey")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=6)
jwt = JWTManager(app)


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Backend running!"})


# ---------------- REGISTER ----------------
@app.route("/api/register", methods=["POST"])
def register():
    try:
        data = request.get_json(force=True)
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
            "username": username
        }), 201

    except Exception as e:
        print("Error in /api/register:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- LOGIN ----------------
@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json(force=True)
        username = data.get("username")
        password = data.get("password")

        if not username or not password:
            return jsonify({"error": "Missing username or password"}), 400

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, username, password, role, active FROM users WHERE username = %s", (username,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        user_id, username, hashed_password, role, active = user

        if not active:
            return jsonify({"error": "Account inactive"}), 403

        if bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8")):
            access_token = create_access_token(identity={"id": user_id, "username": username, "role": role})
            return jsonify({
                "message": "Login successful",
                "token": access_token,
                "user": {"id": user_id, "username": username, "role": role, "active": active}
            }), 200
        else:
            return jsonify({"error": "Invalid password"}), 401

    except Exception as e:
        print("Error in /api/login:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- VERIFY CURRENT USER ----------------
@app.route("/api/me", methods=["GET"])
@jwt_required()
def get_current_user():
    user = get_jwt_identity()
    return jsonify({"user": user}), 200


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=os.getenv("FLASK_DEBUG") == "True", port=port)
