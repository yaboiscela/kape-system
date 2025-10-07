from flask import Flask, request, jsonify, abort
import psycopg2
import psycopg2.extras
from psycopg2 import sql
import os

app = Flask(__name__)

# Configure via env vars or hardcode for dev
DB_CONFIG = {
    "dbname": os.getenv("PG_DB", "kape_db"),
    "user": os.getenv("PG_USER", "postgres"),
    "password": os.getenv("PG_PASS", "postgres"),
    "host": os.getenv("PG_HOST", "localhost"),
    "port": os.getenv("PG_PORT", "5432"),
}

def get_conn():
    return psycopg2.connect(**DB_CONFIG)

def row_to_dict(row):
    if not row:
        return None
    return dict(row)

# ---------- Categories ----------
@app.route("/api/categories", methods=["GET"])
def get_categories():
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id, name FROM categories ORDER BY name;")
            rows = cur.fetchall()
            return jsonify(rows)

@app.route("/api/categories", methods=["POST"])
def create_category():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return abort(400, "name required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO categories (name) VALUES (%s) RETURNING id, name;", (name,))
            row = cur.fetchone()
            conn.commit()
            return jsonify({"id": row[0], "name": row[1]}), 201

@app.route("/api/categories", methods=["PUT"])
def update_category():
    data = request.get_json() or {}
    old = (data.get("oldName") or data.get("old") or "").strip()
    new = (data.get("newName") or data.get("value") or "").strip()
    if not old or not new:
        return abort(400, "oldName and newName required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE categories SET name=%s WHERE name=%s RETURNING id, name;", (new, old))
            row = cur.fetchone()
            if not row:
                return abort(404, "category not found")
            # Also update related addons/sizes if they reference name strings (if you store category as text)
            conn.commit()
            return jsonify({"id": row[0], "name": row[1]})

@app.route("/api/categories", methods=["DELETE"])
def delete_category():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return abort(400, "name required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            # Validate no addons/sizes reference it
            cur.execute("SELECT 1 FROM addons WHERE category=%s LIMIT 1;", (name,))
            if cur.fetchone():
                return abort(400, "category is referenced by addons")
            cur.execute("SELECT 1 FROM sizes WHERE category=%s LIMIT 1;", (name,))
            if cur.fetchone():
                return abort(400, "category is referenced by sizes")
            cur.execute("DELETE FROM categories WHERE name=%s RETURNING id;", (name,))
            row = cur.fetchone()
            if not row:
                return abort(404, "category not found")
            conn.commit()
            return jsonify({"deleted_id": row[0]})

# ---------- Addons ----------
@app.route("/api/addons", methods=["GET"])
def get_addons():
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id, name, price, category FROM addons ORDER BY name;")
            return jsonify(cur.fetchall())

@app.route("/api/addons", methods=["POST"])
def create_addon():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    price = data.get("price")
    category = (data.get("category") or "").strip()
    if not name or price is None or category == "":
        return abort(400, "name, price, category required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO addons (name, price, category) VALUES (%s,%s,%s) RETURNING id, name, price, category;", (name, price, category))
            row = cur.fetchone()
            conn.commit()
            return jsonify(dict(id=row[0], name=row[1], price=row[2], category=row[3])), 201

@app.route("/api/addons/<int:aid>", methods=["PUT"])
def update_addon(aid):
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    price = data.get("price")
    category = (data.get("category") or "").strip()
    if not name or price is None or category == "":
        return abort(400, "name, price, category required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE addons SET name=%s, price=%s, category=%s WHERE id=%s RETURNING id, name, price, category;", (name, price, category, aid))
            row = cur.fetchone()
            if not row:
                return abort(404, "addon not found")
            conn.commit()
            return jsonify(dict(id=row[0], name=row[1], price=row[2], category=row[3]))

@app.route("/api/addons/<int:aid>", methods=["DELETE"])
def delete_addon(aid):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM addons WHERE id=%s RETURNING id;", (aid,))
            row = cur.fetchone()
            if not row:
                return abort(404, "addon not found")
            conn.commit()
            return jsonify({"deleted_id": row[0]})

# ---------- Sizes ----------
@app.route("/api/sizes", methods=["GET"])
def get_sizes():
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id, name, price, category FROM sizes ORDER BY name;")
            return jsonify(cur.fetchall())

@app.route("/api/sizes", methods=["POST"])
def create_size():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    price = data.get("price")
    category = (data.get("category") or "").strip()
    if not name or price is None or category == "":
        return abort(400, "name, price, category required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO sizes (name, price, category) VALUES (%s,%s,%s) RETURNING id, name, price, category;", (name, price, category))
            row = cur.fetchone()
            conn.commit()
            return jsonify(dict(id=row[0], name=row[1], price=row[2], category=row[3])), 201

@app.route("/api/sizes/<int:sid>", methods=["PUT"])
def update_size(sid):
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    price = data.get("price")
    category = (data.get("category") or "").strip()
    if not name or price is None or category == "":
        return abort(400, "name, price, category required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE sizes SET name=%s, price=%s, category=%s WHERE id=%s RETURNING id, name, price, category;", (name, price, category, sid))
            row = cur.fetchone()
            if not row:
                return abort(404, "size not found")
            conn.commit()
            return jsonify(dict(id=row[0], name=row[1], price=row[2], category=row[3]))

@app.route("/api/sizes/<int:sid>", methods=["DELETE"])
def delete_size(sid):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM sizes WHERE id=%s RETURNING id;", (sid,))
            row = cur.fetchone()
            if not row:
                return abort(404, "size not found")
            conn.commit()
            return jsonify({"deleted_id": row[0]})

# ---------- Roles ----------
@app.route("/api/roles", methods=["GET"])
def get_roles():
    with get_conn() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id, name, access FROM roles ORDER BY name;")
            rows = cur.fetchall()
            # access stored as text[] or JSON - convert appropriately
            return jsonify(rows)

@app.route("/api/roles", methods=["POST"])
def create_role():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    access = data.get("access") or []
    if not name:
        return abort(400, "name required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("INSERT INTO roles (name, access) VALUES (%s, %s) RETURNING id, name, access;", (name, access))
            row = cur.fetchone()
            conn.commit()
            return jsonify(dict(id=row[0], name=row[1], access=row[2])), 201

@app.route("/api/roles/<int:rid>", methods=["PUT"])
def update_role(rid):
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    access = data.get("access") or []
    if not name:
        return abort(400, "name required")
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE roles SET name=%s, access=%s WHERE id=%s RETURNING id, name, access;", (name, access, rid))
            row = cur.fetchone()
            if not row:
                return abort(404, "role not found")
            conn.commit()
            return jsonify(dict(id=row[0], name=row[1], access=row[2]))

@app.route("/api/roles/<int:rid>", methods=["DELETE"])
def delete_role(rid):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM roles WHERE id=%s RETURNING id;", (rid,))
            row = cur.fetchone()
            if not row:
                return abort(404, "role not found")
            conn.commit()
            return jsonify({"deleted_id": row[0]})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
