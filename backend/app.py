from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token
import sqlite3
from datetime import timedelta

app = Flask(__name__)

# THIS IS THE FIX - Allow frontend to talk to backend
CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

app.config['JWT_SECRET_KEY'] = 'secret-key'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
jwt = JWTManager(app)

def init_db():
    conn = sqlite3.connect('careerpilot.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id INTEGER PRIMARY KEY AUTOINCREMENT,
                  email TEXT UNIQUE,
                  password TEXT,
                  full_name TEXT)''')
    conn.commit()
    conn.close()

init_db()

@app.route('/api/ping', methods=['GET'])
def ping():
    return jsonify({'message': 'pong', 'service': 'CareerPilot AI'})

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    full_name = data.get('full_name')
    
    conn = sqlite3.connect('careerpilot.db')
    c = conn.cursor()
    
    c.execute("SELECT * FROM users WHERE email = ?", (email,))
    if c.fetchone():
        conn.close()
        return jsonify({'error': 'User already exists'}), 400
    
    c.execute("INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)",
              (email, password, full_name))
    conn.commit()
    user_id = c.lastrowid
    conn.close()
    
    token = create_access_token(identity=user_id)
    
    return jsonify({
        'user': {'id': user_id, 'email': email, 'full_name': full_name},
        'token': token
    }), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    
    conn = sqlite3.connect('careerpilot.db')
    c = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = ? AND password = ?", (email, password))
    user = c.fetchone()
    conn.close()
    
    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401
    
    token = create_access_token(identity=user[0])
    
    return jsonify({
        'token': token,
        'user': {'id': user[0], 'email': user[1], 'full_name': user[3]}
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)