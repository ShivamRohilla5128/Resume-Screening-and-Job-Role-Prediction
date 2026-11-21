"""Skill-gap analysis and a roadmap generated from the candidate's actual missing skills."""
from app.services.reference import get_role
from ml.preprocessing.skills_vocab import skill_meta

WEEKS = {"beginner": 2, "intermediate": 3, "advanced": 4}
FOCUS = {"Programming": "Practise daily with small exercises, then apply the skill in a mini project.",
         "Data": "Work through a public dataset end-to-end and write up your findings.",
         "Analytics": "Rebuild a real-world report or dashboard from open data.",
         "Business": "Practise on a case study and produce the artefacts (requirements, user stories, diagrams).",
         "Web": "Build and deploy a small site or UI feature using the skill.",
         "Backend": "Build a small service with tests and documentation.",
         "Database": "Set up a local database and practise the task hands-on.",
         "Cloud & DevOps": "Use a free-tier account or local VM/containers to practise.",
         "Security": "Use legal lab environments (CTF platforms, home labs) only."}
PROJECTS = [
 ("Customer churn predictor", "Train and compare classifiers on a public churn dataset and expose predictions through an API.", ["Python", "Scikit-learn", "Pandas", "Machine Learning", "FastAPI"]),
 ("Interactive sales dashboard", "Clean a public sales dataset with SQL/Excel and publish a KPI dashboard.", ["Excel", "SQL", "Power BI", "Data Visualization", "Data Analysis", "Tableau"]),
 ("Deep-learning image classifier", "Fine-tune a CNN on a public image dataset and containerise the inference service.", ["TensorFlow", "Deep Learning", "Docker", "Python", "Computer Vision", "PyTorch"]),
 ("NLP text classifier", "Build a text-classification app with a TF-IDF baseline and a transformer comparison.", ["NLP", "Python", "Scikit-learn", "PyTorch", "Feature Engineering", "Deep Learning"]),
 ("Model deployment with MLOps", "Track experiments and deploy a model behind an API with monitoring.", ["MLOps", "Docker", "Kubernetes", "Machine Learning", "Monitoring", "AWS"]),
 ("A/B test analysis report", "Analyse an A/B test dataset with hypothesis tests and write up conclusions.", ["Statistics", "Python", "Pandas", "Data Visualization", "R"]),
 ("Big-data ETL pipeline", "Build and schedule an ETL job on a public dataset with Spark.", ["Spark", "ETL", "Hadoop", "SQL", "Python", "Data Cleaning"]),
 ("REST API with auth and tests", "Build a CRUD API with JWT auth, a relational database and automated tests.", ["REST APIs", "SQL", "Testing", "Git", "Django", "Flask", "FastAPI", "PostgreSQL"]),
 ("Spring Boot microservice", "Create a Spring Boot service with JPA/Hibernate persistence and REST endpoints.", ["Java", "Spring Boot", "Hibernate", "REST APIs", "OOP", "Microservices", "MySQL"]),
 ("Responsive portfolio site", "Design and deploy a mobile-first multi-page site.", ["HTML", "CSS", "JavaScript", "Responsive Design", "Tailwind CSS", "Bootstrap", "Git"]),
 ("React app with state management", "Build a component-driven app with state management and tests.", ["React", "Redux", "TypeScript", "JavaScript", "Testing", "Next.js", "Vue.js", "Angular"]),
 ("Full stack app", "Ship an app with auth, REST API, database and deployment.", ["Node.js", "Express.js", "MongoDB", "React", "REST APIs", "JavaScript", "Docker", "GraphQL"]),
 ("CI/CD pipeline for a sample app", "Containerise an app and automate build, test and deployment.", ["Docker", "CI/CD", "Jenkins", "Git", "Linux", "Kubernetes", "Bash"]),
 ("Infrastructure-as-code lab", "Provision a 3-tier network and compute stack as code and monitor it.", ["Terraform", "AWS", "Azure", "GCP", "Cloud Computing", "Networking", "Infrastructure as Code", "Monitoring", "Ansible", "Serverless"]),
 ("Home SOC lab", "Collect logs, write detection rules and document incident responses.", ["SIEM", "Cybersecurity", "Incident Response", "Network Security", "Linux", "Vulnerability Assessment"]),
 ("Web app security assessment", "Assess a deliberately vulnerable app against the OWASP Top 10 and report findings.", ["OWASP", "Penetration Testing", "Vulnerability Assessment", "Cryptography"]),
 ("Database backup & tuning exercise", "Set up a database, schedule backups, test a restore and tune slow queries.", ["Database Administration", "Backup and Recovery", "Performance Tuning", "MySQL", "PostgreSQL", "SQL", "Oracle", "Database Design", "NoSQL", "Redis"]),
 ("Requirements pack for a mock product", "Write requirements, user stories and process models for a case study.", ["Requirements Gathering", "Business Analysis", "Stakeholder Management", "Agile", "JIRA", "Process Modeling"]),
 ("Algorithms & data-structures toolkit", "Implement core data structures with unit tests and complexity notes.", ["Data Structures", "OOP", "Testing", "Problem Solving", "C++", "Java", "Python", "Git"]),
]


def gap_analysis(info, job_role):
    role = get_role(job_role)
    if not role:
        raise ValueError(f"Unknown job role '{job_role}'")
    have = set(info["skills"])
    req_have = [s for s in role["required"] if s in have]
    opt_have = [s for s in role["optional"] if s in have]
    miss_req = [s for s in role["required"] if s not in have]
    miss_opt = [s for s in role["optional"] if s not in have]
    meta = lambda lst: [skill_meta(s) for s in lst]
    recommended = meta(miss_req + miss_opt)
    levels = {lv: [m["skill"] for m in recommended if m["level"] == lv] for lv in ("beginner", "intermediate", "advanced")}
    req_set = set(miss_req)

    roadmap = []
    titles = {"beginner": "Phase 1 - Foundations", "intermediate": "Phase 2 - Core skills", "advanced": "Phase 3 - Advanced"}
    for lv in ("beginner", "intermediate", "advanced"):
        skills = sorted(levels[lv], key=lambda s: (s not in req_set, s))
        if skills:
            cats = {skill_meta(s)["category"] for s in skills}
            roadmap.append({"phase": titles[lv], "level": lv, "skills": skills, "required": [s for s in skills if s in req_set],
                            "weeks": sum(WEEKS[lv] for _ in skills), "focus": " ".join(FOCUS.get(c, "") for c in sorted(cats)).strip()})
    # greedy project selection: most missing skills covered (required counted double)
    remaining, projects = set(miss_req + miss_opt), []
    for _ in range(4):
        best = max(PROJECTS, key=lambda p: sum(2 if s in req_set else 1 for s in p[2] if s in remaining) if p[0] not in [x["title"] for x in projects] else -1)
        gain = [s for s in best[2] if s in remaining]
        if not gain:
            break
        projects.append({"title": best[0], "description": best[1], "skills": gain})
        remaining -= set(gain)
    pct = lambda a, b: round(100 * a / b) if b else 100
    return {"job_role": role["role"], "existing": meta(req_have + opt_have), "missing_required": meta(miss_req), "missing_optional": meta(miss_opt),
            "recommended": recommended, "levels": levels, "roadmap": roadmap, "projects": projects,
            "coverage": {"required": pct(len(req_have), len(role["required"])), "optional": pct(len(opt_have), len(role["optional"]))},
            "total_weeks": sum(r["weeks"] for r in roadmap)}
