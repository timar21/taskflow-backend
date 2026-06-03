# Taskflow Backend

A task management backend built with NestJS and TypeScript.

---

## What is NestJS?

NestJS is a framework for building server-side applications with TypeScript.
It is built on top of Express and uses a module-based architecture inspired by Angular.
It helps organize code into modules, controllers, and services.

---

## Project Structure
src/
├── main.ts
├── app.module.ts
├── app.controller.ts
├── app.service.ts
└── projects/
├── projects.module.ts
├── projects.controller.ts
├── projects.controller.spec.ts
├── projects.service.ts
└── projects.service.spec.ts
---

## File Explanations

### main.ts
This is the entry point of the entire application.
It creates the NestJS app and tells it which port to listen on.
Every NestJS app starts from this file.

### app.module.ts
This is the root module of the application.
It imports all other modules like ProjectsModule and registers
the main controller and service.
Think of it as the main organizer of the entire app.

### app.controller.ts
This is the root controller.
It handles the base route GET / and returns a Hello World response.
A controller's job is to receive HTTP requests and send back responses.

### app.service.ts
This is the root service.
It contains the logic behind the base route.
A service's job is to handle the actual business logic,
keeping it separate from the controller.

### projects/projects.module.ts
This module groups everything related to Projects together.
It registers the ProjectsController and ProjectsService so
NestJS knows they belong to the Projects feature.

### projects/projects.controller.ts
This controller handles all HTTP requests for the /projects routes.
- GET /projects returns all projects
- GET /projects/:id returns a single project by its id
- If the project is not found it returns a 404 error

### projects/projects.service.ts
This service contains the business logic for projects.
It holds the mock project data and has two methods:
- findAll() returns all projects
- findOne(id) returns one project by id

### projects/projects.controller.spec.ts
This is the test file for the ProjectsController.
It tests that the controller returns the correct data
and throws a NotFoundException when a project is not found.

### projects/projects.service.spec.ts
This is the test file for the ProjectsService.
It tests that the service returns all projects correctly
and returns undefined when a project id does not exist.

---

## How the Files Work Together
Browser or curl sends HTTP Request
↓
ProjectsController receives the request
↓
ProjectsService finds and returns the data
↓
ProjectsController sends back the HTTP Response
↓
Browser or curl receives the data
---

## API Endpoints

| Method | Route           | Description                        |
|--------|-----------------|------------------------------------|
| GET    | /               | Returns Hello World                |
| GET    | /projects       | Returns all projects               |
| GET    | /projects/:id   | Returns one project by id          |
| GET    | /projects/99    | Returns 404 if project not found   |

---

## How to Run the App

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm run test

# Build the app
npm run build
```

---

## Test Results

All tests pass including:
- AppController basic route test
- ProjectsService findAll and findOne tests
- ProjectsController route and error handling tests