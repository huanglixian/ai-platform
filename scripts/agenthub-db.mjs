import { getAgentHubDatabase, agentHubDatabasePath, closeAgentHubDatabase } from "../lib/agenthub/database.ts";
import { migrateRuntimeData } from "./migrate-runtime-data.mjs";

migrateRuntimeData();
getAgentHubDatabase();
console.log(`AgentHub database ready: ${agentHubDatabasePath}`);
closeAgentHubDatabase();
