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

// 获取权限域树形结构（用于菜单管理）
export const getScopeTree = () => {
  return http.request<ScopeTreeResult>("get", "/api/rbac/scopes/tree");
};

// 获取所有权限域树（管理员使用）
export const getAllScopes = () => {
  return http.request<ScopeTreeResult>("get", "/api/rbac/scopes/tree");
};

// 获取当前用户的菜单树
export const getUserMenuTree = () => {
  return http
    .request<ScopeTreeResult>("get", "/api/auth/user-menu-tree")
    .then(response => {
      console.log("用户菜单树原始响应:", response);
      if (response.success && response.data) {
        // 转换后端数据为前端路由格式
        const transformedRoutes = response.data
          .filter(scope => !scope.disabled && scope.type !== "button") // 过滤禁用的和按钮类型
          .sort((a, b) => a.order - b.order) // 按order排序
          .map(scope => transformScopeToRoute(scope));

        console.log("转换后的路由数据:", transformedRoutes);

        return {
          success: true,
          data: transformedRoutes
        };
      }
      return { success: false, data: [] };
    })
    .catch(error => {
      console.error("获取用户菜单树失败:", error);
      return { success: false, data: [] };
    });
};

// 将后端Scope数据转换为前端路由格式
function transformScopeToRoute(scope: ScopeResponse): any {
  // 生成唯一的路由名称
  const generateRouteName = (path: string, title: string) => {
    if (path && path !== "/") {
      // 将路径转换为驼峰命名
      return path
        .split("/")
        .filter(segment => segment)
        .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join("");
    }
    return title.replace(/\s+/g, "").replace(/[^\w]/g, "");
  };

  const route: any = {
    path: scope.path || `/${scope.name.toLowerCase().replace(/\s+/g, "-")}`,
    name: generateRouteName(scope.path, scope.name),
    meta: {
      title: scope.name,
      icon: scope.icon || "ep/menu",
      rank: scope.order || 0,
      showLink: !scope.hidden
    }
  };

  // 如果有描述，添加到meta中
  if (scope.description) {
    route.meta.description = scope.description;
  }

  // 根据类型设置不同属性
  if (scope.type === "menu") {
    // 顶级菜单需要使用Layout组件
    if (!scope.parentId || scope.parentId === "0") {
      // 顶级菜单，设置component为layout路径，addAsyncRoutes会处理
      route.component = "/src/layout/index.vue";

      // 处理子路由
      if (scope.children && scope.children.length > 0) {
        route.children = scope.children
          .filter(child => !child.disabled && child.type !== "button") // 过滤禁用的和按钮类型
          .sort((a, b) => a.order - b.order) // 按order排序
          .map(child => transformScopeToRoute(child));
      }

      // 设置重定向
      if (scope.redirect) {
        route.redirect = scope.redirect;
      } else if (route.children && route.children.length > 0) {
        // 默认重定向到第一个子路由
        route.redirect = route.children[0].path;
      }
    } else {
      // 子级菜单目录
      if (scope.children && scope.children.length > 0) {
        route.children = scope.children
          .filter(child => !child.disabled && child.type !== "button")
          .sort((a, b) => a.order - b.order)
          .map(child => transformScopeToRoute(child));
      }
    }
  } else if (scope.type === "page") {
    // 页面类型，设置组件路径
    if (scope.component) {
      // 如果component已经是完整路径（以/src/开头），直接使用
      if (scope.component.startsWith("/src/")) {
        route.component = scope.component;
      }
      // 如果component以views/开头，去掉views/前缀后添加/src/views/
      else if (scope.component.startsWith("views/")) {
        route.component = `/src/${scope.component}`;
      }
      // 其他情况，添加/src/views/前缀
      else {
        route.component = `/src/views/${scope.component}`;
      }
    } else if (scope.path) {
      // 根据路径推断组件路径，修复重复views的问题
      const componentPath = scope.path.replace(/^\//, "").replace(/\/$/, "");
      route.component = `/src/views/${componentPath}/index.vue`;
    }
  }

  return route;
}

// 获取用户权限
export const getUserPermissions = (userId: string) => {
  return http.request<any>(
    "get",
    `/api/rbac/user-roles/users/${userId}/permissions`
  );
};

// 检查用户权限
export const checkUserPermission = (userId: string, permissionId: string) => {
  return http.request<any>(
    "get",
    `/api/rbac/user-roles/users/${userId}/permissions/${permissionId}/check`
  );
};
