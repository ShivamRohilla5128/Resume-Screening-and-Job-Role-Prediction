"""Skill vocabulary (canonical name, aliases, difficulty level, category) + regex extractor.

Single source of truth used by training, the API and the skills reference dataset.
Row format:  Canonical | alias1,alias2,... | level | category
"""
import re

_RAW = """
Python|python|beginner|Programming
Java|java|intermediate|Programming
JavaScript|javascript,ecmascript|beginner|Programming
TypeScript|typescript|intermediate|Programming
C++|c++,cpp|intermediate|Programming
C#|c#,csharp|intermediate|Programming
C|c programming,c language|beginner|Programming
Go|golang|intermediate|Programming
R|r programming,r language,rstudio|beginner|Programming
Bash|bash,shell scripting,bash scripting|beginner|Programming
OOP|oop,object oriented,object-oriented,object oriented programming|beginner|Programming
Data Structures|data structures,algorithms,dsa|beginner|Programming
Problem Solving|problem solving,problem-solving|beginner|Programming
Testing|unit testing,pytest,junit,selenium,test automation|intermediate|Programming
SQL|sql,t-sql,pl/sql|beginner|Data
Statistics|statistics,statistical analysis,hypothesis testing|intermediate|Data
Machine Learning|machine learning,ml|intermediate|Data
Deep Learning|deep learning,neural networks|advanced|Data
NLP|nlp,natural language processing|advanced|Data
Computer Vision|computer vision,opencv|advanced|Data
Pandas|pandas|beginner|Data
NumPy|numpy|beginner|Data
Scikit-learn|scikit-learn,sklearn,scikit learn|intermediate|Data
TensorFlow|tensorflow|advanced|Data
PyTorch|pytorch|advanced|Data
Keras|keras|intermediate|Data
Data Visualization|data visualization,data visualisation,matplotlib,seaborn|beginner|Data
Feature Engineering|feature engineering|intermediate|Data
Data Cleaning|data cleaning,data wrangling,data preprocessing|beginner|Data
MLOps|mlops,mlflow|advanced|Data
Spark|spark,pyspark|advanced|Data
Hadoop|hadoop|advanced|Data
ETL|etl|intermediate|Data
Data Analysis|data analysis,data analytics|beginner|Analytics
Excel|excel,microsoft excel,advanced excel|beginner|Analytics
Power BI|power bi,powerbi|beginner|Analytics
Tableau|tableau|intermediate|Analytics
Requirements Gathering|requirements gathering,requirement gathering,requirements analysis|beginner|Business
Business Analysis|business analysis|beginner|Business
Stakeholder Management|stakeholder management,stakeholder engagement|intermediate|Business
Agile|agile,scrum,kanban|beginner|Business
JIRA|jira|beginner|Business
Process Modeling|process modeling,process modelling,bpmn,uml|intermediate|Business
HTML|html,html5|beginner|Web
CSS|css,css3|beginner|Web
React|react,react.js,reactjs|intermediate|Web
Angular|angular,angularjs|intermediate|Web
Vue.js|vue,vue.js,vuejs|intermediate|Web
Next.js|next.js,nextjs|advanced|Web
Redux|redux|intermediate|Web
Tailwind CSS|tailwind,tailwind css|beginner|Web
Bootstrap|bootstrap|beginner|Web
Responsive Design|responsive design,responsive web design|beginner|Web
Node.js|node.js,nodejs|intermediate|Backend
Express.js|express.js,expressjs|intermediate|Backend
Django|django|intermediate|Backend
Flask|flask|intermediate|Backend
FastAPI|fastapi|intermediate|Backend
Spring Boot|spring boot,springboot,spring framework|advanced|Backend
Hibernate|hibernate,jpa|advanced|Backend
REST APIs|restful,rest api,rest apis,restful api,restful apis|intermediate|Backend
GraphQL|graphql|advanced|Backend
Microservices|microservices,micro-services|advanced|Backend
MongoDB|mongodb,mongo db|intermediate|Database
MySQL|mysql|beginner|Database
PostgreSQL|postgresql,postgres|intermediate|Database
Oracle|oracle|intermediate|Database
Redis|redis|intermediate|Database
NoSQL|nosql|intermediate|Database
Database Design|database design,data modeling,data modelling,normalization|intermediate|Database
Database Administration|database administration,dba|intermediate|Database
Backup and Recovery|backup and recovery,disaster recovery,backup & recovery|intermediate|Database
Performance Tuning|performance tuning,query optimization,query optimisation,query tuning|advanced|Database
AWS|aws,amazon web services|intermediate|Cloud & DevOps
Azure|azure|intermediate|Cloud & DevOps
GCP|gcp,google cloud|intermediate|Cloud & DevOps
Cloud Computing|cloud computing|beginner|Cloud & DevOps
Docker|docker|intermediate|Cloud & DevOps
Kubernetes|kubernetes,k8s|advanced|Cloud & DevOps
Terraform|terraform|advanced|Cloud & DevOps
Ansible|ansible|advanced|Cloud & DevOps
Jenkins|jenkins|intermediate|Cloud & DevOps
CI/CD|ci/cd,cicd,continuous integration,continuous delivery|intermediate|Cloud & DevOps
Git|git,github,gitlab|beginner|Cloud & DevOps
Linux|linux,unix|beginner|Cloud & DevOps
Networking|networking,tcp/ip,dns|intermediate|Cloud & DevOps
Monitoring|monitoring,prometheus,grafana|intermediate|Cloud & DevOps
Infrastructure as Code|infrastructure as code,iac|advanced|Cloud & DevOps
Serverless|serverless,aws lambda|advanced|Cloud & DevOps
Cybersecurity|cybersecurity,cyber security,information security|beginner|Security
Network Security|network security,firewalls,firewall|intermediate|Security
Penetration Testing|penetration testing,pentesting,ethical hacking|advanced|Security
SIEM|siem,splunk|advanced|Security
Vulnerability Assessment|vulnerability assessment,vulnerability management|intermediate|Security
Incident Response|incident response|intermediate|Security
Cryptography|cryptography,encryption|advanced|Security
OWASP|owasp|intermediate|Security
"""

SKILLS = {}
for _line in _RAW.strip().splitlines():
    _name, _aliases, _level, _cat = [p.strip() for p in _line.split("|")]
    SKILLS[_name] = {"aliases": [a.strip().lower() for a in _aliases.split(",")], "level": _level, "category": _cat}

_ALIAS_TO_CANON = {}
for _n, _d in SKILLS.items():
    _ALIAS_TO_CANON[_n.lower()] = _n
    for _a in _d["aliases"]:
        _ALIAS_TO_CANON[_a] = _n

_PATTERNS = {}
for _n, _d in SKILLS.items():
    _alts = sorted(_d["aliases"], key=len, reverse=True)
    _PATTERNS[_n] = re.compile(
        r"(?<![A-Za-z0-9+#])(?:" + "|".join(re.escape(a) for a in _alts) + r")(?![A-Za-z0-9+#])", re.I
    )

# single-word aliases are protected from the lemmatizer ("pandas" must not become "panda")
PROTECTED_TOKENS = frozenset(a for a in _ALIAS_TO_CANON if " " not in a)


def normalize_skill(name):
    """Map a user-typed skill to its canonical name, or None if it is not in the vocabulary."""
    return _ALIAS_TO_CANON.get(name.strip().lower())


def extract_skills(text, with_counts=False):
    """Return canonical skills found in text, most frequent first."""
    found = []
    for name, pat in _PATTERNS.items():
        n = len(pat.findall(text or ""))
        if n:
            found.append((name, n))
    found.sort(key=lambda t: (-t[1], t[0]))
    return found if with_counts else [n for n, _ in found]


def skill_meta(name):
    d = SKILLS.get(name)
    return {"skill": name, "level": d["level"] if d else "intermediate", "category": d["category"] if d else "Other"}
