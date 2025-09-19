import { http } from "@/utils/http";
import type { Pagination } from ".";

export type Logging = {
  /** 日志ID */
  id: string;
  /** 日志级别 */
  level: "debug" | "info" | "error" | "warn" | "fatal";
  /** 日志类型 */
  type: "Error" | "Panic" | "manul";
  /** 消息内容 */
  message: string;
  /** HTTP方法 */
  method?: string;
  /** 请求路径 */
  path?: string;
  /** IP地址 */
  ip?: string;
  /** 查询参数 */
  query?: string;
  /** 状态码 */
  code?: number;
  /** 用户代理 */
  userAgent?: string;
  /** 附加数据 */
  data?: Record<string, any>;
  /** 堆栈信息 */
  stack?: string;
  /** 创建时间 */
  createTime: string;
  /** 更新时间 */
  updateTime: string;
};

export type LoggingResult = {
  success: boolean;
  data: Logging;
  message?: string;
};

export type LoggingListResult = {
  success: boolean;
  data: Array<Logging>;
  pagination: Pagination;
};

export type LoggingCountResult = {
  success: boolean;
  data: Array<Logging>;
  count: number;
};

/** 分页查询参数 */
export type LoggingPageParams = {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序方式 */
  order?: "asc" | "desc" | "";
  /** 排序字段 */
  orderBy?: "create_time" | "update_time" | "level" | "";
  /** 日志级别 */
  level?: "debug" | "info" | "error" | "warn" | "fatal" | "";
  /** 日志类型 */
  type?: "Error" | "Panic" | "manul" | "";
  /** 消息内容（模糊搜索） */
  message?: string;
  /** HTTP方法 */
  method?: string;
  /** 请求路径（模糊搜索） */
  path?: string;
  /** IP地址 */
  ip?: string;
  /** 状态码 */
  code?: number;
  /** 开始时间 */
  beginTime?: string;
  /** 结束时间 */
  endTime?: string;
};

/** 创建日志参数 */
export type CreateLoggingParams = {
  /** 日志级别 */
  level?: "debug" | "info" | "error" | "warn" | "fatal";
  /** 日志类型 */
  type?: "Error" | "Panic" | "manul";
  /** 消息内容 */
  message: string;
  /** HTTP方法 */
  method?: string;
  /** 请求路径 */
  path?: string;
  /** IP地址 */
  ip?: string;
  /** 查询参数 */
  query?: string;
  /** 状态码 */
  code?: number;
  /** 用户代理 */
  userAgent?: string;
  /** 附加数据 */
  data?: Record<string, any>;
  /** 堆栈信息 */
  stack?: string;
};

/** 更新日志参数 */
export type UpdateLoggingParams = {
  /** 日志级别 */
  level?: "debug" | "info" | "error" | "warn" | "fatal";
  /** 日志类型 */
  type?: "Error" | "Panic" | "manul";
  /** 消息内容 */
  message: string;
  /** HTTP方法 */
  method?: string;
  /** 请求路径 */
  path?: string;
  /** IP地址 */
  ip?: string;
  /** 查询参数 */
  query?: string;
  /** 状态码 */
  code?: number;
  /** 用户代理 */
  userAgent?: string;
  /** 附加数据 */
  data?: Record<string, any>;
  /** 堆栈信息 */
  stack?: string;
};

/** 导出Excel参数 */
export type ExportLoggingParams = {
  /** 页码 */
  page?: number;
  /** 每页数量 */
  pageSize?: number;
  /** 排序方式 */
  order?: "asc" | "desc" | "";
  /** 排序字段 */
  orderBy?: "create_time" | "update_time" | "level" | "";
  /** 日志级别 */
  level?: "debug" | "info" | "error" | "warn" | "fatal" | "";
  /** 日志类型 */
  type?: "Error" | "Panic" | "manul" | "";
  /** 消息内容（模糊搜索） */
  message?: string;
  /** HTTP方法 */
  method?: string;
  /** 请求路径（模糊搜索） */
  path?: string;
  /** IP地址 */
  ip?: string;
  /** 状态码 */
  code?: number;
  /** 开始时间 */
  beginTime?: string;
  /** 结束时间 */
  endTime?: string;
};

/** 获取日志列表 */
export const getLoggingList = (params?: LoggingPageParams) => {
  return http.request<LoggingCountResult>("get", "/api/loggings", {
    params
  });
};

/** 获取日志分页列表 */
export const getLoggingListWithPagination = (params?: LoggingPageParams) => {
  return http.request<LoggingListResult>("get", "/api/loggings/page", {
    params
  });
};

/** 获取单个日志 */
export const getLogging = (id: string) => {
  return http.request<LoggingResult>("get", `/api/loggings/${id}`);
};

/** 创建日志 */
export const createLogging = (data: CreateLoggingParams) => {
  return http.request<LoggingResult>("post", "/api/loggings", {
    data
  });
};

/** 更新日志 */
export const updateLogging = (id: string, data: UpdateLoggingParams) => {
  return http.request<LoggingResult>("put", `/api/loggings/${id}`, {
    data
  });
};

/** 删除日志 */
export const deleteLogging = (id: string) => {
  return http.request<any>("delete", `/api/loggings/${id}`);
};

/** 导出日志为Excel */
export const exportLoggingsToExcel = (params?: ExportLoggingParams) => {
  return http.request<Blob>("get", "/api/loggings/export", {
    params,
    responseType: "blob"
  });
};
