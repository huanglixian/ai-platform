import { permissionDefinitions } from "@/config/permissions";
import { syncPermissionDefinitions } from "@/server/permissions/registry";

export async function ensureApplicationPermissionCatalog() {
  await syncPermissionDefinitions(permissionDefinitions);
}
