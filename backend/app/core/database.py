import os
import psycopg2
from psycopg2.extras import RealDictCursor
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("NEON_URL")

def get_connection():
    if not DATABASE_URL:
        raise ValueError("NEON_URL no está configurada en las variables de entorno.")
    
    # psycopg2 needs the scheme to be postgresql:// instead of postgres:// sometimes, but Neon URLs usually work fine.
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Usuarios
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR UNIQUE NOT NULL,
            pin VARCHAR NOT NULL,
            role VARCHAR DEFAULT 'operador'
        )
    ''')

    # Categorías
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR UNIQUE NOT NULL
        )
    ''')

    # Zonas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS zones (
            id SERIAL PRIMARY KEY,
            name VARCHAR UNIQUE NOT NULL,
            description VARCHAR
        )
    ''')

    # Destinos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS destinations (
            id SERIAL PRIMARY KEY,
            name VARCHAR UNIQUE NOT NULL
        )
    ''')

    # Productos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR UNIQUE NOT NULL,
            unit VARCHAR DEFAULT 'Unds',
            zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
            category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
            prefix VARCHAR DEFAULT 'PAQ',
            min_stock REAL DEFAULT 10,
            max_stock REAL DEFAULT 100,
            created_at VARCHAR,
            is_active INTEGER DEFAULT 1
        )
    ''')

    # Lotes Activos (Inventory Lots)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS active_lots (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            lot_code VARCHAR NOT NULL UNIQUE,
            qty REAL NOT NULL CHECK(qty >= 0),
            unit_cost REAL NOT NULL CHECK(unit_cost >= 0),
            expiration_date VARCHAR,
            status VARCHAR DEFAULT 'Disponible'
        )
    ''')

    # Historial de Movimientos (Kardex Rows)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS kardex_movements (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            date VARCHAR NOT NULL,
            lot_code VARCHAR,
            type VARCHAR,
            concept VARCHAR,
            document VARCHAR,
            origin_dest VARCHAR,
            expiration_date VARCHAR,
            qty REAL,
            unit_cost REAL,
            total_cost REAL,
            balance_qty REAL,
            balance_total REAL,
            "user" VARCHAR DEFAULT 'Desconocido',
            lot_status VARCHAR DEFAULT 'Disponible',
            real_timestamp VARCHAR,
            out_of_hours INTEGER DEFAULT 0
        )
    ''')

    # Historial de Recepciones Masivas y Despachos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS document_history (
            id SERIAL PRIMARY KEY,
            "user" VARCHAR,
            doc_type VARCHAR,
            doc_number VARCHAR,
            date VARCHAR,
            products VARCHAR,
            status VARCHAR,
            origen_global VARCHAR DEFAULT '',
            motivo_global VARCHAR DEFAULT ''
        )
    ''')

    # Recetas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS recipes (
            id SERIAL PRIMARY KEY,
            name VARCHAR UNIQUE NOT NULL,
            description VARCHAR,
            items_json VARCHAR
        )
    ''')

    # Bandeja de Entrada de Mensajes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            sender VARCHAR NOT NULL,
            receiver VARCHAR DEFAULT 'ADMIN',
            date VARCHAR NOT NULL,
            reason VARCHAR,
            doc_reference VARCHAR,
            body VARCHAR,
            status VARCHAR DEFAULT 'PENDING'
        )
    ''')

    # Auditar acciones críticas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            "user" VARCHAR NOT NULL,
            action VARCHAR NOT NULL,
            target VARCHAR,
            details VARCHAR,
            timestamp VARCHAR NOT NULL
        )
    ''')

    # Initial Admin - REMOVED legacy pin creation to prevent crashing on Neon database where pin column is now password.
    # Users are managed securely with bcrypt hashes.

    conn.commit()
    conn.close()
