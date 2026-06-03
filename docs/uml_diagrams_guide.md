# UML Diagrams Guide — CareerPilot AI
# Create these in https://app.diagrams.net and save as PNG in docs/

---

## Diagram 1 — Use Case Diagram
Save as: docs/uml_1_use_case.png

Actor: Candidate (stick figure, left side)
System boundary box: "CareerPilot AI"

Use cases (ovals inside the box):
- Register
- Login
- Update Profile
- Upload CV
- View Parsed CV & Skills
- View Job Recommendations
- View ATS Score
- Browse Jobs
- Search Jobs
- Logout

Lines: Candidate → each use case

---

## Diagram 2 — Class Diagram
Save as: docs/uml_2_class.png

Classes:

User
----------
- id: Integer (PK)
- email: String
- password_hash: String
- full_name: String
- target_role: String
- location: String
- work_preference: String
- bio: Text
- created_at: DateTime
----------
+ set_password(pw)
+ check_password(pw): bool
+ to_dict(): dict

CV
----------
- id: Integer (PK)
- user_id: Integer (FK)
- file_path: String
- parsed_text: Text
- parsed_skills: JSON
- sections_present: JSON
- uploaded_at: DateTime

Job
----------
- id: Integer (PK)
- title: String
- company: String
- location: String
- description: Text
- required_skills: JSON
- posted_at: DateTime
----------
+ to_dict(): dict

Relationships:
- User "1" ---< "many" CV  (one user has many CVs)
- Job "1" ---< "many" Match (one job has many matches)
- CV "1" ---< "many" Match

---

## Diagram 3 — Sequence Diagram (CV Upload Flow)
Save as: docs/uml_3_sequence.png

Lifelines: User | Frontend (React) | Backend API (Flask) | Parser | Trie | Database

Sequence:
1. User → Frontend: drop PDF file
2. Frontend → API: POST /api/cv/upload (multipart/form-data + JWT)
3. API → API: validate file (PDF? < 5MB? not empty?)
4. API → Filesystem: save PDF with unique name
5. API → Parser: parse_cv(file_path)
6. Parser → Parser: pdfplumber extracts raw text
7. Parser → Trie: extract_skills(text)
8. Trie → Parser: return [list of skills]
9. Parser → Parser: spaCy NER for entities
10. Parser → Parser: regex detect sections
11. Parser → API: return parsed dict {skills, entities, sections_present}
12. API → Database: INSERT INTO cvs (skills, text, sections_present)
13. API → Frontend: 201 {cv_id, skills, text_length}
14. Frontend → User: render detected skills + trigger recommendations refresh

---

## Diagram 4 — ER Diagram
Save as: docs/uml_4_er.png

Entities (rectangles):
- USERS (id PK, email, password_hash, full_name, target_role, location, work_preference, bio)
- CVS (id PK, user_id FK, file_path, parsed_text, parsed_skills, sections_present, uploaded_at)
- JOBS (id PK, title, company, location, description, required_skills, posted_at)

Relationships:
- USERS ||--o{ CVS : "uploads" (one user, zero or many CVs)
- CVS }o--|| USERS : "belongs to"

Note: Matching is computed at runtime (not stored), so no Match table.

---

## Diagram 5 — Component / Architecture Diagram
Save as: docs/uml_5_component.png

Three boxes:

[Frontend — React + Vite (Vercel)]
  Components: LoginPage, SignupPage, DashboardPage,
              JobsPage, NavBar, CVUpload, ProfileEditor,
              RecommendationsView, ATSScoreView, JobCard

[Backend — Flask API (Render)]
  Modules: auth routes, cv routes, jobs routes,
           recommendations, ats endpoint,
           parser.py, matcher.py, ats.py, trie.py

[Storage — SQLite + Filesystem]
  Files: careerpilot.db, uploads/

Arrows:
- Frontend → Backend: HTTPS REST (JWT in header)
- Backend → Storage: SQLAlchemy ORM (internal)
- Backend → Storage: file I/O for PDF uploads
