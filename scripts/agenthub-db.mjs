import { getAgentHubDatabase, agentHubDatabasePath, closeAgentHubDatabase } from "../lib/agenthub/database.ts";

getAgentHubDatabase();
console.log(`AgentHub database ready: ${agentHubDatabasePath}`);
closeAgentHubDatabase();
