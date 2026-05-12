from backend.app import create_app, db
from backend.models import Job
import json
import os

app = create_app()

def seed_jobs():
    with app.app_context():
        if Job.query.count() > 0:
            print(f"✅ Jobs already seeded ({Job.query.count()} jobs)")
            return
        
        seed_path = os.path.join(os.path.dirname(__file__), "backend", "seed_jobs.json")
        if not os.path.exists(seed_path):
            print("❌ seed_jobs.json not found")
            return
        
        with open(seed_path, "r") as f:
            jobs = json.load(f)
        
        for job_data in jobs:
            job = Job(
                title=job_data["title"],
                company=job_data["company"],
                location=job_data.get("location", ""),
                description=job_data["description"],
                required_skills=job_data.get("required_skills", [])
            )
            db.session.add(job)
        
        db.session.commit()
        print(f"✅ Seeded {len(jobs)} jobs")

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_jobs()
    app.run(debug=True, port=5001)