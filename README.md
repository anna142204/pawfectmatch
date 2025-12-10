# PawfectMatch API

A RESTful API for connecting animal adopters with pets available for adoption, implemented with [Express][express] and [MongoDB][mongo].

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Requirements](#requirements)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Resources](#api-resources)
- [API Documentation](#api-documentation)
- [WebSocket Support](#websocket-support)
- [Automated Tests](#automated-tests)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Requirements

- [Node.js][node] 18.x or higher
- [MongoDB][mongo] 7.x or 8.x
- [npm][npm] 9.x or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/HEIG-VD/pawfectmatch.git
cd pawfectmatch

# Install dependencies
npm ci
```

## Usage

```bash
# Start the application in development mode with hot reload
npm run dev
```

The API will be available at [http://localhost:8989](http://localhost:8989).

### Other Scripts

```bash
# Start the backend server with nodemon and environment variables from .env
npm run backend

# Run automated tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Configuration

The application connects to MongoDB at `mongodb://localhost/pawfectmatch` by default.

Create a `.env` file in the root directory to configure environment variables:

```env
DATABASE_URL=mongodb://localhost/pawfectmatch
PORT=8989
NODE_ENV=development
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection URL | `mongodb://localhost/pawfectmatch` |
| `MONGODB_URI` | Alternative MongoDB connection URL | (uses `DATABASE_URL` if not set) |
| `PORT` | Server port | `8989` |
| `NODE_ENV` | Environment (development/production) | `development` |

### Example with Custom MongoDB URL

```bash
DATABASE_URL=mongodb://myserver:27017/pawfectmatch npm run backend
```

## API Resources

This API allows you to work with the following resources:

### Core Resources

- **Adopters** - Users looking to adopt animals
  - Register as an adopter
  - Browse and filter adopters
  - Update adopter profile and preferences
  - Delete adopter account

- **Owners** - Users offering animals for adoption
  - Register as an owner
  - Browse and filter owners
  - Update owner profile
  - Delete owner account (if no associated animals)

- **Animals** - Pets available for adoption
  - Create and manage animal listings
  - Browse animals with filtering (species, city, name)
  - Update animal information and availability
  - Delete animal listings

- **Matches** - Connections between adopters and animals
  - Create matches between adopters and animals
  - Manage match status (active/inactive)
  - Exchange messages within a match discussion
  - View discussion history

### Related Resources

- **Images** - Image upload and management
  - Upload single or multiple images (up to 10 files)
  - Delete images

- **Admin** - Administrative endpoints
  - Retrieve API statistics (total users, animals, matches)

## API Documentation

The complete API documentation is available in the [OpenAPI specification](openapi.yml).

You can view the interactive documentation using:

1. **Swagger UI** - Copy the `openapi.yml` content to https://editor.swagger.io/
2. **ReDoc** - View at https://redocly.github.io/redoc/ (paste the YAML)

### Key Features

- **Authentication** - JWT-based token authentication for secure endpoints
- **Pagination** - All list endpoints support pagination with `page` and `limit` parameters
- **Filtering** - Filter resources by various criteria (firstName, lastName, email, city, species, etc.)
- **Error Handling** - Comprehensive error responses with appropriate HTTP status codes
- **Validation** - Request data validation with detailed error messages

## WebSocket Support

This application uses [WsMini][wsmini] - a lightweight WebSocket library for real-time communication.

For more information about WsMini, see the [official documentation][wsmini].

## Automated Tests

This application includes an automated test suite using [Jest][jest] and [SuperTest][supertest].

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

The tests will attempt to connect to MongoDB at `mongodb://localhost/pawfectmatch-test`.


[express]: https://expressjs.com
[jest]: https://jestjs.io
[mongo]: https://www.mongodb.com
[node]: https://nodejs.org
[npm]: https://www.npmjs.com
[supertest]: https://github.com/visionmedia/supertest#readme
[wsmini]: https://github.com/Chabloz/WsMini
