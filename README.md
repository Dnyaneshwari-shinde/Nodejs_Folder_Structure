# Node.js Folder Structure

A starter REST API project built with **Node.js**, **TypeScript**, and
**Express 5**. The project uses a layered structure to separate
application setup, HTTP routes, request handling, business logic,
validation, and data access.

> **Project status:** This repository currently contains the project
> structure and the `app.ts` / `server.ts` entry points. Folders such as
> `config`, `controllers`, `services`, `repositories`, and `tests` are
> places for future implementation; their presence does not mean
> database integration, authentication, or automated tests are already
> configured.

## Table of Contents

-   [Technology Stack](#technology-stack)
-   [Current Project Structure](#current-project-structure)
-   [Folder and File
    Responsibilities](#folder-and-file-responsibilities)
-   [Architecture and Request Flow](#architecture-and-request-flow)
-   [Prerequisites](#prerequisites)
-   [Installation](#installation)
-   [Environment Variables](#environment-variables)
-   [Run in Development](#run-in-development)
-   [Build and Run in Production](#build-and-run-in-production)
-   [Tests](#tests)
-   [Development Guidelines](#development-guidelines)

## Technology Stack

-   **Node.js** --- JavaScript runtime
-   **TypeScript** --- static typing
-   **Express 5** --- HTTP API framework
-   **tsx** --- runs TypeScript directly and watches files during
    development
-   **TypeScript compiler (`tsc`)** --- compiles TypeScript to
    JavaScript
-   **npm** --- dependency and script management

## Current Project Structure

The following reflects the structure visible in the project:

``` text
nodejs_folder_structure/
├── src/
│   ├── app.ts
│   ├── server.ts
│   ├── config/
│   ├── constants/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── validators/
├── tests/
│   ├── integration/
│   └── unit/
├── .env.example
├── .gitignore
├── DockerFile
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

Folders may be empty until the relevant feature is implemented.
`node_modules/` is created by npm after installing dependencies and is
not normally committed to Git. Build output such as `dist/` is generated
when the project is built.

## Folder and File Responsibilities

### Root files

  -----------------------------------------------------------------------
  File                                Responsibility
  ----------------------------------- -----------------------------------
  `package.json`                      Project metadata, dependencies, and
                                      npm scripts

  `package-lock.json`                 Locks resolved dependency versions
                                      for reproducible installs

  `tsconfig.json`                     TypeScript compiler and module
                                      settings

  `.gitignore`                        Specifies files Git should not
                                      track

  `.env.example`                      Documents required environment
                                      variables using safe sample values

  `DockerFile`                        Intended Docker image build
                                      instructions; Docker conventionally
                                      uses the filename `Dockerfile` with
                                      a lowercase `f`

  `README.md`                         Project setup, architecture, and
                                      development documentation
  -----------------------------------------------------------------------

Keep real credentials in a local `.env` file or a deployment secret
manager. Do not commit `.env` or real secrets.

### `src/app.ts` --- Express application setup

Responsible for configuring the Express application:

-   Creates the Express app.
-   Registers middleware such as JSON body parsing.
-   Registers API routes.
-   Registers the not-found handler and global error handler.
-   Exports the configured app.

Keep `app.ts` separate from server startup so the app can be imported by
tests without immediately opening a network port.

### `src/server.ts` --- Server entry point

Responsible for starting and stopping the HTTP server:

-   Reads the configured port.
-   Starts listening for requests.
-   Initializes required infrastructure before accepting traffic when
    necessary (for example, a database connection).
-   Handles graceful shutdown signals.

`server.ts` should import the app using an ESM-compatible relative
import, for example `import app from "./app.js";`, when using the
`NodeNext` TypeScript module configuration.

### `src/config/` --- Configuration

Contains setup and configuration for infrastructure and application
settings.

-   `env.ts` --- reads and validates environment variables.
-   `db.ts` --- creates and manages a database connection when a
    database is selected.
-   `cors.ts` --- defines allowed browser origins, methods, and headers.

These files should be created as needed; their exact contents depend on
the deployment and database choices.

### `src/routes/` --- Endpoint definitions

Maps HTTP methods and URL paths to middleware and controllers.

-   `index.ts` --- combines feature routes and mounts them under an API
    prefix.
-   `user.routes.ts` --- defines user endpoints, such as registration or
    retrieving a user.

Routes should wire handlers together, not contain complex business logic
or database queries.

### `src/controllers/` --- HTTP handling

Controllers read validated request data, call services, and return the
appropriate HTTP status and response. Keep database queries and complex
business rules out of controllers.

### `src/services/` --- Business logic

Services implement application rules and workflows. For example, a user
service might check whether an email is already registered, hash a
password, and coordinate repository calls.

Services should not need Express `Request` or `Response` objects for
ordinary business operations.

### `src/repositories/` --- Data access

Repositories contain database queries and persistence operations, such
as finding a user, creating a record, or updating data. This layer is
useful when the project needs a clear boundary between business logic
and the chosen database.

### `src/models/` --- Data and domain models

Contains TypeScript types, domain entities, or database model
definitions, depending on the chosen persistence technology. A
TypeScript interface alone does not validate incoming JSON or create a
database table.

### `src/validators/` --- Runtime input validation

Defines validation schemas for request bodies, URL parameters, and query
parameters. A library such as Zod, Joi, or Yup can be added when needed.
TypeScript types do not validate untrusted input at runtime.

### `src/middlewares/` --- Reusable request processing

-   `auth.middleware.ts` --- verifies identity and authentication
    credentials.
-   `validate.middleware.ts` --- validates request input before a
    controller runs.
-   `error.middleware.ts` --- handles errors centrally and returns
    consistent, safe error responses.

Authentication and authorization are different: authentication
establishes who the caller is; authorization determines what the caller
may do.

### `src/utils/` --- Shared helpers

-   `response.ts` --- optional helpers for consistent API response
    shapes.
-   `logger.ts` --- logging helpers or integration with a structured
    logging library.

Keep utilities generic. Business rules belong in services.

### `src/constants/` --- Shared constants

Stores stable shared values such as error codes, message keys, and
application constants. Do not store secrets or environment-specific
configuration here.

### `tests/` --- Automated tests

The test directory is split by test purpose:

-   `unit/` --- tests an individual function or component in isolation,
    commonly services and utilities.
-   `integration/` --- tests how components work together, such as
    routes, middleware, and database access.

The project needs a test runner and test scripts configured before these
directories can run tests. The folders alone do not install or configure
a testing framework.

## Architecture and Request Flow

The intended request flow for a typical API endpoint is:

``` text
HTTP Client
    |
    v
Express App (src/app.ts)
    |
    v
Routes
    |
    v
Validation / Authentication Middleware
    |
    v
Controller
    |
    v
Service (business rules)
    |
    v
Repository (data access)
    |
    v
Database
```

The response returns through the controller to the client. Errors should
be passed to the centralized error middleware.

Supporting responsibilities:

-   **`server.ts`** starts the HTTP server.
-   **`config/`** configures environment and infrastructure.
-   **`models/`** represents application or persistence data.
-   **`utils/` and `constants/`** provide shared helpers and values.
-   **`tests/`** verifies individual layers and end-to-end request
    behavior.

Not every endpoint needs every layer. Keep the architecture simple and
introduce a repository or other abstraction when it provides a useful
boundary.

## Prerequisites

Install a supported Node.js LTS release and npm. Verify them with:

``` bash
node --version
npm --version
```

## Installation

From the repository root:

``` bash
npm install
```

If you are creating a local environment file and `.env.example` exists:

``` bash
cp .env.example .env
```

Update the values for your environment. The app must explicitly load and
validate environment variables; creating a `.env` file does not load it
automatically.

## Environment Variables

A minimal example could be:

``` dotenv
PORT=3000
NODE_ENV=development
```

Only add variables that the application actually reads. Add database
configuration when database integration is implemented. Never commit
real secrets.

## Run in Development

Configure these scripts in `package.json`:

``` json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "node --test"
  }
}
```

Start the development server:

``` bash
npm run dev
```

If `src/app.ts` defines a health endpoint such as `/health`, test it
with:

``` bash
curl http://localhost:3000/health
```

The endpoint only works after it has been implemented and registered in
the app.

## Build and Run in Production

Compile TypeScript:

``` bash
npm run build
```

Run the compiled JavaScript:

``` bash
npm start
```

For these commands to work, `tsconfig.json` should emit JavaScript into
`dist/`, for example with `rootDir: "./src"` and `outDir: "./dist"`.

Because this project uses `"type": "module"`, keep the module
configuration consistent. With `module` and `moduleResolution` set to
`NodeNext`, use `.js` extensions in relative imports in TypeScript
source files, such as:

``` typescript
import app from "./app.js";
```

TypeScript resolves this to `app.ts` during compilation and preserves a
valid JavaScript import in the output.

Before deploying, verify environment variables, configure production
secrets, run tests, build the project, and configure appropriate logging
and health monitoring.

## Tests

The `npm test` command shown above uses Node's built-in test runner. It
is suitable for JavaScript tests that Node can execute. TypeScript tests
may require a compatible runner or additional configuration.

Run tests with:

``` bash
npm test
```

Add tests for successful requests, invalid inputs, expected
business-rule failures, authentication and authorization, and unexpected
errors as the application grows.

## Development Guidelines

1.  Keep routes focused on endpoint wiring.
2.  Keep controllers focused on HTTP requests and responses.
3.  Put business rules in services.
4.  Keep database queries in repositories when that layer is useful.
5.  Validate all untrusted input at runtime.
6.  Handle errors centrally and avoid returning internal stack traces to
    clients.
7.  Never return passwords, password hashes, or sensitive tokens in API
    responses.
8.  Keep secrets out of source control.
9.  Write unit and integration tests for important behavior.
10. Keep TypeScript module settings and import paths consistent.
11. Add new folders and abstractions only when they are needed.
12. Update this README when setup commands, endpoints, dependencies, or
    architecture change.

## Future Improvements

Depending on the application requirements, consider adding:

-   User registration and login endpoints
-   Authentication and role-based authorization
-   Database integration and migrations
-   Request validation with Zod
-   API documentation with OpenAPI/Swagger
-   Structured logging and request IDs
-   Rate limiting and secure HTTP headers
-   Docker build and deployment instructions
-   CI/CD for automated checks and deployment

------------------------------------------------------------------------

**Summary:** This repository is a starter structure for a TypeScript and
Express API. The main principle is separation of concerns: routes map
endpoints, controllers handle HTTP, services implement business rules,
repositories access data, and middleware handles cross-cutting request
concerns.
