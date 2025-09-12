const Layout = () => import("@/layout/index.vue");

export default {
  path: "/test",
  name: "Test",
  component: Layout,
  redirect: "/test/menu-tree",
  meta: {
    icon: "ep/data-analysis",
    title: "测试页面",
    rank: 99
  },
  children: [
    {
      path: "/test/menu-tree",
      name: "TestMenuTree",
      component: () => import("@/views/test/menu-tree.vue"),
      meta: {
        title: "用户菜单树测试",
        showLink: true
      }
    }
  ]
} satisfies RouteConfigsTable;
