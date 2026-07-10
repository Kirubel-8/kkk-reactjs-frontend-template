JCDMS Project Setup Guide

This document contains the complete setup guide for the JCDMS system, which includes a Node.js/Express backend and two React frontends: Backoffice and Applicant/Customer.

Project Structure:

JCDMS/
├── api/                  # Backend (Express.js)
│   └── JCDS-API/
├── web/
│   ├── jcds-office/      # Frontend - Backoffice
│   └── jcds-applicant/   # Frontend - Applicant/Customer

Prerequisites:

* Node.js >= 18
* npm >= 9
* Git
* PostgreSQL (for database)

1. Clone the Repository:

```bash
git clone https://github.com/username/JCDMS.git
cd JCDMS
```

2. Backend Setup (Express.js):

* Navigate to the backend folder:

```bash
cd api/JCDS-API
```

* Install dependencies:

```bash
npm install
```

* Configure environment variables:

```bash
cp .env.example .env
# Edit .env with database credentials, API keys, ports, etc.
```

* Run database migrations and seeders (PostgreSQL):

Make sure PostgreSQL is running and that the database connection details in `.env` are correct. Then run:

```bash
npx sequelize db:migrate       # Run all database migrations
npx sequelize db:seed:all      # Seed the database with initial data
```

These commands will create the necessary tables and insert any default data required for the application.

* Run the backend server:

```bash
npm run dev   # or npm start
```

Backend should now run on [http://localhost:4000](http://localhost:4000).

3. Frontend Setup:

3.1 Backoffice Frontend:

* Navigate to the backoffice frontend folder:

```bash
cd ../../web/jcds-office
```

* Install dependencies:

```bash
npm install
```

* Run the backoffice frontend:

```bash
npm start
```

Accessible at [http://localhost:3000](http://localhost:3000).

3.2 Applicant/Customer Frontend:

* Navigate to the applicant frontend folder:

```bash
cd ../jcds-applicant
```

* Install dependencies:

```bash
npm install
```

* Run the applicant frontend:

```bash
npm run dev
```

Accessible at [http://localhost:3001](http://localhost:3001).

4. Notes:

* Ensure ports are free: Backend (4000), Backoffice (3000), Applicant (3001).
* Keep `.env` files secure.
* Run migrations and seeders again if the database schema changes.

5. Git Collaboration Tips:

* Create feature branches: `git checkout -b feature/your-feature`
* Commit changes: `git add . && git commit -m "Your message"`
* Push: `git push origin feature/your-feature`
* Use Pull Requests for code review before merging to main.
