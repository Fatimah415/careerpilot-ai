from flask import Flask, jsonify, request, current_app
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from dotenv import load_dotenv
import json
import os
import uuid

load_dotenv()

db = SQLAlchemy()

ALLOWED_EXTENSIONS = {"pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def _allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def create_app():
    app = Flask(__name__)

    # Configuration
    _base_dir = os.path.dirname(os.path.abspath(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{os.path.join(_base_dir, 'careerpilot.db')}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.environ.get("JWT_SECRET_KEY", "dev-secret-change-in-prod")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=1)
    app.config["UPLOAD_FOLDER"] = os.path.join(os.path.dirname(__file__), "uploads")
    app.config["MAX_CONTENT_LENGTH"] = MAX_FILE_SIZE

    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # Initialize extensions
    allowed_origins = os.environ.get("CORS_ORIGINS", "*").split(",")
    CORS(app, origins=allowed_origins)
    JWTManager(app)
    db.init_app(app)

    # Import models BEFORE create_all so SQLAlchemy registers all tables
    from backend.models import User, Job, CV
    from backend.matching import skill_overlap
    from backend.parser import parse_cv

    with app.app_context():
        db.create_all()
        if Job.query.count() == 0:
            seed_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "seed_jobs.json")
            if os.path.exists(seed_path):
                with open(seed_path, "r", encoding="utf-8") as f:
                    jobs_data = json.load(f)
                for jd in jobs_data:
                    db.session.add(Job(
                        title=jd["title"],
                        company=jd["company"],
                        location=jd.get("location"),
                        description=jd["description"],
                        required_skills=jd.get("required_skills", []),
                    ))
                db.session.commit()
                print(f"[ok] Seeded {len(jobs_data)} jobs")
        print("[ok] Database initialized")

    # ------------------------------------------------------------------ #
    #  Core / Auth                                                         #
    # ------------------------------------------------------------------ #

    @app.route("/api/ping", methods=["GET"])
    def ping():
        return jsonify({"message": "pong", "service": "CareerPilot AI"})

    @app.route("/api/register", methods=["POST"])
    def register():
        data = request.get_json()

        if not data or not data.get("email") or not data.get("password"):
            return jsonify({"error": "Email and password required"}), 400

        if not data.get("full_name"):
            return jsonify({"error": "full_name required"}), 400

        if User.query.filter_by(email=data["email"]).first():
            return jsonify({"error": "User already exists"}), 400

        user = User(email=data["email"], full_name=data["full_name"])
        user.set_password(data["password"])

        db.session.add(user)
        db.session.commit()

        access_token = create_access_token(identity=str(user.id))
        return jsonify({"user": user.to_dict(), "token": access_token}), 201

    @app.route("/api/login", methods=["POST"])
    def login():
        data = request.get_json()

        if not data:
            return jsonify({"error": "Email and password required"}), 400

        user = User.query.filter_by(email=data.get("email")).first()

        if not user or not user.check_password(data.get("password", "")):
            return jsonify({"error": "Invalid credentials"}), 401

        access_token = create_access_token(identity=str(user.id))
        return jsonify({"token": access_token, "user": user.to_dict()})

    # ------------------------------------------------------------------ #
    #  Profile                                                             #
    # ------------------------------------------------------------------ #

    @app.route("/api/me", methods=["GET"])
    @jwt_required()
    def get_me():
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user.to_dict())

    @app.route("/api/me", methods=["PUT"])
    @jwt_required()
    def update_me():
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json() or {}

        # Allowlist — never let users touch email, password_hash, or id here
        EDITABLE = {"target_role", "location", "work_preference", "bio", "full_name"}

        if "work_preference" in data:
            if data["work_preference"] not in {"remote", "onsite", "hybrid", None, ""}:
                return jsonify({"error": "work_preference must be remote, onsite, or hybrid"}), 422

        changed = []
        for field in EDITABLE:
            if field in data:
                setattr(user, field, data[field])
                changed.append(field)

        if not changed:
            return jsonify({"error": "No valid fields provided"}), 422

        user.profile_updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({"user": user.to_dict(), "updated_fields": changed})

    # ------------------------------------------------------------------ #
    #  Jobs                                                                #
    # ------------------------------------------------------------------ #

    @app.route("/api/jobs", methods=["GET"])
    def list_jobs():
        jobs = Job.query.order_by(Job.posted_at.desc()).all()
        return jsonify({"jobs": [job.to_dict() for job in jobs]})

    @app.route("/api/jobs/<int:job_id>", methods=["GET"])
    def get_job(job_id):
        job = Job.query.get(job_id)
        if not job:
            return jsonify({"error": "Job not found"}), 404
        return jsonify(job.to_dict())

    # ------------------------------------------------------------------ #
    #  Debug                                                               #
    # ------------------------------------------------------------------ #

    @app.route("/api/debug/overlap", methods=["POST"])
    def debug_overlap():
        data = request.get_json() or {}
        cv_skills = data.get("cv_skills", [])
        job_id = data.get("job_id")

        if not job_id:
            return jsonify({"error": "job_id required"}), 422

        job = Job.query.get(job_id)
        if not job:
            return jsonify({"error": "Job not found"}), 404

        result = skill_overlap(cv_skills, job.required_skills)
        result["job_title"] = job.title
        return jsonify(result)

    # ------------------------------------------------------------------ #
    #  CV Upload & Parsing                                                 #
    # ------------------------------------------------------------------ #

    @app.route("/api/cv/upload", methods=["POST"])
    @jwt_required()
    def upload_cv():
        user_id = int(get_jwt_identity())

        if "file" not in request.files:
            return jsonify({"error": "No file in request. Use form field 'file'."}), 422

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"error": "Empty filename"}), 422

        if not _allowed_file(file.filename):
            return jsonify({"error": "Only PDF files are allowed"}), 422

        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        if file_size > MAX_FILE_SIZE:
            return jsonify({"error": "File too large. Max 5 MB."}), 422

        if file_size == 0:
            return jsonify({"error": "File is empty"}), 422

        safe_name = secure_filename(file.filename)
        unique_name = f"{user_id}_{uuid.uuid4().hex[:8]}_{safe_name}"
        upload_dir = current_app.config["UPLOAD_FOLDER"]
        save_path = os.path.join(upload_dir, unique_name)
        file.save(save_path)

        parsed = parse_cv(save_path)

        if not parsed["parse_success"]:
            os.remove(save_path)
            return jsonify({
                "error": "Could not parse PDF. It may be a scanned image or corrupted.",
                "hint": "Try a text-based PDF (one you can copy text from).",
            }), 422

        cv = CV(
            user_id=user_id,
            file_path=save_path,
            parsed_text=parsed["raw_text"],
            parsed_skills=parsed["skills"],
        )
        db.session.add(cv)
        db.session.commit()

        return jsonify({
            "cv_id": cv.id,
            "skills": parsed["skills"],
            "entities": parsed["entities"],
            "sections_present": parsed["sections_present"],
            "text_length": parsed["text_length"],
            "message": "CV parsed and saved successfully",
        }), 201

    @app.route("/api/cv/me", methods=["GET"])
    @jwt_required()
    def get_my_cv():
        user_id = int(get_jwt_identity())
        cv = (CV.query
              .filter_by(user_id=user_id)
              .order_by(CV.uploaded_at.desc())
              .first())

        if not cv:
            return jsonify({"error": "No CV uploaded yet"}), 404

        return jsonify({
            "cv_id": cv.id,
            "skills": cv.parsed_skills or [],
            "uploaded_at": cv.uploaded_at.isoformat(),
            "text_length": len(cv.parsed_text or ""),
        })

    return app
