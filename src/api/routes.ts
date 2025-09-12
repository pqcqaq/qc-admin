import { http } from "@/utils/http";
import { getUserMenus, getAllScopes } from "./menu";

type Result = {
  success: boolean;
  data: Array<any>;
};

// 获取动态路由 - 从后端用户菜单权限
export const getAsyncRoutes = () => {
  return getUserMenus();
};

// 保留原有的mock接口作为备用
export const getAsyncRoutesMock = () => {
  return http.request<Result>("get", "/get-async-routes");
};

// 管理员获取所有权限域路由
export const getAllAsyncRoutes = () => {
  return getAllScopes();
};
