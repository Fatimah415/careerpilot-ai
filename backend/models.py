from backend.app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    target_role = db.Column(db.String(120))
    location = db.Column(db.String(120))
    work_preference = db.Column(db.String(20))
    bio = db.Column(db.Text)
    profile_updated_at = db.Column(db.DateTime)

    cvs = db.relationship("CV", backref="user", lazy=True, cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "target_role": self.target_role,
            "location": self.location,
            "work_preference": self.work_preference,
            "bio": self.bio,
        }


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    company = db.Column(db.String(200), nullable=False)
    location = db.Column(db.String(200))
    description = db.Column(db.Text, nullable=False)
    required_skills = db.Column(db.JSON, default=list)
    posted_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "description": self.description,
            "required_skills": self.required_skills,
            "posted_at": self.posted_at.isoformat() if self.posted_at else None,
        }


class CV(db.Model):
    __tablename__ = "cvs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    parsed_text = db.Column(db.Text)
    parsed_skills = db.Column(db.JSON, default=list)
    sections_present = db.Column(db.JSON, default=dict)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
