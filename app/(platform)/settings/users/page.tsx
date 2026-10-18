import { requirePageUser } from "@/features/auth/server";
import { listUsers } from "@/features/auth/users";
import { UsersPage } from "@/features/admin/users-page";

export default async function Page() {
  await requirePageUser("users.manage");
  return <UsersPage initialUsers={listUsers()} />;
}
