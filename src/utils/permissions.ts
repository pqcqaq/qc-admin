import { ref, computed } from "vue";
import { getUserButtonPermissions, checkUserPermission } from "@/api/menu";
import { useUserStoreHook } from "@/store/modules/user";

// 用户权限状态
const userPermissions = ref<string[]>([]);
const permissionsLoaded = ref(false);

// 加载用户权限
export const loadUserPermissions = async () => {
  try {
    const result = await getUserButtonPermissions();
    if (result.success) {
      userPermissions.value = result.data;
      permissionsLoaded.value = true;
    }
  } catch (error) {
    console.error("加载用户权限失败:", error);
  }
};

// 检查用户是否有指定权限
export const hasPermission = (permission: string | string[]): boolean => {
  if (!permissionsLoaded.value) {
    return false;
  }

  if (Array.isArray(permission)) {
    // 数组权限，只要有一个匹配即可
    return permission.some(p => userPermissions.value.includes(p));
  } else {
    // 单个权限
    return userPermissions.value.includes(permission);
  }
};

// 检查用户是否有所有指定权限
export const hasAllPermissions = (permissions: string[]): boolean => {
  if (!permissionsLoaded.value) {
    return false;
  }

  return permissions.every(p => userPermissions.value.includes(p));
};

// 检查用户角色
export const hasRole = (role: string | string[]): boolean => {
  const userStore = useUserStoreHook();
  const userRoles = userStore.roles || [];

  if (Array.isArray(role)) {
    return role.some(r => userRoles.includes(r));
  } else {
    return userRoles.includes(role);
  }
};

// 检查用户是否是管理员
export const isAdmin = computed(() => {
  return hasRole("admin");
});

// 远程检查权限（调用后端API）
export const checkRemotePermission = async (
  permissionId: string
): Promise<boolean> => {
  try {
    const result = await checkUserPermission(permissionId);
    return result.success && result.data;
  } catch (error) {
    console.error("检查远程权限失败:", error);
    return false;
  }
};

// 权限指令函数
export const permissionDirective = {
  mounted(el: HTMLElement, binding: any) {
    const { value } = binding;

    if (value) {
      const hasAuth = hasPermission(value);
      if (!hasAuth) {
        el.style.display = "none";
      }
    }
  },
  updated(el: HTMLElement, binding: any) {
    const { value } = binding;

    if (value) {
      const hasAuth = hasPermission(value);
      if (!hasAuth) {
        el.style.display = "none";
      } else {
        el.style.display = "";
      }
    }
  }
};

// 导出权限相关的响应式数据
export const usePermissions = () => {
  return {
    userPermissions: computed(() => userPermissions.value),
    permissionsLoaded: computed(() => permissionsLoaded.value),
    hasPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    loadUserPermissions,
    checkRemotePermission
  };
};
