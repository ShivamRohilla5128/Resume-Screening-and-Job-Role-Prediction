"""Generate a SYNTHETIC resume dataset for smoke-testing the pipeline.

!!! This data is artificial. Models trained on it are NOT evidence of real-world accuracy. !!!
For the lab submission, train on a genuine dataset (see ml/datasets/README.md) with:
    python -m ml.training.train --data path/to/real.csv
"""
import csv, os, random, sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
from ml.preprocessing.skills_vocab import SKILLS  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
rng = random.Random(42)

REF = {}
with open(os.path.join(HERE, "skills_reference.csv"), newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        REF[r["Job_Role"]] = ([s.strip() for s in r["Required_Skills"].split(",")], [s.strip() for s in r["Optional_Skills"].split(",")])

ROLE_DATA = {
 "Data Scientist": (["Data Scientist", "Junior Data Scientist", "Applied Scientist"],
   ["Built predictive models to forecast customer churn using {a} and {b}", "Performed exploratory data analysis and feature engineering on large datasets with {a}", "Designed A/B tests and applied statistical analysis to evaluate product changes", "Presented model insights and findings to business stakeholders using {a}"],
   ["Customer churn prediction model", "Sales forecasting with time series", "Sentiment analysis of product reviews"], ["IBM Data Science Professional Certificate", "Machine Learning Specialization (Coursera)"]),
 "Data Analyst": (["Data Analyst", "Junior Data Analyst", "Reporting Analyst"],
   ["Created interactive dashboards in {a} to track weekly sales KPIs", "Wrote {a} queries to extract and clean data from multiple sources", "Automated monthly reports and reduced manual effort", "Analysed trends in customer data and shared actionable insights using {b}"],
   ["Sales performance dashboard", "Customer segmentation analysis", "HR attrition report"], ["Microsoft Power BI Data Analyst Associate", "Google Data Analytics Certificate"]),
 "Machine Learning Engineer": (["Machine Learning Engineer", "ML Engineer", "AI Engineer"],
   ["Trained and deployed deep learning models using {a} and {b}", "Built model serving pipelines and containerised services for inference", "Optimised model training workflows and monitored model drift in production", "Implemented computer vision and NLP prototypes with {a}"],
   ["Image classification service", "Recommendation engine", "Real-time object detection"], ["TensorFlow Developer Certificate", "Deep Learning Specialization"]),
 "Python Developer": (["Python Developer", "Software Developer - Python", "Backend Python Developer"],
   ["Developed web applications and REST APIs using {a} and {b}", "Wrote reusable Python modules and automated scripts for internal tools", "Integrated third-party services and improved application performance", "Maintained relational databases and wrote unit tests for new features"],
   ["Inventory management web app", "Expense tracker API", "Web scraping toolkit"], ["PCAP: Certified Associate in Python Programming"]),
 "Java Developer": (["Java Developer", "Java Software Engineer", "J2EE Developer"],
   ["Developed enterprise applications using {a} and {b}", "Designed REST services and integrated them with relational databases", "Refactored legacy modules to improve maintainability and test coverage", "Participated in code reviews and sprint planning for Java projects"],
   ["Online banking system", "Library management application", "Hotel booking portal"], ["Oracle Certified Associate, Java SE"]),
 "Web Developer": (["Web Developer", "Junior Web Developer", "Website Developer"],
   ["Built responsive websites for small businesses using {a} and {b}", "Improved page load times and cross-browser compatibility", "Implemented contact forms and content pages from design mockups", "Maintained client websites and fixed layout issues across devices"],
   ["Portfolio website", "Restaurant landing page", "Event registration site"], ["freeCodeCamp Responsive Web Design Certification"]),
 "Frontend Developer": (["Frontend Developer", "UI Developer", "React Developer"],
   ["Developed reusable UI components using {a} and {b}", "Implemented pixel-perfect, accessible interfaces from Figma designs", "Managed application state and optimised rendering performance", "Collaborated with designers and backend engineers to ship new features"],
   ["E-commerce storefront UI", "Weather dashboard", "Kanban board application"], ["Meta Front-End Developer Certificate"]),
 "Backend Developer": (["Backend Developer", "Server-side Engineer", "API Developer"],
   ["Designed and implemented scalable APIs using {a} and {b}", "Optimised database queries and designed schemas for new services", "Implemented authentication, caching and background job processing", "Monitored services and resolved production incidents"],
   ["Payment processing API", "Real-time chat server", "URL shortener service"], ["MongoDB Associate Developer Certification"]),
 "Full Stack Developer": (["Full Stack Developer", "MERN Stack Developer", "Software Engineer - Full Stack"],
   ["Built end-to-end features across the frontend using {a} and the backend using {b}", "Designed REST APIs and connected them to responsive user interfaces", "Deployed full stack applications and set up basic CI pipelines", "Worked with databases, authentication and third-party integrations"],
   ["Job portal web application", "Social media clone", "Online marketplace"], ["Full Stack Open Certification"]),
 "Software Engineer": (["Software Engineer", "Associate Software Engineer", "Software Development Engineer"],
   ["Designed and implemented software components using {a} and {b}", "Applied data structures and algorithms to improve application performance", "Wrote automated tests and participated in design and code reviews", "Worked in agile teams to deliver features every sprint"],
   ["Task scheduling application", "Compiler front-end prototype", "File synchronisation tool"], ["AWS Certified Cloud Practitioner"]),
 "DevOps Engineer": (["DevOps Engineer", "Site Reliability Engineer", "Build and Release Engineer"],
   ["Automated build and release pipelines using {a} and {b}", "Containerised applications and managed clusters for staging and production", "Implemented monitoring and alerting to reduce downtime", "Managed Linux servers, configuration and deployment automation"],
   ["CI/CD pipeline for microservices", "Kubernetes cluster automation", "Centralised logging stack"], ["Certified Kubernetes Administrator", "AWS Certified DevOps Engineer"]),
 "Cybersecurity Analyst": (["Cybersecurity Analyst", "Security Analyst", "SOC Analyst"],
   ["Monitored security events and triaged alerts using {a} and {b}", "Performed vulnerability scans and tracked remediation with system owners", "Investigated incidents and documented root cause and response actions", "Reviewed firewall rules and network access policies"],
   ["Home lab SOC with log analysis", "Vulnerability assessment of a web application", "Phishing awareness simulation"], ["CompTIA Security+", "Certified Ethical Hacker (CEH)"]),
 "Cloud Engineer": (["Cloud Engineer", "Cloud Infrastructure Engineer", "Cloud Support Engineer"],
   ["Provisioned and managed cloud infrastructure on {a} using {b}", "Designed secure virtual networks, storage and compute resources", "Reduced cloud costs through right-sizing and automation", "Migrated on-premise workloads to the cloud"],
   ["Three-tier web app on cloud", "Infrastructure automation templates", "Serverless image processing"], ["AWS Certified Solutions Architect - Associate", "Microsoft Azure Fundamentals"]),
 "Database Administrator": (["Database Administrator", "Junior DBA", "Database Engineer"],
   ["Administered production databases using {a} and {b}", "Scheduled backups and tested recovery procedures regularly", "Tuned slow queries and indexes to improve response times", "Managed user access, security patches and upgrades"],
   ["Database migration project", "Automated backup scripts", "Query performance audit"], ["Oracle Database Administrator Certified Associate", "Microsoft Certified: Azure Database Administrator"]),
 "Business Analyst": (["Business Analyst", "IT Business Analyst", "Functional Analyst"],
   ["Gathered and documented business requirements by working with {a} and stakeholders", "Created process flows and user stories in {b}", "Facilitated workshops and sprint demos with technical teams", "Analysed operational data to identify process improvements"],
   ["CRM requirements specification", "Process improvement study", "Order-to-cash process mapping"], ["CBAP / ECBA (IIBA)", "PMI Professional in Business Analysis"]),
}
GENERIC = ["Git", "SQL", "Linux", "Agile", "Python", "Excel"]
FIRST = ["Aarav", "Priya", "Rohan", "Sneha", "Arjun", "Neha", "Vikram", "Ananya", "Karthik", "Isha", "Meera", "Rahul", "Divya", "Aditya", "Pooja", "Sanjay", "Kavya", "Nikhil", "Riya", "Manish", "Emma", "Liam", "Olivia", "Noah", "Sofia", "Lucas", "Mia", "Ethan"]
LAST = ["Sharma", "Verma", "Patel", "Reddy", "Gupta", "Nair", "Iyer", "Singh", "Joshi", "Mehta", "Das", "Khan", "Rao", "Kumar", "Bose", "Smith", "Brown", "Garcia", "Martin", "Lopez"]
COMPANIES = ["Infosys", "TechNova Solutions", "BlueOrbit Systems", "Nimbus Labs", "Quantum Soft", "BrightPath Technologies", "CloudNine IT", "DataWorks Pvt Ltd", "Pixel Forge", "Orion Analytics"]
UNIS = ["National Institute of Technology", "State Technical University", "City Engineering College", "Institute of Information Technology", "Metropolitan University"]
DEGREES_TECH = [("B.Tech in Computer Science", "Computer Science"), ("B.E. in Information Technology", "Information Technology"), ("BCA", "Computer Applications"), ("B.Sc in Computer Science", "Computer Science"), ("M.Tech in Computer Science", "Computer Science"), ("MCA", "Computer Applications"), ("B.Tech in Electronics and Communication", "Electronics")]
DEGREES_BIZ = [("MBA in Information Systems", "Business"), ("BBA", "Business"), ("B.Com", "Commerce")] + DEGREES_TECH[:3]
SOFT = {"Git", "Agile"}


def variant(skill):
    d = SKILLS[skill]
    return skill if rng.random() < 0.6 else rng.choice([skill] + d["aliases"]).upper() if len(skill) <= 4 else skill


def make_resume(idx, role):
    req, opt = REF[role]
    titles, bullets, projects, certs = ROLE_DATA[role]
    skills = [s for s in req if rng.random() < 0.75] + [s for s in opt if rng.random() < 0.35]
    skills += rng.sample(GENERIC, rng.randint(1, 3))
    for _ in range(rng.choice([0, 1, 1, 2])):       # cross-role noise so classes overlap
        other = rng.choice([r for r in REF if r != role])
        skills += rng.sample(REF[other][0], 3)
    skills = list(dict.fromkeys(skills)) or req[:2]
    rng.shuffle(skills)
    years = rng.choice([0, 0, 1, 1, 2, 3, 4, 5, 6, 8, 10])
    name = f"{rng.choice(FIRST)} {rng.choice(LAST)}"
    deg, _ = rng.choice(DEGREES_BIZ if role == "Business Analyst" else DEGREES_TECH)
    grad = 2024 - years - rng.randint(0, 1)
    pick = lambda: variant(rng.choice(skills))
    title = lambda: rng.choice(titles) if rng.random() > 0.45 else rng.choice(["IT Professional", "Software Professional", "Technology Associate"])
    L = [name, f"{name.split()[0].lower()}.{name.split()[1].lower()}{rng.randint(1, 99)}@example.com | +91 {rng.randint(70000, 99999)} {rng.randint(10000, 99999)} | India", ""]
    L += ["PROFESSIONAL SUMMARY", f"{title()} with {years if years else 'less than 1'} year(s) of experience working with {', '.join(variant(s) for s in skills[:3])}. Motivated to build reliable solutions and keep learning.", ""]
    L += ["SKILLS", "Technical Skills: " + ", ".join(variant(s) for s in skills), ""]
    if years:
        L.append("EXPERIENCE")
        end, jobs = 2024, rng.randint(1, min(3, max(1, years)))
        for j in range(jobs):
            span = max(1, years // jobs)
            start = end - span
            L.append(f"{title()} - {rng.choice(COMPANIES)} ({start} - {'Present' if j == 0 else end})")
            for b in rng.sample(bullets, 3):
                if rng.random() < 0.6:                       # off-topic bullet
                    b = rng.choice(ROLE_DATA[rng.choice(list(ROLE_DATA))][1])
                L.append("- " + b.format(a=pick(), b=pick()))
            end = start
        L.append("")
    L += ["EDUCATION", f"{deg}, {rng.choice(UNIS)}, {grad}", ""]
    anyrole = lambda i: rng.choice(ROLE_DATA[rng.choice(list(ROLE_DATA))][i])
    L += ["PROJECTS"] + [f"- {p}: implemented with {pick()} and {pick()}" for p in [rng.choice(projects) if rng.random() < 0.5 else anyrole(2) for _ in range(2)]] + [""]
    if rng.random() < 0.6:
        L += ["CERTIFICATIONS", "- " + (rng.choice(certs) if rng.random() < 0.5 else anyrole(3))]
    text = "\n".join(L)
    return {"Resume_ID": f"SYN-{idx:04d}", "Resume_Text": text, "Category": role,
            "Skills": ", ".join(skills), "Education": deg, "Experience": f"{years} years"}


def main(per_role=50):
    rows, idx = [], 1
    for role in REF:
        for _ in range(per_role):
            rows.append(make_resume(idx, role)); idx += 1
    rng.shuffle(rows)
    out = os.path.join(HERE, "resume_dataset_synthetic.csv")
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    print(f"Wrote {len(rows)} SYNTHETIC resumes -> {out}")


if __name__ == "__main__":
    main()
