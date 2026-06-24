# Taskflow Backend

A task management backend built with Node.js, TypeScript, and NestJS.

---

## Overview

This project is a backend application for managing tasks and projects.
It started as a simple Node.js HTTP server and evolved into a
full NestJS application with a modular architecture.

---

## Technologies Used

- Node.js
- TypeScript
- NestJS
- dotenv
- fs (file system)
- Jest (testing)

---
## Database Choice — PostgreSQL

TaskFlow uses PostgreSQL as its database for the following reasons:

- TaskFlow has structured relational data: Users own Projects, Projects have Tasks, and Tasks are optionally assigned to Users. This relational structure is a perfect fit for a SQL database.
- PostgreSQL enforces data integrity through foreign keys and constraints, which matters for a task management system where relationships between data must stay consistent.
- PostgreSQL is reliable, open source, and widely used in production backends.
- TypeORM has excellent support for PostgreSQL, making it easy to define entities and relationships directly in TypeScript using decorators like @OneToMany and @ManyToOne.
- Unlike NoSQL databases such as MongoDB, which are better suited for flexible or unstructured data, PostgreSQL's schema and relational model match TaskFlow's needs more closely.

## Project Structure
taskflow-backend/
├── src/
│   ├── server.ts
│   ├── readUsers.ts
│   ├── interfaces/
│   │   └── types.ts
│   └── data/
│       ├── mock-users.json
│       ├── mock-projects.json
│       └── mock-tasks.json
└── taskflow-nest/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── projects/
│       ├── projects.module.ts
│       ├── projects.controller.ts
│       └── projects.service.ts
└── README.md

---

## Part 1 - Simple Node.js HTTP Server

The first part of this project is a simple HTTP server built
using the raw Node.js http module and TypeScript.

### What it does
- Defines interfaces for User, Project, and Task
- Reads mock data from JSON files using the fs module
- Serves the data through HTTP endpoints
- Handles missing routes with a 404 error response
- Uses dotenv to load the PORT from a .env file

### API Endpoints

| Method | Route       | Description          |
|--------|-------------|----------------------|
| GET    | /projects   | Returns all projects |
| GET    | /users      | Returns all users    |
| GET    | /*          | Returns 404 error    |

### How to run

```bash
# From taskflow-backend folder
npm run dev
```

---

## Part 2 - NestJS Application

The second part rebuilds the backend using NestJS, a structured
framework that organizes code into modules, controllers, and services.

### What it does
- Sets up a NestJS project with TypeScript
- Creates a ProjectsModule with a controller and service
- Serves project data through clean REST endpoints
- Handles errors with proper HTTP status codes
- Includes unit tests for all controllers and services

### How to run

```bash
# From taskflow-nest folder
cd taskflow-nest
npm run start:dev
```

### API Endpoints

| Method | Route           | Description                      |
|--------|-----------------|----------------------------------|
| GET    | /               | Returns Hello World              |
| GET    | /projects       | Returns all projects             |
| GET    | /projects/:id   | Returns one project by id        |
| GET    | /projects/99    | Returns 404 if not found         |

### For full NestJS details
See the README inside the taskflow-nest folder:
taskflow-backend/taskflow-nest/README.md

---

## Running Tests

```bash
# From taskflow-nest folder
cd taskflow-nest
npm run test
```

### Test Results
- AppController tests
- ProjectsController tests
- ProjectsService tests
- All 9 tests pass

---

## Git Workflow

All features are developed on the develop branch
and merged into main via Pull Requests with code reviews.

