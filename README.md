# Dopamina Crew - Underground Music & Culture Web Portal

This project is a premium full-stack web application for **Dopamina Crew**, an underground music and cultural events brand. The design is inspired by the Berlin electronic and industrial warehouse scene, styled with absolute black backgrounds, deep gray cards, and electric/neon purple highlights.

## Tech Stack
- **Frontend**: React (Vite, Tailwind CSS, Framer Motion)
- **Backend**: Spring Boot 3.x (Java 21, Clean / Layered Architecture)
- **Database**: MySQL 8.0
- **Security**: Spring Security + JWT, BCrypt Password Hashing

---

## Directory Structure
```text
dopamina-crew/
├── database/
│   └── schema.sql           # Database schema & migrations
├── docker-compose.yml       # Starts local MySQL 8.0 instance
├── backend/                 # Spring Boot application
│   ├── pom.xml              # Maven dependencies
│   └── src/                 # Java source code & properties
└── frontend/                # React Vite application
    ├── tailwind.config.js   # Tailwind custom neon theme
    ├── src/                 # React components & pages
    └── package.json         # NPM scripts & packages
```

---

## Quick Start Instructions

### 1. Database
If you have Docker installed, run:
```bash
docker-compose up -d
```
Otherwise, run the script in `database/schema.sql` on your local MySQL server.
Create a database named `dopamina_crew_db`.

### 2. Backend
Change directory to `backend`:
```bash
cd backend
```
Set environment variables or review `src/main/resources/application.yml` for connection settings.
Build and run the application:
```bash
# Note: You can open this project in IntelliJ IDEA or VS Code and run it directly.
# If you configure Maven wrapper or have Maven installed:
mvn spring-boot:run
```
The server will run on `http://localhost:8080`.

### 3. Frontend
Change directory to `frontend`:
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Security Compliance & OWASP Top 10 Measures
1. **Password Hashing**: BCrypt with strength 12 is utilized for storing user credentials.
2. **JWT Authentication**: Secure stateless tokens are generated upon authentication and verified using filters.
3. **CORS Restrictions**: Configured strictly to allow requested origins and headers, preventing malicious cross-origin requests.
4. **Input Validation**: Real-time validation in React matched by `@Valid` validation constraints on the Spring Boot API DTO layer.
5. **SQL Injection Prevention**: Spring Data JPA Hibernate implementation automatically uses Parameterized Queries, eliminating SQL Injection vulnerabilities.
6. **Espacio Seguro Protocol**: A zero-tolerance policy against violence and harassment implemented on-site and highlighted throughout the application.
