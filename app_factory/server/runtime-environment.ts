export function isolateEnterpriseRuntimeEnvironment(environment: NodeJS.ProcessEnv) {
  const isolated = { ...environment };
  for (const key of Object.keys(isolated)) {
    if (key.startsWith("APPFACTORY_")) delete isolated[key];
  }
  for (const key of [
    "AGENT_HUB_BASE_URL",
    "NEXT_PUBLIC_APPFACTORY_URL",
    "DEEPSEEK_API_KEY",
    "DEEPSEEK_BASE_URL",
    "DEEPSEEK_MODEL",
    "TOWER_MATCH_API_URL",
    "TOWER_MATCH_API_KEY",
  ]) {
    delete isolated[key];
  }
  return isolated;
}
