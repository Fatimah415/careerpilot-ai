from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import json
import os

db = SQLAlchemy()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///careerpilot.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'your-secret-key-change-this'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=1)
    
    # Initialize extensions
    CORS(app, origins="*")
    jwt = JWTManager(app)
    db.init_app(app)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    # Import models here to avoid circular imports
    from backend.models import User, Job
    
    # Routes
    @app.route('/api/ping', methods=['GET'])
    def ping():
        return jsonify({'message': 'pong', 'service': 'CareerPilot AI'})
    
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.get_json()
        
        if not data or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Email and password required'}), 400
        
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'User already exists'}), 400
        
        user = User(
            email=data['email'],
            full_name=data.get('full_name', ''),
            password_hash=data['password']
        )
        
        db.session.add(user)
        db.session.commit()
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name
            },
            'token': access_token
        }), 201
    
    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Email and password required'}), 400
        
        user = User.query.filter_by(email=data.get('email')).first()
        
        if not user or user.password_hash != data.get('password'):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'token': access_token,
            'user': {
                'id': user.id,
                'email': user.email,
                'full_name': user.full_name
            }
        })
    
    @app.route('/api/jobs', methods=['GET'])
    def list_jobs():
        jobs = Job.query.order_by(Job.posted_at.desc()).all()
        return jsonify({'jobs': [job.to_dict() for job in jobs]})
    
    @app.route('/api/jobs/<int:job_id>', methods=['GET'])
    def get_job(job_id):
        job = Job.query.get(job_id)
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        return jsonify(job.to_dict())
    
    return app