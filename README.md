# University ETL Service

## Overview

University ETL Service is a microservice designed to fetch, transform, and serve university data from an external API in an automated manner. The service utilizes NestJS, Fastify for high-performance HTTP handling, and implements a robust ETL (Extract, Transform, Load) process with scheduled execution.

## Service Workflow Overview

The service follows a straightforward ETL workflow:

1. **Extract**: Fetches university data from the external API (universities.hipolabs.com)
2. **Transform**: Processes the data by:
   - Renaming fields to camelCase
   - Ensuring arrays are properly initialized
   - Deduplicating based on name and alphaTwoCode
3. **Load**: Stores the transformed data in a JSON file
4. **Serve**: Provides an API endpoint to download the data as CSV

The ETL process runs:
- On application startup (configurable)
- Daily at midnight UTC (scheduled)

## Explanation of Each Component

- **API Service**: Serves as the entry point for user requests, providing endpoints to download university data.
- **External API**: The source of university data (universities.hipolabs.com).
- **JSON File Storage**: A simple but effective persistence mechanism for the transformed data.
- **Scheduled ETL**: Automated data refresh process using NestJS's built-in scheduling capabilities.
- **Retry Mechanism**: Implements a configurable retry logic for outbound API requests to handle transient failures.

### Prerequisites

- Node.js 18 or later
- Docker and Docker Compose (for containerized deployment)

### Running the Service

1. Clone the repository:
```sh
git clone <repository-url>
cd university-etl
```


2. Start the application using Docker Compose:
```sh
docker-compose up --build
```

The application will be available at `http://localhost:3000`.

## API Endpoints

### Download Universities Data

```
GET /v1/universities/download
```

Optional query parameters:
- `offset`: Starting position for pagination (default: 0)
- `limit`: Number of records to return (optional)

Returns a CSV file containing university data with the following columns:
- name
- country
- alphaTwoCode
- domains
- webPages
- stateProvince

## How this project is organized

```
university-etl/
├── src/
│   ├── main.ts                 # Application entry point
│   ├── app.module.ts           # Root module configuration
│   ├── university/             # University domain module
│   │   ├── university.controller.ts  # HTTP request handling
│   │   ├── university.service.ts     # Business logic and ETL operations
│   │   └── university.types.ts       # Type definitions
│   ├── config/                 # Configuration management
│   │   └── configuration.ts    # Environment configuration
│   └── common/                 # Shared utilities
│       ├── logger.service.ts   # Centralized logging
│       └── retry.decorator.ts  # Retry mechanism for API calls
├── data/                       # Data storage directory
│   └── universities.json       # Transformed university data
├── Dockerfile                  # Container definition
├── docker-compose.yml          # Multi-container setup
├── tsconfig.json               # TypeScript configuration
└── package.json                # Project dependencies
```

## Design Decisions

- **Fastify Over Express**: Chosen for its superior performance benchmarks and faster response times.
- **Retry Logic**: Implemented to handle transient network failures when fetching data from the external API.
- **Scheduled ETL**: Daily refresh ensures data remains current without manual intervention.
- **Deduplication**: Ensures data integrity by preventing duplicate university entries.
- **Versioning**: In general, because API features frequently change to provide new features to consumers, versioning is implemented in this API to accommodate any future change. I used version in the URL because i think it is practical and useful as it makes it easy to tell what you're using at a glance e.g GET /v1/universities/download


## Expansion

### Data Quality Improvements

1. **Data Validation and Enrichment**
   - Implement validation rules for university names, domains, and web pages
   - Add data enrichment by cross-referencing with other education databases
   - Include additional metadata like:
     - University rankings
     - Student population
     - Year established
     - Accreditation status
     - Available programs

2. **Process Enhancements**
   - Implement incremental updates instead of full data refresh
   - Add data versioning to track changes over time
   - Implement data quality metrics and monitoring
   - Add support for multiple data sources
   - Implement data reconciliation between sources

### Database Design

A relational database design could be implemented using the following schema:

```sql
-- Universities table
CREATE TABLE universities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    alpha_two_code CHAR(2) NOT NULL,
    state_province VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, alpha_two_code)
);

-- Domains table
CREATE TABLE domains (
    id SERIAL PRIMARY KEY,
    university_id INTEGER REFERENCES universities(id),
    domain VARCHAR(255) NOT NULL,
    UNIQUE(domain)
);

-- Web pages table
CREATE TABLE web_pages (
    id SERIAL PRIMARY KEY,
    university_id INTEGER REFERENCES universities(id),
    url VARCHAR(255) NOT NULL,
    UNIQUE(url)
);

-- Additional metadata table
CREATE TABLE university_metadata (
    id SERIAL PRIMARY KEY,
    university_id INTEGER REFERENCES universities(id),
    ranking INTEGER,
    student_population INTEGER,
    year_established INTEGER,
    accreditation_status VARCHAR(50),
    last_verified_at TIMESTAMP
);
```

This design would provide:
- Normalized data structure
- Referential integrity
- Efficient querying capabilities
- Support for historical tracking
- Flexibility for future expansions

## Testing

Run the test suite:
```sh
npm test
```