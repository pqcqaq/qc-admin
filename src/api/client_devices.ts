import { http } from "@/utils/http";
import type { Pagination } from ".";

/** 角色信息 */
export type RoleInfo = {
  /** 角色ID */
  id: string;
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description?: string;
};

/** 客户端设备 */
export type ClientDevice = {
  /** 设备ID */
  id: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
  /** 设备名称 */
  name: string;
  /** 设备标识字符串(64位) */
  code: string;
  /** 是否启用 */
  enabled: boolean;
  /** accessToken超时时间(ms) */
  accessTokenExpiry: number;
  /** refreshToken超时时间(ms) */
  refreshTokenExpiry: number;
  /** 允许所有角色登录 */
  anonymous: boolean;
  /** 关联的角色列表 */
  roles?: RoleInfo[];
};

/** 根据code获取的客户端设备信息 */
export type ClientDeviceByCode = {
  /** 设备ID */
  id: string;
  /** 设备名称 */
  name: string;
  /** 设备标识字符串 */
  code: string;
  /** 是否启用 */
  enabled: boolean;
  /** accessToken超时时间(ms) */
  accessTokenExpiry: number;
  /** refreshToken超时时间(ms) */
  refreshTokenExpiry: number;
  /** 允许所有角色登录 */
  anonymous: boolean;
  /** 关联的角色列表 */
  roles?: RoleInfo[];
};

/** 创建客户端设备请求参数 */
export type CreateClientDeviceRequest = {
  /** 设备名称 */
  name: string;
  /** 是否启用 */
  enabled?: boolean;
  /** accessToken超时时间(ms) */
  accessTokenExpiry: number;
  /** refreshToken超时时间(ms) */
  refreshTokenExpiry: number;
  /** 允许所有角色登录 */
  anonymous?: boolean;
  /** 关联的角色ID列表 */
  roleIds?: string[];
};

/** 更新客户端设备请求参数 */
export type UpdateClientDeviceRequest = {
  /** 设备名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** accessToken超时时间(ms) */
  accessTokenExpiry: number;
  /** refreshToken超时时间(ms) */
  refreshTokenExpiry: number;
  /** 允许所有角色登录 */
  anonymous: boolean;
  /** 关联的角色ID列表 */
  roleIds?: string[];
};

/** 分页查询客户端设备请求参数 */
export type ClientDevicePageRequest = {
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
  /** 按code精确搜索 */
  code?: string;
  /** 按启用状态过滤 */
  enabled?: boolean;
  /** 按匿名登录过滤 */
  anonymous?: boolean;
  /** 开始时间 */
  beginTime?: string;
  /** 结束时间 */
  endTime?: string;
};

/** 检查客户端访问权限请求参数 */
export type CheckClientAccessRequest = {
  /** 客户端code */
  code: string;
  /** 用户ID */
  userId: string;
  /** 用户拥有的角色ID列表 */
  roles?: string[];
};

/** 检查客户端访问权限响应 */
export type CheckClientAccessResponse = {
  /** 是否允许访问 */
  allowed: boolean;
  /** 不允许访问的原因 */
  reason: string;
};

/** 客户端设备单个结果响应 */
export type ClientDeviceResult = {
  success: boolean;
  data: ClientDevice;
  message?: string;
};

/** 根据code查询客户端设备结果响应 */
export type ClientDeviceByCodeResult = {
  success: boolean;
  data: ClientDeviceByCode;
  message?: string;
};

/** 客户端设备列表结果响应 */
export type ClientDeviceListResult = {
  success: boolean;
  data: Array<ClientDevice>;
  count: number;
};

/** 客户端设备分页结果响应 */
export type ClientDevicePageResult = {
  success: boolean;
  data: Array<ClientDevice>;
  pagination: Pagination;
};

/** 删除客户端设备结果响应 */
export type ClientDeviceDeleteResult = {
  success: boolean;
  message: string;
};

/** 创建客户端设备结果响应 */
export type ClientDeviceCreateResult = {
  success: boolean;
  data: {
    id: string;
    name: string;
    code: string;
    enabled: boolean;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    anonymous: boolean;
    createTime: string;
    updateTime: string;
  };
  message?: string;
};

/** 更新客户端设备结果响应 */
export type ClientDeviceUpdateResult = {
  success: boolean;
  data: {
    id: string;
    name: string;
    code: string;
    enabled: boolean;
    accessTokenExpiry: number;
    refreshTokenExpiry: number;
    anonymous: boolean;
    createTime: string;
    updateTime: string;
  };
  message?: string;
};

/** 检查客户端访问权限结果响应 */
export type CheckClientAccessResult = {
  success: boolean;
  data: CheckClientAccessResponse;
};

/** 获取客户端设备列表 */
export const getClientDeviceList = (data?: ClientDevicePageRequest) => {
  return http.request<ClientDeviceListResult>("get", "/api/client-devices", {
    params: data
  });
};

/** 获取客户端设备分页列表 */
export const getClientDeviceListWithPagination = (
  data?: ClientDevicePageRequest
) => {
  return http.request<ClientDevicePageResult>(
    "get",
    "/api/client-devices/page",
    {
      params: data
    }
  );
};

/** 获取单个客户端设备记录 */
export const getClientDevice = (id: string) => {
  return http.request<ClientDeviceResult>("get", `/api/client-devices/${id}`);
};

/** 根据code获取客户端设备 */
export const getClientDeviceByCode = (code: string) => {
  return http.request<ClientDeviceByCodeResult>(
    "get",
    `/api/client-devices/code/${code}`
  );
};

/** 创建客户端设备记录 */
export const createClientDevice = (data: CreateClientDeviceRequest) => {
  return http.request<ClientDeviceCreateResult>("post", "/api/client-devices", {
    data
  });
};

/** 更新客户端设备记录 */
export const updateClientDevice = (
  id: string,
  data: UpdateClientDeviceRequest
) => {
  return http.request<ClientDeviceUpdateResult>(
    "put",
    `/api/client-devices/${id}`,
    {
      data
    }
  );
};

/** 删除客户端设备记录 */
export const deleteClientDevice = (id: string) => {
  return http.request<ClientDeviceDeleteResult>(
    "delete",
    `/api/client-devices/${id}`
  );
};

/** 检查客户端访问权限 */
export const checkClientAccess = (data: CheckClientAccessRequest) => {
  return http.request<CheckClientAccessResult>(
    "post",
    "/api/client-devices/check-access",
    {
      data
    }
  );
};

/** 导出客户端设备记录为Excel */
export const exportClientDevicesToExcel = (data?: ClientDevicePageRequest) => {
  return http.request<Blob>("get", "/api/client-devices/export", {
    params: data,
    responseType: "blob"
  });
};

/** 排序字段枚举 */
export const CLIENT_DEVICE_ORDER_BY_FIELDS = {
  CREATE_TIME: "create_time",
  UPDATE_TIME: "update_time",
  NAME: "name"
} as const;

/** 排序字段类型 */
export type ClientDeviceOrderByField =
  (typeof CLIENT_DEVICE_ORDER_BY_FIELDS)[keyof typeof CLIENT_DEVICE_ORDER_BY_FIELDS];

/** 排序方向枚举 */
export const ORDER_DIRECTIONS = {
  ASC: "asc",
  DESC: "desc"
} as const;

/** 排序方向类型 */
export type OrderDirection =
  (typeof ORDER_DIRECTIONS)[keyof typeof ORDER_DIRECTIONS];
