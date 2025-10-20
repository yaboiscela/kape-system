from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
import bcrypt
from db import get_connection
import os
from dotenv import load_dotenv
from datetime import timedelta
from psycopg2.errors import UniqueViolation
import random, string
from werkzeug.utils import secure_filename
import json

load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, expose_headers=["Authorization"])

# ---------------- JWT CONFIG ----------------
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY")
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

        if not username or not password or not name or not role:
            return jsonify({"error": "Missing required fields"}), 400

        hashed_password = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        conn = get_connection()
        cur = conn.cursor()

        # Prevent duplicate usernames
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            return jsonify({"error": "Username already exists"}), 409

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

    except UniqueViolation:
        return jsonify({"error": "Username already exists"}), 409
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
            # ✅ Only store user_id as string
            access_token = create_access_token(identity=str(user_id))
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
    try:
        user_id = get_jwt_identity()

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, username, role, active FROM users WHERE id = %s", (int(user_id),))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "user": {
                "id": user[0],
                "username": user[1],
                "role": user[2],
                "active": user[3]
            }
        }), 200

    except Exception as e:
        print("Error in /api/me:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- GET ALL USERS ----------------
@app.route("/api/users", methods=["GET"])
@jwt_required()
def get_all_users():
    try:
        user_id = get_jwt_identity()

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT role FROM users WHERE id = %s", (int(user_id),))
        role = cur.fetchone()
        if not role:
            return jsonify({"error": "User not found"}), 404
        if role[0].lower() not in ["admin", "manager"]:
            return jsonify({"error": "Unauthorized"}), 403

        cur.execute("SELECT id, username, name, role, active FROM users ORDER BY id ASC")
        users = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify([
            {"id": u[0], "username": u[1], "name": u[2], "role": u[3], "active": u[4]}
            for u in users
        ]), 200

    except Exception as e:
        print("Error in /api/users:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- TOGGLE ACTIVE STATE ----------------
@app.route("/api/users/<int:user_id>/active", methods=["PATCH"])
@jwt_required()
def toggle_active(user_id):
    try:
        requester_id = get_jwt_identity()

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT role FROM users WHERE id = %s", (int(requester_id),))
        role = cur.fetchone()
        if not role:
            return jsonify({"error": "User not found"}), 404
        if role[0].lower() not in ["admin", "manager"]:
            return jsonify({"error": "Unauthorized"}), 403

        data = request.get_json(force=True)
        new_active = data.get("active")
        if new_active is None:
            return jsonify({"error": "Missing 'active' field"}), 400

        cur.execute("UPDATE users SET active = %s WHERE id = %s RETURNING id, active", (new_active, user_id))
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not updated:
            return jsonify({"error": "User not found"}), 404

        return jsonify({"id": updated[0], "active": updated[1]}), 200

    except Exception as e:
        print("Error in /api/users/<id>/active:", e)
        return jsonify({"error": str(e)}), 500


# ---------------- RESET PASSWORD ----------------
@app.route("/api/users/<int:user_id>/reset-password", methods=["PATCH"])
@jwt_required()
def reset_password(user_id):
    try:
        requester_id = get_jwt_identity()

        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT role FROM users WHERE id = %s", (int(requester_id),))
        role = cur.fetchone()
        if not role:
            return jsonify({"error": "User not found"}), 404
        if role[0].lower() not in ["admin", "manager"]:
            return jsonify({"error": "Unauthorized"}), 403

        new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        hashed_password = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        cur.execute("UPDATE users SET password = %s WHERE id = %s RETURNING username", (hashed_password, user_id))
        result = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not result:
            return jsonify({"error": "User not found"}), 404

        username = result[0]
        return jsonify({"message": "Password reset successfully", "username": username, "password": new_password}), 200

    except Exception as e:
        print("Error in /api/users/<id>/reset-password:", e)
        return jsonify({"error": str(e)}), 500


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ---------------- ADD PRODUCT ----------------
@app.route("/api/products", methods=["POST"])
@jwt_required()
def add_product():
    try:
        name = request.form.get("productName")
        category = request.form.get("category")
        size = request.form.get("size") or "{}"
        addons = request.form.get("addons") or "[]"

        # Handle uploaded file
        image_file = request.files.get("productImage")
        filename = None
        if image_file:
            filename = secure_filename(image_file.filename)
            image_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
            image_file.save(image_path)

        conn = get_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO products (name, category, image, size, addons)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (name, category, filename, json.dumps(size), json.dumps(addons)))

        product_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "Product added successfully", "id": product_id}), 201

    except Exception as e:
        print("Error in /api/products:", e)
        return jsonify({"error": str(e)}), 500

import json

# ---------------- GET PRODUCTS ----------------
@app.route("/api/products", methods=["GET"])
@jwt_required()
def get_products():
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, name, category, image, size, addons FROM products ORDER BY id ASC")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        products = []
        for r in rows:
            # Safely parse JSON fields if they're text
            size = r[4]
            addons = r[5]

            # Handle cases where DB returns strings instead of dict/list
            if isinstance(size, str):
                try:
                    size = json.loads(size)
                except:
                    pass

            if isinstance(addons, str):
                try:
                    addons = json.loads(addons)
                except:
                    pass

            products.append({
                "id": r[0],
                "name": r[1],
                "category": r[2],
                "image": r[3],
                "size": size,
                "addons": addons,
            })

        return jsonify(products), 200

    except Exception as e:
        print("Error in /api/products (GET):", e)
        return jsonify({"error": str(e)}), 500

from flask import send_from_directory

@app.route("/uploads/<path:filename>")
def get_uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

    
# In-memory data simulation
categories = ["coffee", "tea"]
addons = []
sizes = []
roles = []

# ---------------- CATEGORY ROUTES ----------------

@app.route("/api/categories", methods=["GET"])
def get_categories():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM categories")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    # psycopg2 returns tuples, so we manually map to dict
    columns = ["id", "name"]
    data = [dict(zip(columns, row)) for row in rows]
    return jsonify(data)

@app.route("/api/categories", methods=["POST"])
def add_category():
    data = request.get_json()
    name = data.get("name")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO categories (name) VALUES (%s)", (name))

    new_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": new_id,"name": name})

@app.route("/api/categories/<string:name>", methods=["PUT"])
def update_category(name):
    try:
        data = request.get_json()
        new_name = data.get("newName")

        if not new_name:
            return jsonify({"error": "New category name required"}), 400

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE categories SET name = %s WHERE name = %s RETURNING name, id",
            (new_name, name)
        )
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if not updated:
            return jsonify({"error": "Category not found"}), 404

        return jsonify({"message": "Category updated", "category": updated[0]}), 200

    except Exception as e:
        print("Error updating category:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/api/categories/<int:id>", methods=["DELETE"])
def delete_category(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM categories WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Category deleted"})


# ---------------- ADDONS ROUTES ----------------

@app.route("/api/addons", methods=["GET"])
def get_addons():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM addons")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    columns = ["id", "name", "price", "category"]
    data = [dict(zip(columns, row)) for row in rows]
    return jsonify(data)

@app.route("/api/addons", methods=["POST"])
def add_addon():
    data = request.get_json()
    name = data.get("name")
    price = data.get("price", 0)
    category = data.get("category")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO addons (name, price, category) VALUES (%s, %s, %s) RETURNING id", (name, price, category))
    
    new_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id" : new_id,"name": name,"price": price,"category": category})

@app.route("/api/addons/<int:addon_id>", methods=["PUT"])
def update_addon(addon_id):
    data = request.get_json()
    name = data.get("name")
    price = data.get("price", 0)
    category = data.get("category")

    conn = get_connection()
    cur = conn.cursor()

    # Update the record
    cur.execute(
        "UPDATE addons SET name = %s, price = %s, category = %s WHERE id = %s RETURNING id, name, price, category",
        (name, price, category, addon_id)
    )

    updated = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    # If no record was updated (invalid id)
    if not updated:
        return jsonify({"error": "Addon not found"}), 404

    # Return updated data
    return jsonify({
        "id": updated[0],
        "name": updated[1],
        "price": updated[2],
        "category": updated[3]
    }), 200


@app.route("/api/addons/<int:id>", methods=["DELETE"])
def delete_addon(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM addons WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Addon deleted"})


# ---------------- SIZES ROUTES ----------------

@app.route("/api/sizes", methods=["GET"])
def get_sizes():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM sizes")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    columns = ["id", "name", "price", "category"]
    data = [dict(zip(columns, row)) for row in rows]
    return jsonify(data)

@app.route("/api/sizes", methods=["POST"])
def add_size():
    data = request.get_json()
    name = data.get("name")
    price = data.get("price", 0)
    category = data.get("category")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO sizes (name, price, category) VALUES (%s, %s, %s) RETURNING id", (name, price, category))
    
    new_id = cur.fetchone()[0]

    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"id": new_id,"name": name,"price": price, "category": category})

@app.route("/api/sizes/<int:size_id>", methods=["PUT"])
def update_size(size_id):
    data = request.get_json()
    name = data.get("name")
    price = data.get("price", 0)
    category = data.get("category")

    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        UPDATE sizes
        SET name = %s, price = %s, category = %s
        WHERE id = %s
        RETURNING id
    """, (name, price, category, size_id))
    
    updated = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    if not updated:
        return jsonify({"error": "Size not found"}), 404

    return jsonify({
        "id": size_id,
        "name": name,
        "price": price,
        "category": category
    })


@app.route("/api/sizes/<int:id>", methods=["DELETE"])
def delete_size(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM sizes WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Size deleted"})


# ---------------- ROLES ROUTES ----------------
@app.route("/api/roles", methods=["POST"])
def add_role():
    data = request.get_json()
    name = data.get("name")
    access = data.get("access", [])  # Expecting an array

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO roles (name, access) VALUES (%s, %s) RETURNING id, name, access",
        (name, access),  # pass the Python list directly
    )
    new_id, new_name, new_access = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    return jsonify({
        "id": new_id,
        "name": new_name,
        "access": new_access
    })


@app.route("/api/roles", methods=["GET"])
def get_roles():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM roles")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    columns = ["id", "name", "access"]
    data = [dict(zip(columns, row)) for row in rows]
    return jsonify(data)

@app.route("/api/roles/<int:role_id>", methods=["PUT"])
def update_role(role_id):
    data = request.get_json()
    name = data.get("name")
    access = data.get("access", [])

    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "UPDATE roles SET name = %s, access = %s WHERE id = %s RETURNING id, name, access",
        (name, access, role_id),
    )
    updated = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()

    if updated:
        return jsonify({
            "message": "Role updated",
            "role": {"id": updated[0], "name": updated[1], "access": updated[2]},
        })
    else:
        return jsonify({"message": "Role not found"}), 404

@app.route("/api/roles/<int:id>", methods=["DELETE"])
def delete_role(id):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM roles WHERE id = %s", (id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"message": "Role deleted"})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(debug=os.getenv("FLASK_DEBUG") == "True", port=port)
