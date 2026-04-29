export type AccessUser = {
  id?: string;
  email?: string;
  role?: string;
  department?: string | null;
};

export function accessRole(user: AccessUser | null) {
  const role = String(user?.role ?? "").toLowerCase();
  if (role === "admin" || role.includes("super admin")) return "admin";
  if (role.includes("supervisor")) return "supervisor";
  if (role.includes("technician") || role.includes("service team")) return "technician";
  if (role.includes("read") || role.includes("viewer") || role.includes("view only")) return "readonly";
  return "requester";
}

export function sameDepartment(user: AccessUser | null, departmentCode?: string | null) {
  if (!departmentCode) return false;
  return String(user?.department ?? "").toLowerCase() === String(departmentCode).toLowerCase();
}

export function canManageDepartmentRecord(user: AccessUser | null, departmentCode?: string | null) {
  const role = accessRole(user);
  return role === "admin" || (role === "supervisor" && sameDepartment(user, departmentCode));
}

export function canExecuteAssignedRecord(user: AccessUser | null, assignedToId?: string | null) {
  const role = accessRole(user);
  return role === "admin" || role === "supervisor" || (role === "technician" && assignedToId === user?.id);
}
