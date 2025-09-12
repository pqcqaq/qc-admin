const Layout = () => import("@/layout/index.vue");

export default {
  path: "/system",
  name: "System",
  component: Layout,
  redirect: "/system/user",
  meta: {
    icon: "ep/setting",
    title: "系统管理",
    rank: 10
  },
  children: [
    {
      path: "/system/user",
      name: "SystemUser",
      component: () => import("@/views/system/user/index.vue"),
      meta: {
        title: "用户管理",
        showLink: true
      }
    },
    {
      path: "/system/role",
      name: "SystemRole",
      component: () => import("@/views/system/role/index.vue"),
      meta: {
        title: "角色管理",
        showLink: true
      }
    },
    {
      path: "/system/permission",
      name: "SystemPermission",
      component: () => import("@/views/system/permission/index.vue"),
      meta: {
        title: "权限管理",
        showLink: true
      }
    },
    {
      path: "/system/menu",
      name: "SystemMenu",
      component: () => import("@/views/system/menu/index.vue"),
      meta: {
        title: "菜单管理",
        showLink: true
      }
    },
    {
      path: "/system/user-role",
      name: "SystemUserRole",
      component: () => import("@/views/system/user-role/index.vue"),
      meta: {
        title: "用户角色",
        showLink: true
      }
    },
    {
      path: "/system/attachment",
      name: "SystemAttachment",
      component: () => import("@/views/system/attachment/index.vue"),
      meta: {
        title: "附件管理",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
