# University ETL Service

## Overview

University ETL Service is a microservice designed to fetch, transform, and serve university data from an external API in an automated manner. The service utilizes NestJS, Fastify for high-performance HTTP handling, and implements a robust ETL process with scheduled execution.

## Service Workflow Overview

The service follows a straightforward ETL workflow:
![Service Workflow](/assets/flowchart.png)

1. **Extract**: Fetches university data from the external API (universities.hipolabs.com)
2. **Transform**: Processes the data by:
   - Renaming fields to camelCase
   - Ensuring arrays are properly initialized
   - Deduplicating based on name and alphaTwoCode
3. **Load**: Stores the transformed data in a JSON file
4. **Serve**: Provides a paginated API endpoint to download the data as CSV

The ETL process runs:
- On application startup (configurable)
- Daily at midnight UTC (scheduled)

## Explanation of Each Component

- **University-etl Service**: Serves as the entry point for user requests, providing endpoints to download university data. It includes a cron job that automates the data refresh process using NestJS's built-in scheduling capabilities.
- **External API**: The source of university data (universities.hipolabs.com). We use a retry logic for outbound API requests to handle transient failures.
- **JSON File Storage**: A simple but effective persistence mechanism for the transformed data.

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

## Testing

Run the test suite:
```sh
npm test
```

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
│   ├── main.ts                        # Application entry point
│   ├── app.module.ts                  # Root module configuration
│   ├── university/                    # University domain module
│   │   ├── university.controller.ts   # HTTP request handling
│   │   ├── university.service.ts      # Business logic and ETL operations
│   │   └── university.types.ts        # Type definitions
│   └── common/                        # Shared utilities
│       ├── logger.service.ts          # Centralized logging
│       └── retry.decorator.ts         # Retry mechanism for API calls
├── data/                              # Data storage directory
│   └── universities.json              # Transformed university data
├── Dockerfile                         # Container definition
├── docker-compose.yml                 # Multi-container setup
├── tsconfig.json                      # TypeScript configuration
└── package.json                       # Project dependencies
```

## Design Decisions

- **Fastify Over Express**: Chosen for its superior performance benchmarks and faster response times.
- **Retry Logic**: Implemented to handle transient network failures when fetching data from the external API.
- **Scheduled ETL**: Daily refresh ensures data remains current without manual intervention.
- **Deduplication**: Ensures data integrity by preventing duplicate university entries in the json file.
- **Versioning**: API versioning is implemented to accommodate future changes. The version is included in the URL (e.g., GET /v1/universities/download) for clarity and easy identification of the API version in use.

## Expansion
Here are ways to improve data quality, database design, and data management to ensure no duplicates.

### Data Quality Improvements

1. **Data Validation and Enrichment**
   - Implement validation rules for university names, domains, and web pages
   - Add data enrichment by cross-referencing with other education databases
   - Include additional metadata such as:
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

This design provides:
- Normalized data structure
- Referential integrity
- Efficient querying capabilities
- Support for historical tracking
- Flexibility for future expansions

### Upsert Strategy

To prevent duplicates and ensure data consistency, implement the following upsert strategy:

1. **Unique Identifiers**
   - Use composite unique constraints on `(name, alpha_two_code)` for universities
   - Use unique constraints on `domain` and `url` fields
   - Implement a natural key strategy based on these constraints

2. **Upsert Implementation**
   ```sql
   -- Example upsert for universities
   INSERT INTO universities (name, country, alpha_two_code, state_province)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (name, alpha_two_code) 
   DO UPDATE SET
       country = EXCLUDED.country,
       state_province = EXCLUDED.state_province,
       updated_at = CURRENT_TIMESTAMP
   RETURNING id;
   ```

3. **Batch Processing**
   - Process data in batches to manage memory efficiently
   - Use transaction blocks for atomic operations
   - Implement retry logic for failed upserts

4. **Data Versioning**
   - Track changes using the `updated_at` timestamp
   - Maintain an audit log of significant changes
   - Implement soft delete for removed records
