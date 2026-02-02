CRUDTASK – Web Application for Academic Task Management

INTRODUCTION

CRUDTASK is a web application developed with Vanilla JavaScript that allows for the management of academic tasks through a simulated authentication system and role management (user and administrator).

The project simulates the operation of a real application using a dummy API created with JSON Server, without requiring a real backend.

PROJECT OBJECTIVE

To demonstrate the use of CRUD operations, simulated authentication, role-based access control, consumption of dummy REST APIs, and best practices in frontend development.

SCOPE

Includes:
- Registration and login
- Role management
- Session persistence
- Task management
- Administrative panel
- Responsive design

Does not include:
- Actual backend
- Production deployment

TECHNOLOGIES

- HTML5
- CSS3
- Vanilla JavaScript
- Vite
- JSON Server
- LocalStorage / SessionStorage

SYSTEM ROLES

User:
- Manages their own tasks
- Views their profile
- Logs out

Administrator:
- Accesses the dashboard
- Views metrics
- Manages all tasks

SECURITY

- Protected paths
- Session validation
- Role-based access control

INSTALLATION

1. Create a project with Vite:
npm create vite@latest crudtask

2. Install dependencies:
npm install

3. Run the project:
npm run dev
npm run server

4. Install JSON Server:
npm install -g json-server

5. Run JSON Server:
json-server --watch db.json --port 3000

CONCLUSION

CRUDTASK is an academic project that simulates a complete web application for task management, fulfilling the module requirements and applying fundamental concepts of modern web development.