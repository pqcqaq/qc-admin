import { http } from "@/utils/http";
import type { Permission } from "./rbac";
import type { Pagination } from ".";

/** API认证记录 */
export type APIAuth = {
  /** API认证ID */
  id: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** API名称 */
  name: string;
  /** API描述 */
  description?: string;
  /** HTTP方法 */
  method: string;
  /** API路径 */
  path: string;
  /** 是否为公开API */
  isPublic: boolean;
  /** 是否启用 */
  isActive: boolean;
  /** 额外的元数据信息 */
  metadata?: Record<string, unknown>;
  // 所需权限
  permissions: Permission[];
};

/** 创建API认证请求参数 */
export type CreateAPIAuthRequest = {
  /** API名称 */
  name: string;
  /** API描述 */
  description?: string;
  /** HTTP方法 */
  method: string;
  /** API路径 */
  path: string;
  /** 是否为公开API */
  isPublic: boolean;
  /** 是否启用 */
  isActive: boolean;
  /** 额外的元数据信息 */
  metadata?: Record<string, unknown>;
};

/** 更新API认证请求参数 */
export type UpdateAPIAuthRequest = {
  /** API名称 */
  name: string;
  /** API描述 */
  description?: string;
  /** HTTP方法 */
  method: string;
  /** API路径 */
  path: string;
  /** 是否为公开API */
  isPublic: boolean;
  /** 是否启用 */
  isActive: boolean;
  /** 额外的元数据信息 */
  metadata?: Record<string, unknown>;
};

/** 分页查询API认证请求参数 */
export type APIAuthPageRequest = {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序方式 asc|desc */
  order?: "asc" | "desc";
  /** 排序字段 */
  orderBy?: "create_time" | "update_time" | "name";
  /** 按名称模糊搜索 */
  name?: string;
  /** 按HTTP方法过滤 */
  method?: string;
  /** 按路径模糊搜索 */
  path?: string;
  /** 按是否公开过滤 */
  isPublic?: boolean;
  /** 按是否启用过滤 */
  isActive?: boolean;
  /** 开始时间 */
  beginTime?: string;
  /** 结束时间 */
  endTime?: string;
};

/** API认证单个结果响应 */
export type APIAuthResult = {
  success: boolean;
  data: APIAuth;
  message?: string;
};

/** API认证列表结果响应 */
export type APIAuthListResult = {
  success: boolean;
  data: Array<APIAuth>;
  count: number;
};

/** API认证分页结果响应 */
export type APIAuthPageResult = {
  success: boolean;
  data: Array<APIAuth>;
  pagination: Pagination;
};

/** 删除API认证结果响应 */
export type APIAuthDeleteResult = {
  success: boolean;
  message: string;
};

/** 创建API认证结果响应 */
export type APIAuthCreateResult = {
  success: boolean;
  data: {
    id: string;
    name: string;
    description?: string;
    method: string;
    path: string;
    isPublic: boolean;
    isActive: boolean;
    metadata?: Record<string, unknown>;
    createTime: string;
    updateTime: string;
  };
  message?: string;
};

/** 更新API认证结果响应 */
export type APIAuthUpdateResult = {
  success: boolean;
  data: {
    id: string;
    name: string;
    description?: string;
    method: string;
    path: string;
    isPublic: boolean;
    isActive: boolean;
    metadata?: Record<string, unknown>;
    createTime: string;
    updateTime: string;
  };
  message?: string;
};

/** 获取API认证列表 */
export const getAPIAuthList = (data?: APIAuthPageRequest) => {
  return http.request<APIAuthListResult>("get", "/api/apiauth", {
    params: data
  });
};

/** 获取API认证分页列表 */
export const getAPIAuthListWithPagination = (data?: APIAuthPageRequest) => {
  return http.request<APIAuthPageResult>("get", "/api/apiauth/page", {
    params: data
  });
};

/** 获取单个API认证记录 */
export const getAPIAuth = (id: string) => {
  return http.request<APIAuthResult>("get", `/api/apiauth/${id}`);
};

/** 创建API认证记录 */
export const createAPIAuth = (data: CreateAPIAuthRequest) => {
  return http.request<APIAuthCreateResult>("post", "/api/apiauth", {
    data
  });
};

/** 更新API认证记录 */
export const updateAPIAuth = (id: string, data: UpdateAPIAuthRequest) => {
  return http.request<APIAuthUpdateResult>("put", `/api/apiauth/${id}`, {
    data
  });
};

/** 删除API认证记录 */
export const deleteAPIAuth = (id: string) => {
  return http.request<APIAuthDeleteResult>("delete", `/api/apiauth/${id}`);
};

/** 导出API认证记录为Excel */
export const exportAPIAuthsToExcel = (data?: APIAuthPageRequest) => {
  return http.request<Blob>("get", "/api/apiauth/export", {
    params: data,
    responseType: "blob"
  });
};

// /** HTTP方法枚举 */
// export const HTTP_METHODS = {
//   GET: "GET",
//   POST: "POST",
//   PUT: "PUT",
//   DELETE: "DELETE",
//   PATCH: "PATCH",
//   HEAD: "HEAD",
//   OPTIONS: "OPTIONS"
// } as const;

// /** HTTP方法类型 */
// export type HTTPMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

// /** 排序字段枚举 */
// export const ORDER_BY_FIELDS = {
//   CREATE_TIME: "create_time",
//   UPDATE_TIME: "update_time",
//   NAME: "name"
// } as const;

// /** 排序字段类型 */
// export type OrderByField =
//   (typeof ORDER_BY_FIELDS)[keyof typeof ORDER_BY_FIELDS];

// /** 排序方向枚举 */
// export const ORDER_DIRECTIONS = {
//   ASC: "asc",
//   DESC: "desc"
// } as const;

// /** 排序方向类型 */
// export type OrderDirection =
//   (typeof ORDER_DIRECTIONS)[keyof typeof ORDER_DIRECTIONS];
