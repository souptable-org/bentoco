import { Client } from "pg"

/**
 * Short-lived Postgres client for Bentoco agency / tenant tables
 * that sit outside Medusa modules.
 */
export async function withPgClient<T>(
  fn: (client: Client) => Promise<T>
): Promise<T> {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/bentoco"

  const client = new Client({ connectionString })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}
