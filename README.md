# 🎨 QC-Admin 管理系统前端

[![license](https://img.shields.io/github/license/pqcqaq/qc-admin.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-latest-409eff.svg)](https://element-plus.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

**中文** | [English](./README.en-US.md)

## 📖 项目简介

QC-Admin 是一个基于 Vue 3 + TypeScript + Element Plus 的现代化企业级后台管理系统前端模板。采用最新的前端技术栈，提供开箱即用的后台管理解决方案。

### ✨ 核心特性

- 🚀 **最新技术栈**: Vue 3 + Vite 5 + TypeScript + Pinia
- 💎 **优质UI组件**: Element Plus + TailwindCSS
- 🌍 **国际化支持**: 内置完整的 i18n 多语言方案
- 🎯 **TypeScript**: 严格的类型检查，提升开发体验
- 🔐 **完整权限**: 内置 RBAC 权限管理系统
- 📱 **响应式设计**: 支持移动端和桌面端自适应
- 🎨 **主题定制**: 支持深色/浅色主题切换
- 📦 **极致优化**: 生产环境打包体积 < 2.3MB (启用 brotli 后 < 350kb)

## 🔗 配套项目

- **后端服务**: [qc-admin-go-backend](../qc-admin-go-backend) - Go 语言后端服务
- **移动端**: [qc-admin-app](../qc-admin-app) - uni-app 多端应用
- **通用API**: [qc-admin-api-common](../qc-admin-api-common) - API 接口封装

## 📋 环境要求

- **Node.js**: >= 18.x
- **pnpm**: >= 8.x (推荐使用 pnpm)
- **浏览器**: 支持现代浏览器 (Chrome, Firefox, Safari, Edge 等)

## 🚀 快速开始

### 1. 安装依赖

```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install

# 或使用 yarn
yarn install
```

### 2. 启动开发服务器

```bash
# 开发模式
pnpm dev

# 或
pnpm serve
```

访问 <http://localhost:5173>

### 3. 构建生产版本

```bash
# 生产环境构建
pnpm build

# 预发布环境构建
pnpm build:staging

# 构建并预览
pnpm preview:build
```

### 4. 预览构建结果

```bash
pnpm preview
```

## 📁 项目结构

```
qc-admin/
├── build/                    # 构建配置
│   ├── cdn.ts               # CDN 配置
│   ├── compress.ts          # 压缩配置
│   ├── info.ts              # 构建信息
│   ├── optimize.ts          # 优化配置
│   ├── plugins.ts           # Vite 插件配置
│   └── utils.ts             # 构建工具函数
├── locales/                  # 国际化资源
│   ├── en.yaml              # 英文
│   └── zh-CN.yaml           # 简体中文
├── mock/                     # Mock 数据
│   ├── asyncRoutes.ts       # 动态路由 Mock
│   ├── login.ts             # 登录接口 Mock
│   └── refreshToken.ts      # Token 刷新 Mock
├── public/                   # 静态资源
│   └── platform-config.json # 平台配置
├── src/                      # 源代码目录
│   ├── assets/              # 静态资源
│   ├── components/          # 全局组件
│   ├── composables/         # 组合式函数
│   ├── config/              # 应用配置
│   ├── directives/          # 自定义指令
│   ├── layout/              # 布局组件
│   ├── plugins/             # 插件
│   ├── router/              # 路由配置
│   ├── store/               # 状态管理 (Pinia)
│   ├── style/               # 全局样式
│   ├── utils/               # 工具函数
│   ├── views/               # 页面组件
│   ├── App.vue              # 根组件
│   └── main.ts              # 应用入口
├── types/                    # TypeScript 类型定义
├── .env                      # 环境变量
├── .env.development          # 开发环境变量
├── .env.production           # 生产环境变量
├── .env.staging              # 预发布环境变量
├── index.html                # HTML 入口
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
└── vite.config.ts            # Vite 配置
```

## 🔧 配置说明

### 环境变量

项目支持多环境配置，通过 `.env` 文件管理：

```bash
# .env.development
VITE_APP_TITLE=QC-Admin 开发环境
VITE_APP_BASE_API=http://localhost:8080/api/v1
VITE_APP_SOCKET_URL=ws://localhost:8081/ws

# .env.production
VITE_APP_TITLE=QC-Admin 生产环境
VITE_APP_BASE_API=https://api.example.com/api/v1
VITE_APP_SOCKET_URL=wss://api.example.com/ws
```

### 平台配置

编辑 `public/platform-config.json` 配置平台信息：

```json
{
  "title": "QC-Admin 管理系统",
  "logo": "/logo.svg",
  "theme": {
    "primaryColor": "#409eff",
    "darkMode": false
  },
  "copyright": "© 2024 QC-Admin"
}
```

## 🎨 功能模块

### 1. 用户认证

- ✅ 登录/注册
- ✅ 密码重置
- ✅ 验证码登录
- ✅ 第三方登录集成
- ✅ Token 自动刷新

### 2. 权限管理 (RBAC)

- ✅ 用户管理
- ✅ 角色管理
- ✅ 权限管理
- ✅ 菜单管理
- ✅ 角色继承
- ✅ 权限域管理

### 3. 系统监控

- ✅ 系统状态实时监控
- ✅ CPU/内存/磁盘使用率
- ✅ 网络流量统计
- ✅ 历史数据图表展示
- ✅ 自动刷新机制

### 4. 文件管理

- ✅ 文件上传/下载
- ✅ 图片预览
- ✅ 批量操作
- ✅ S3 存储集成

### 5. 数据导出

- ✅ Excel 导出
- ✅ JSON 导出
- ✅ 自定义导出模板
- ✅ 批量导出

### 6. WebSocket 通信

- ✅ 实时消息推送
- ✅ 在线状态同步
- ✅ 断线重连
- ✅ 心跳检测

## 📦 技术栈

### 核心框架

- **Vue 3**: 渐进式 JavaScript 框架
- **Vite 5**: 下一代前端构建工具
- **TypeScript 5**: JavaScript 的超集
- **Pinia**: Vue 3 官方状态管理库

### UI 框架

- **Element Plus**: Vue 3 组件库
- **TailwindCSS**: 原子化 CSS 框架
- **UnoCSS**: 即时按需原子化 CSS 引擎

### 工具库

- **Axios**: HTTP 客户端
- **Day.js**: 轻量级日期处理库
- **ECharts**: 数据可视化图表库
- **VueUse**: Vue 组合式 API 工具集

### 开发工具

- **ESLint**: 代码检查工具
- **Prettier**: 代码格式化工具
- **Stylelint**: CSS 代码检查工具
- **Husky**: Git hooks 工具
- **Commitlint**: Commit 规范检查

## 🎯 开发指南

### 添加新页面

1. 在 `src/views/` 下创建页面组件
2. 在 `src/router/` 配置路由
3. 在后端配置对应的菜单权限

```typescript
// src/router/modules/example.ts
export default {
  path: "/example",
  name: "Example",
  component: () => import("@/views/example/index.vue"),
  meta: {
    title: "示例页面",
    icon: "example",
    roles: ["admin"]
  }
};
```

### 添加新组件

```vue
<!-- src/components/MyComponent.vue -->
<script setup lang="ts">
import { ref } from "vue";

const props = defineProps<{
  title: string;
}>();

const emit = defineEmits<{
  change: [value: string];
}>();
</script>

<template>
  <div class="my-component">
    <h2>{{ title }}</h2>
    <slot />
  </div>
</template>

<style scoped>
.my-component {
  @apply p-4 bg-white rounded shadow;
}
</style>
```

### 状态管理

使用 Pinia 管理全局状态：

```typescript
// src/store/modules/example.ts
import { defineStore } from "pinia";

export const useExampleStore = defineStore("example", {
  state: () => ({
    count: 0,
    name: "example"
  }),

  getters: {
    doubleCount: state => state.count * 2
  },

  actions: {
    increment() {
      this.count++;
    }
  }
});
```

### API 请求

```typescript
// src/api/example.ts
import { http } from "@/utils/http";

export interface ExampleData {
  id: number;
  name: string;
}

// 获取列表
export const getExampleList = (params?: any) => {
  return http.request<ExampleData[]>("get", "/examples", { params });
};

// 创建
export const createExample = (data: Partial<ExampleData>) => {
  return http.request<ExampleData>("post", "/examples", { data });
};

// 更新
export const updateExample = (id: number, data: Partial<ExampleData>) => {
  return http.request<ExampleData>("put", `/examples/${id}`, { data });
};

// 删除
export const deleteExample = (id: number) => {
  return http.request("delete", `/examples/${id}`);
};
```

## 🔨 代码规范

### Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关

```bash
# 示例
git commit -m "feat: 添加用户管理页面"
git commit -m "fix: 修复登录验证码显示问题"
git commit -m "docs: 更新 README 文档"
```

### 代码检查

```bash
# ESLint 检查
pnpm lint:eslint

# Prettier 格式化
pnpm lint:prettier

# Stylelint 检查
pnpm lint:stylelint

# 执行所有检查
pnpm lint
```

### 类型检查

```bash
pnpm typecheck
```

## 🚀 构建优化

### 1. CDN 加速

编辑 `build/cdn.ts` 配置 CDN：

```typescript
export const cdn = {
  build: {
    // 生产环境使用 CDN
    cdn: {
      css: [],
      js: [
        "https://cdn.jsdelivr.net/npm/vue@3/dist/vue.global.prod.js",
        "https://cdn.jsdelivr.net/npm/vue-router@4/dist/vue-router.global.prod.js"
      ]
    }
  }
};
```

### 2. Gzip/Brotli 压缩

```bash
# 已在构建配置中启用
# 生产构建时自动生成 .gz 和 .br 文件
pnpm build
```

### 3. 代码分割

Vite 会自动进行代码分割，将第三方库和业务代码分离。

### 4. Tree Shaking

确保使用 ES Module 导入，自动去除未使用的代码。

## 📊 性能指标

- **首屏加载**: < 1s (在 3G 网络下)
- **白屏时间**: < 500ms
- **首次内容绘制**: < 800ms
- **可交互时间**: < 1.5s
- **包体积**: < 2.3MB (未压缩), < 350kb (Brotli 压缩)

## 🐳 Docker 部署

### Dockerfile

```dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 构建和运行

```bash
# 构建镜像
docker build -t qc-admin:latest .

# 运行容器
docker run -d -p 80:80 --name qc-admin qc-admin:latest
```

## 🌐 Nginx 配置

```nginx
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 单页应用路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket 代理
    location /ws/ {
        proxy_pass http://backend:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # 缓存静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

## 🔗 相关链接

### 官方文档

- [Vue 3 文档](https://cn.vuejs.org/)
- [Vite 文档](https://cn.vitejs.dev/)
- [Element Plus 文档](https://element-plus.org/zh-CN/)
- [TypeScript 文档](https://www.typescriptlang.org/zh/)
- [Pinia 文档](https://pinia.vuejs.org/zh/)

### 项目文档

- [后端 API 文档](../qc-admin-go-backend/README.md)
- [RBAC 权限文档](../qc-admin-go-backend/README_AUTH.md)
- [系统监控文档](../qc-admin-go-backend/README_SYSTEM_MONITOR.md)
- [文件上传文档](../qc-admin-go-backend/README_UPLOAD_API.md)

### 配套资源

- [UI 设计视频](https://www.bilibili.com/video/BV17g411T7rq)
- [快速开发教程](https://www.bilibili.com/video/BV1kg411v7QT)
- [在线预览](https://qc-admin-thin.netlify.app/#/login)

## 🤝 参与贡献

我们欢迎所有形式的贡献！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: 添加某个很棒的特性'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

本项目基于 [MIT](./LICENSE) 协议开源。

## 🙏 致谢

[vue-pure-admin](https://github.com/pure-admin/vue-pure-admin)

感谢所有为本项目做出贡献的开发者！

---

⭐ 如果这个项目对您有帮助，请给我们一个 Star！
