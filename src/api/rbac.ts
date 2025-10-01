import { http } from "@/utils/http";
import type { Pagination } from ".";

// ============= 权限相关类型 =============
export type Permission = {
  /** 权限ID */
  id: string;
  /** 权限名称 */
  name: string;
  /** 权限操作 */
  action: string;
  /** 权限描述 */
  description?: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 是否为公共权限 */
  isPublic: boolean;
  /** 拥有该权限的角色 */
  roles?: Array<Role>;
};

export type CreatePermissionRequest = {
  /** 权限名称 */
  name: string;
  /** 权限操作 */
  action: string;
  /** 权限描述 */
  description?: string;
  /** 权限域ID */
  scopeId?: string;
  /** 是否为公共权限 */
  isPublic?: boolean;
};

export type UpdatePermissionRequest = {
  /** 权限名称 */
  name?: string;
  /** 权限操作 */
  action?: string;
  /** 权限描述 */
  description?: string;
  /** 权限域ID */
  scopeId?: string;
  /** 是否为公共权限 */
  isPublic?: boolean;
};

export type PermissionListResult = {
  success: boolean;
  data: Permission[];
  pagination: Pagination;
};

export type PermissionResult = {
  success: boolean;
  data: Permission;
  message?: string;
};

// ============= 角色相关类型 =============
export type Role = {
  /** 角色ID */
  id: string;
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description?: string;
  /** 继承的父角色 */
  inheritsFrom?: Role[];
  /** 被哪些角色继承 */
  inheritedBy?: Role[];
  /** 角色拥有的权限 */
  permissions?: Permission[];
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
};

export type CreateRoleRequest = {
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description?: string;
  /** 继承的父角色ID列表 */
  inheritsFrom?: string[];
};

export type UpdateRoleRequest = {
  /** 角色名称 */
  name?: string;
  /** 角色描述 */
  description?: string;
  /** 继承的父角色ID列表 */
  inheritsFrom?: string[];
};

export type AssignRolePermissionsRequest = {
  /** 权限ID列表 */
  permissionIds: string[];
};

export type RoleListResult = {
  success: boolean;
  data: Role[];
  pagination: Pagination;
};

export type RoleResult = {
  success: boolean;
  data: Role;
  message?: string;
};

// ============= 权限域(菜单)相关类型 =============
export type Scope = {
  /** 权限域ID */
  id: string;
  /** 名称 */
  name: string;
  /** 类型 */
  type: "menu" | "page" | "button";
  /** 图标 */
  icon?: string;
  /** 描述 */
  description?: string;
  /** 操作 */
  action?: string;
  /** 路径 */
  path?: string;
  /** 组件 */
  component?: string;
  /** 重定向 */
  redirect?: string;
  /** 排序 */
  order: number;
  /** 是否隐藏 */
  hidden: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 父级ID */
  parentId?: string;
  /** 父级权限域 */
  parent?: Scope;
  /** 子级权限域 */
  children?: Scope[];
  /** 关联的权限 */
  permission?: Permission;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
};

export type CreateScopeRequest = {
  /** 名称 */
  name: string;
  /** 类型 */
  type: "menu" | "page" | "button";
  /** 图标 */
  icon?: string;
  /** 描述 */
  description?: string;
  /** 操作 */
  action?: string;
  /** 路径 */
  path?: string;
  /** 组件 */
  component?: string;
  /** 重定向 */
  redirect?: string;
  /** 排序 */
  order: number;
  /** 是否隐藏 */
  hidden: boolean;
  /** 是否禁用 */
  disabled: boolean;
  /** 父级ID */
  parentId?: string;
  /** 关联的权限ID */
  permissionId?: string;
};

export type UpdateScopeRequest = {
  /** 名称 */
  name?: string;
  /** 类型 */
  type?: "menu" | "page" | "button";
  /** 图标 */
  icon?: string;
  /** 描述 */
  description?: string;
  /** 操作 */
  action?: string;
  /** 路径 */
  path?: string;
  /** 组件 */
  component?: string;
  /** 重定向 */
  redirect?: string;
  /** 排序 */
  order?: number;
  /** 是否隐藏 */
  hidden?: boolean;
  /** 是否禁用 */
  disabled?: boolean;
  /** 父级ID */
  parentId?: string;
  /** 关联的权限ID */
  permissionId?: string;
};

export type ScopeListResult = {
  success: boolean;
  data: Scope[];
  pagination: Pagination;
};

export type ScopeTreeResult = {
  success: boolean;
  data: Scope[];
};

export type ScopeResult = {
  success: boolean;
  data: Scope;
  message?: string;
};

// ============= 用户角色相关类型 =============
export type UserRole = {
  /** ID */
  id: string;
  /** 用户ID */
  userId: string;
  /** 角色ID */
  roleId: string;
  /** 用户信息 */
  user?: any;
  /** 角色信息 */
  role?: Role;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
};

export type AssignUserRoleRequest = {
  /** 用户ID */
  userId: string;
  /** 角色ID */
  roleId: string;
};

export type UserRoleListResult = {
  success: boolean;
  data: UserRole[];
  pagination: Pagination;
};

// ============= 权限API =============

/** 获取权限列表(分页) */
export const getPermissions = (data?: object) => {
  return http.request<PermissionListResult>("get", "/api/rbac/permissions", {
    params: data
  });
};

/** 获取所有权限(不分页) */
export const getAllPermissions = () => {
  return http.request<{ success: boolean; data: Permission[] }>(
    "get",
    "/api/rbac/permissions/all"
  );
};

/** 获取单个权限 */
export const getPermission = (id: string) => {
  return http.request<PermissionResult>("get", `/api/rbac/permissions/${id}`);
};

/** 创建权限 */
export const createPermission = (data: CreatePermissionRequest) => {
  return http.request<PermissionResult>("post", "/api/rbac/permissions", {
    data
  });
};

/** 更新权限 */
export const updatePermission = (id: string, data: UpdatePermissionRequest) => {
  return http.request<PermissionResult>("put", `/api/rbac/permissions/${id}`, {
    data
  });
};

/** 删除权限 */
export const deletePermission = (id: string) => {
  return http.request<any>("delete", `/api/rbac/permissions/${id}`);
};

// ============= 角色API =============

/** 获取角色列表(分页) */
export const getRoles = (data?: object) => {
  return http.request<RoleListResult>("get", "/api/rbac/roles", {
    params: data
  });
};

/** 获取所有角色(不分页) */
export const getAllRoles = () => {
  return http.request<{ success: boolean; data: Role[] }>(
    "get",
    "/api/rbac/roles/all"
  );
};

/** 获取单个角色 */
export const getRole = (id: string) => {
  return http.request<RoleResult>("get", `/api/rbac/roles/${id}`);
};

/** 创建角色 */
export const createRole = (data: CreateRoleRequest) => {
  return http.request<RoleResult>("post", "/api/rbac/roles", {
    data
  });
};

/** 更新角色 */
export const updateRole = (id: string, data: UpdateRoleRequest) => {
  return http.request<RoleResult>("put", `/api/rbac/roles/${id}`, {
    data
  });
};

/** 删除角色 */
export const deleteRole = (id: string) => {
  return http.request<any>("delete", `/api/rbac/roles/${id}`);
};

/** 分配角色权限 */
export const assignRolePermissions = (
  roleId: string,
  data: AssignRolePermissionsRequest
) => {
  return http.request<any>("post", `/api/rbac/roles/${roleId}/permissions`, {
    data
  });
};

/** 撤销角色权限 */
export const revokeRolePermission = (roleId: string, permissionId: string) => {
  return http.request<any>(
    "delete",
    `/api/rbac/roles/${roleId}/permissions/${permissionId}`
  );
};

// ============= 权限域(菜单)API =============

/** 获取权限域列表(分页) */
export const getScopes = (data?: object) => {
  return http.request<ScopeListResult>("get", "/api/rbac/scopes", {
    params: data
  });
};

/** 获取所有权限域(不分页) */
export const getAllScopes = () => {
  return http.request<{ success: boolean; data: Scope[] }>(
    "get",
    "/api/rbac/scopes/all"
  );
};

/** 获取权限域树形结构 */
export const getScopeTree = () => {
  return http.request<ScopeTreeResult>("get", "/api/rbac/scopes/tree");
};

/** 获取单个权限域 */
export const getScope = (id: string) => {
  return http.request<ScopeResult>("get", `/api/rbac/scopes/${id}`);
};

/** 创建权限域 */
export const createScope = (data: CreateScopeRequest) => {
  return http.request<ScopeResult>("post", "/api/rbac/scopes", {
    data
  });
};

/** 更新权限域 */
export const updateScope = (id: string, data: UpdateScopeRequest) => {
  return http.request<ScopeResult>("put", `/api/rbac/scopes/${id}`, {
    data
  });
};

/** 删除权限域 */
export const deleteScope = (id: string) => {
  return http.request<any>("delete", `/api/rbac/scopes/${id}`);
};

// ============= 用户角色API =============

/** 获取用户角色列表(分页) */
export const getUserRoleList = (data?: object) => {
  return http.request<UserRoleListResult>("get", "/api/rbac/user-roles", {
    params: data
  });
};

/** 分配用户角色 */
export const assignUserRole = (data: AssignUserRoleRequest) => {
  return http.request<any>("post", "/api/rbac/user-roles", {
    data
  });
};

/** 撤销用户角色 */
export const revokeUserRole = (userId: string, roleId: string) => {
  return http.request<any>(
    "delete",
    `/api/rbac/user-roles/users/${userId}/roles/${roleId}`
  );
};

/** 获取用户的所有角色 */
export const getUserRoles = (userId: string) => {
  return http.request<{ success: boolean; data: Role[] }>(
    "get",
    `/api/rbac/user-roles/users/${userId}/roles`
  );
};

/** 获取拥有指定角色的用户 */
export const getRoleUsers = (roleId: string, data?: object) => {
  return http.request<{
    success: boolean;
    data: any[];
    pagination?: Pagination;
  }>("get", `/api/rbac/user-roles/roles/${roleId}/users`, { params: data });
};

/** 获取拥有指定角色的用户带分页 */
export const getRoleUsersWithPagination = (roleId: string, data?: object) => {
  return http.request<{
    success: boolean;
    data: any[];
    pagination?: Pagination;
  }>("get", `/api/rbac/roles/${roleId}/users`, { params: data });
};

/** 获取角色树形结构 */
export const getRoleTree = () => {
  return http.request<{ success: boolean; data: Role[] }>(
    "get",
    "/api/rbac/roles/tree"
  );
};

/** 获取角色详细信息(包含继承的权限信息) */
export const getRoleWithPermissions = (roleId: string) => {
  return http.request<{
    success: boolean;
    data: {
      role: Role;
      publicPermissions: Permission[];
      directPermissions: Permission[];
      inheritedPermissions: { permission: Permission; fromRole: Role }[];
      allPermissions: Permission[];
    };
  }>("get", `/api/rbac/roles/${roleId}/permissions/detailed`);
};

/** 创建子角色 */
export const createChildRole = (
  parentRoleId: string,
  data: CreateRoleRequest
) => {
  return http.request<RoleResult>(
    "post",
    `/api/rbac/roles/${parentRoleId}/children`,
    {
      data
    }
  );
};

/** 解除父角色依赖 */
export const removeParentRole = (roleId: string, parentRoleId: string) => {
  return http.request<any>(
    "delete",
    `/api/rbac/roles/${roleId}/parents/${parentRoleId}`
  );
};

/** 添加父角色依赖 */
export const addParentRole = (roleId: string, parentRoleId: string) => {
  return http.request<any>(
    "post",
    `/api/rbac/roles/${roleId}/parents/${parentRoleId}`
  );
};

/** 获取可分配的权限(排除已有的直接权限和继承权限) */
export const getAssignablePermissions = (roleId: string) => {
  return http.request<{ success: boolean; data: Permission[] }>(
    "get",
    `/api/rbac/roles/${roleId}/assignable-permissions`
  );
};

/** 批量分配用户到角色 */
export const batchAssignUsersToRole = (
  roleId: string,
  data: { userIds: string[] }
) => {
  return http.request<any>(
    "post",
    `/api/rbac/roles/${roleId}/users/batch-assign`,
    {
      data
    }
  );
};

/** 批量从角色移除用户 */
export const batchRemoveUsersFromRole = (
  roleId: string,
  data: { userIds: string[] }
) => {
  return http.request<any>(
    "post",
    `/api/rbac/roles/${roleId}/users/batch-remove`,
    {
      data
    }
  );
};

/** 获取用户的所有权限 */
export const getUserPermissions = (userId: string) => {
  return http.request<{ success: boolean; data: Permission[] }>(
    "get",
    `/api/rbac/user-roles/users/${userId}/permissions`
  );
};

/** 检查用户权限 */
export const checkUserPermission = (userId: string, permissionId: string) => {
  return http.request<{ success: boolean; data: { hasPermission: boolean } }>(
    "get",
    `/api/rbac/user-roles/users/${userId}/permissions/${permissionId}/check`
  );
};
