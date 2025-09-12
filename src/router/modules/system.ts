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
