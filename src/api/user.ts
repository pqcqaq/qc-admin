import { http } from "@/utils/http";

export type User = {
  /** 用户ID */
  id: string;
  /** 用户名 */
  name: string;
  /** 年龄 */
  age?: number;
  /** 性别 */
  sex?: string;
  /** 状态 */
  status?: string;
  /** 创建时间 */
  createTime?: string;
  /** 更新时间 */
  updateTime?: string;
};

export type Pagination = {
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
  /** 总记录数 */
  total: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
};

export type UserResult = {
  success: boolean;
  data: User;
  message?: string;
};

export type UserListResult = {
  success: boolean;
  data: Array<User>;
  pagination: Pagination;
};

export type RefreshTokenResult = {
  success: boolean;
  data: {
    /** `token` */
    token: string;
    /** 消息 */
    message: string;
  };
};

export type UserInfo = {
  /** 头像 */
  avatar: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname: string;
  /** 邮箱 */
  email: string;
  /** 联系电话 */
  phone: string;
  /** 简介 */
  description: string;
};

export type UserInfoResult = {
  success: boolean;
  data: UserInfo;
};

/** 获取用户列表 */
export const getUserList = (data?: object) => {
  return http.request<UserListResult>("get", "/api/users", {
    params: data
  });
};

/** 获取用户分页列表 */
export const getUserListWithPagination = (data?: object) => {
  return http.request<UserListResult>("get", "/api/users/page", {
    params: data
  });
};

/** 获取单个用户 */
export const getUser = (id: string) => {
  return http.request<UserResult>("get", `/api/users/${id}`);
};

/** 创建用户 */
export const createUser = (data: object) => {
  return http.request<UserResult>("post", "/api/users", {
    data
  });
};

/** 更新用户 */
export const updateUser = (id: string, data: object) => {
  return http.request<UserResult>("put", `/api/users/${id}`, {
    data
  });
};

/** 删除用户 */
export const deleteUser = (id: string) => {
  return http.request<any>("delete", `/api/users/${id}`);
};
