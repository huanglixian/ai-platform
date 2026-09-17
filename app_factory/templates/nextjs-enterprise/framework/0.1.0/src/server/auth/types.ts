export type Principal = {
  userId: string;
  username: string;
  displayName: string;
  primaryDepartmentId: string | null;
  roleCodes: string[];
};

export type UserSummary = {
  id: string;
  username: string;
  displayName: string;
  primaryDepartmentId: string | null;
  primaryDepartmentName: string | null;
  active: boolean;
  roleCodes: string[];
  createdAt: string;
};
