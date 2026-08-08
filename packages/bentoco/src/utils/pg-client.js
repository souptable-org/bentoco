"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withPgClient = withPgClient;
const pg_1 = require("pg");
/**
 * Short-lived Postgres client for Bentoco agency / tenant tables
 * that sit outside Medusa modules.
 */
async function withPgClient(fn) {
    const connectionString = process.env.DATABASE_URL ||
        "postgres://postgres:postgres@localhost:5432/bentoco";
    const client = new pg_1.Client({ connectionString });
    await client.connect();
    try {
        return await fn(client);
    }
    finally {
        await client.end();
    }
}
