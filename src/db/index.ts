import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { ENV } from "../config/env";

if (!ENV.DB_URL) {
    throw new Error("DB_URL is not working")
}

const pool = new Pool({ connectionString: ENV.DB_URL});

pool.on("connect", () => {
    console.log("Databese Connected Successfully")
});

pool.on("error", (err) => {
    console.log("Failed to Connect Database", err)
});

export const db = drizzle({ client: pool, schema });
