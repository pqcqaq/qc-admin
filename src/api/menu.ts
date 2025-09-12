import { http } from "@/utils/http";

// 后端Scope响应类型
interface ScopeResponse {
  id: string;
  name: string;
  type: string; // "menu" | "page" | "button"
  icon?: string;
  description?: string;
  action?: string;
  path?: string;
  component?: string;
  redirect?: string;
  order: number;
  hidden: boolean;
  disabled: boolean;
  parentId?: string;
  parent?: ScopeResponse;
  children?: ScopeResponse[];
  permissions?: any[];
  createTime: string;
  updateTime: string;
}

interface ScopeTreeResult {
  success: boolean;
  data: ScopeResponse[];
}

// 将后端Scope数据转换为前端路由格式
function transformScopeToRoute(scope: ScopeResponse): any {
  const route: any = {
    path: scope.path || `/${scope.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: scope.name.replace(/\s+/g, ""),
    meta: {
      title: scope.name,
      icon: scope.icon,
      rank: scope.order,
      showLink: !scope.hidden,
      roles: ["admin", "common"] // 这里可以根据权限进一步细化
    }
  };

  // 如果有描述，添加到meta中
  if (scope.description) {
    route.meta.description = scope.description;
  }

  // 根据类型设置不同属性
  if (scope.type === "menu") {
    // 菜单类型，通常作为父级路由
    if (scope.children && scope.children.length > 0) {
      route.children = scope.children
        .filter(child => !child.disabled && child.type !== "button") // 过滤禁用的和按钮类型
        .sort((a, b) => a.order - b.order) // 按order排序
        .map(child => transformScopeToRoute(child));
    }

    // 如果有重定向路径
    if (scope.redirect) {
      route.redirect = scope.redirect;
    } else if (route.children && route.children.length > 0) {
      // 默认重定向到第一个子路由
      route.redirect = route.children[0].path;
    }
  } else if (scope.type === "page") {
    // 页面类型，设置组件路径
    if (scope.component) {
      route.component = scope.component;
    } else if (scope.path) {
      // 如果没有指定组件，根据路径推断
      route.component =
        scope.path.replace(/^\//, "").replace(/\//g, "/") + "/index";
    }
  } else if (scope.type === "button") {
    // 按钮类型，设置权限
    if (scope.action) {
      route.meta.auths = [scope.action];
    }
    // 按钮类型通常不作为路由，在转换过程中已过滤
  }

  return route;
}

// 获取当前用户的菜单权限（通过用户角色获取）
export const getUserMenus = async () => {
  try {
    // 1. 先获取用户信息，了解用户角色
    const userInfo = await http.request<any>("get", "/api/auth/user-info");

    if (!userInfo.success || !userInfo.data) {
      throw new Error("获取用户信息失败");
    }

    // const userId = userInfo.data.id;

    // 2. 获取用户的权限域（这里需要一个新的API接口）
    // 临时使用所有权限域，后续可以根据用户权限过滤
    const scopeTree = await http.request<ScopeTreeResult>(
      "get",
      "/api/rbac/scopes/tree"
    );

    if (scopeTree.success && scopeTree.data) {
      // 转换后端数据为前端路由格式
      const transformedRoutes = scopeTree.data
        .filter(scope => !scope.disabled && scope.type !== "button") // 过滤禁用的和按钮类型
        .sort((a, b) => a.order - b.order) // 按order排序
        .map(scope => transformScopeToRoute(scope));

      return {
        success: true,
        data: transformedRoutes
      };
    }

    return { success: false, data: [] };
  } catch (error) {
    console.error("获取用户菜单失败:", error);
    return { success: false, data: [] };
  }
};

// 获取所有权限域树（管理员使用）
export const getAllScopes = () => {
  return http
    .request<ScopeTreeResult>("get", "/api/rbac/scopes/tree")
    .then(response => {
      if (response.success && response.data) {
        const transformedRoutes = response.data
          .filter(scope => !scope.disabled && scope.type !== "button")
          .sort((a, b) => a.order - b.order)
          .map(scope => transformScopeToRoute(scope));

        return {
          success: true,
          data: transformedRoutes
        };
      }
      return { success: false, data: [] };
    })
    .catch(error => {
      console.error("获取权限域失败:", error);
      return { success: false, data: [] };
    });
};

// 获取用户按钮权限
export const getUserButtonPermissions = async () => {
  try {
    const userInfo = await http.request<any>("get", "/api/auth/user-info");

    if (!userInfo.success || !userInfo.data) {
      return { success: false, data: [] };
    }

    const userId = userInfo.data.id;

    // 获取用户的所有权限
    const userPermissions = await http.request<any>(
      "get",
      `/api/rbac/user-roles/users/${userId}/permissions`
    );

    if (userPermissions.success && userPermissions.data) {
      // 提取按钮级别的权限
      const buttonPermissions = userPermissions.data
        .filter((perm: any) => perm.type === "button")
        .map((perm: any) => perm.action || perm.name);

      return {
        success: true,
        data: buttonPermissions
      };
    }

    return { success: false, data: [] };
  } catch (error) {
    console.error("获取用户按钮权限失败:", error);
    return { success: false, data: [] };
  }
};

// 检查用户是否有指定权限
export const checkUserPermission = async (permissionId: string) => {
  try {
    const userInfo = await http.request<any>("get", "/api/auth/user-info");

    if (!userInfo.success || !userInfo.data) {
      return { success: false, data: false };
    }

    const userId = userInfo.data.id;

    const result = await http.request<any>(
      "get",
      `/api/rbac/user-roles/users/${userId}/permissions/${permissionId}/check`
    );

    return result;
  } catch (error) {
    console.error("检查用户权限失败:", error);
    return { success: false, data: false };
  }
};
