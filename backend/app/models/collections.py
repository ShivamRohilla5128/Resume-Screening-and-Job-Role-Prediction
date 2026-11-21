"""MongoDB collection reference (documents are plain dicts; PyMongo is schemaless).

users             {name, email (unique), password_hash (PBKDF2-SHA256), created_at}
resumes           {user_id, filename, size, raw_text, char_count, created_at, expires_at (TTL: RESUME_RETENTION_DAYS)}
analysis_results  {user_id, resume_id, filename, kind: single|screening, screening_id?, info, prediction, review, match?, gap?,
                   created_at, expires_at (TTL: ANALYSIS_RETENTION_DAYS)}      # prediction.model = ML evaluation reference (name, dataset, is_synthetic)
job_roles         {role, required[], optional[]}                               # seeded from ml/datasets/skills_reference.csv at startup
job_descriptions  {user_id, job_role, text, required_skills[], created_at}
screening_sessions{user_id, job_role, job_description, required_skills[], results[{analysis_id,name,match_score,rank}], created_at}
"""
COLLECTIONS = ("users", "resumes", "analysis_results", "job_roles", "job_descriptions", "screening_sessions")
