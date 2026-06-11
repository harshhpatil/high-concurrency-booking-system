# High-Concurrency Booking Engine

A backend microservice designed to handle high-traffic booking scenarios, specifically focused on preventing database race conditions and double-booking during concurrent user requests.

## The Problem: Race Conditions

In a standard CRUD booking system, if 50 users attempt to book the final available ticket at the exact same millisecond, the database reads the available seat count before any transaction is complete. This results in the system issuing multiple tickets for a single seat, corrupting the database.

## The Solution: Distributed Locking

This API implements a Mutex (Mutual Exclusion) Lock using Redis.

- When a user attempts to book a seat, the system requests a unique, time-bound lock in Redis (NX flag)
- If acquired, the transaction enters a critical section, safely updating the MongoDB database
- If denied (another user holds the lock), the API immediately rejects the request with a 409 Conflict, preventing server overload and database corruption

## Tech Stack

- **Node.js & Express** — Core API logic
- **MongoDB (Mongoose)** — Persistent storage for Events and Bookings
- **Redis (ioredis)** — In-memory data store managing distributed locks

## API Endpoints

### 1. Initialize Event
```
POST /events
```
Creates a new event with a set pool of available seats.

### 2. The Vulnerable Route (For Testing)
```
POST /book/bad
```
A standard booking route vulnerable to concurrent requests. Used to simulate and measure database corruption under load.

### 3. The Protected Route (Production)
```
POST /book/fixed
```
The Redis-protected booking route. Ensures absolute database integrity by forcing atomic operations via Mutex locking.

## Running the Concurrency Test

This project includes a Node.js script to simulate high concurrency.

**Prerequisites:**
- Ensure MongoDB and Redis are running locally

**Start the server:**
```bash
node src/index.js
```

**Run the simulation script** to fire 50 simultaneous requests at the exact same millisecond (bad api route):
```bash
node ./testing/test-race-condition-bad.js
```

**Run the simulation script** to fire 50 simultaneous requests at the exact same millisecond (good api route):
```bash
node ./testing/test-race-condition-good.js
```