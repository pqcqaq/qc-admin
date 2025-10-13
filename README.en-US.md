# 🎨 QC-Admin Management System Frontend

[![license](https://img.shields.io/github/license/pqcqaq/qc-admin.svg)](LICENSE)
[![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Element Plus](https://img.shields.io/badge/Element%20Plus-latest-409eff.svg)](https://element-plus.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)

[中文](./README.md) | **English**

## 📖 Introduction

QC-Admin is a modern enterprise-level backend management system frontend template based on Vue 3 + TypeScript + Element Plus. It adopts the latest frontend technology stack and provides an out-of-the-box backend management solution.

### ✨ Features

- 🚀 **Latest Tech Stack**: Vue 3 + Vite 5 + TypeScript + Pinia
- 💎 **Premium UI**: Element Plus + TailwindCSS
- 🌍 **i18n Support**: Built-in complete multi-language solution
- 🎯 **TypeScript**: Strict type checking for better development experience
- 🔐 **Complete Permission**: Built-in RBAC permission management system
- 📱 **Responsive Design**: Mobile and desktop adaptive
- 🎨 **Theme Customization**: Dark/Light theme switching
- 📦 **Optimized Build**: Production bundle < 2.3MB (< 350kb with brotli)

## 🔗 Related Projects

- **Backend**: [qc-admin-go-backend](../qc-admin-go-backend) - Go backend service
- **Mobile**: [qc-admin-app](../qc-admin-app) - uni-app multi-platform application
- **Common API**: [qc-admin-api-common](../qc-admin-api-common) - API interface encapsulation

## 📋 Requirements

- **Node.js**: >= 18.x
- **pnpm**: >= 8.x (recommended)
- **Browser**: Modern browsers (Chrome, Firefox, Safari, Edge, etc.)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Using pnpm (recommended)
pnpm install

# Or using npm
npm install

# Or using yarn
yarn install
```

### 2. Start Development Server

```bash
# Development mode
pnpm dev

# Or
pnpm serve
```

Visit http://localhost:5173

### 3. Build for Production

```bash
# Production build
pnpm build

# Staging build
pnpm build:staging

# Build and preview
pnpm preview:build
```

### 4. Preview Build

```bash
pnpm preview
```

## 📁 Project Structure

```
qc-admin/
├── build/                    # Build configuration
├── locales/                  # i18n resources
├── mock/                     # Mock data
├── public/                   # Static assets
├── src/                      # Source code
│   ├── assets/              # Assets
│   ├── components/          # Global components
│   ├── composables/         # Composables
│   ├── config/              # App config
│   ├── directives/          # Custom directives
│   ├── layout/              # Layout components
│   ├── plugins/             # Plugins
│   ├── router/              # Router config
│   ├── store/               # State management (Pinia)
│   ├── style/               # Global styles
│   ├── utils/               # Utilities
│   ├── views/               # Page components
│   ├── App.vue              # Root component
│   └── main.ts              # App entry
├── types/                    # TypeScript types
└── vite.config.ts            # Vite config
```

## 🎨 Features

### 1. Authentication

- ✅ Login/Register
- ✅ Password Reset
- ✅ Verification Code Login
- ✅ OAuth Integration
- ✅ Token Auto Refresh

### 2. Permission Management (RBAC)

- ✅ User Management
- ✅ Role Management
- ✅ Permission Management
- ✅ Menu Management
- ✅ Role Inheritance
- ✅ Permission Scope

### 3. System Monitor

- ✅ Real-time System Status
- ✅ CPU/Memory/Disk Usage
- ✅ Network Traffic Statistics
- ✅ Historical Data Charts
- ✅ Auto Refresh

### 4. File Management

- ✅ File Upload/Download
- ✅ Image Preview
- ✅ Batch Operations
- ✅ S3 Storage Integration

### 5. Data Export

- ✅ Excel Export
- ✅ JSON Export
- ✅ Custom Templates
- ✅ Batch Export

### 6. WebSocket

- ✅ Real-time Push
- ✅ Online Status
- ✅ Auto Reconnect
- ✅ Heartbeat

## 📦 Tech Stack

### Core

- **Vue 3**: Progressive JavaScript framework
- **Vite 5**: Next generation build tool
- **TypeScript 5**: Typed JavaScript
- **Pinia**: State management for Vue 3

### UI

- **Element Plus**: Vue 3 component library
- **TailwindCSS**: Utility-first CSS
- **UnoCSS**: Instant on-demand atomic CSS

### Tools

- **Axios**: HTTP client
- **Day.js**: Date library
- **ECharts**: Charting library
- **VueUse**: Vue Composition API utilities

## 🔗 Links

### Documentation

- [Vue 3 Docs](https://vuejs.org/)
- [Vite Docs](https://vitejs.dev/)
- [Element Plus Docs](https://element-plus.org/)
- [TypeScript Docs](https://www.typescriptlang.org/)
- [Pinia Docs](https://pinia.vuejs.org/)

### Project Docs

- [Backend API Docs](../qc-admin-go-backend/README.md)
- [RBAC Docs](../qc-admin-go-backend/README_AUTH.md)
- [System Monitor Docs](../qc-admin-go-backend/README_SYSTEM_MONITOR.md)

### Resources

- [Online Preview](https://qc-admin-thin.netlify.app/)
- [Issues](https://github.com/pqcqaq/qc-admin/issues)

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'feat: Add some feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

[MIT](./LICENSE) © 2020-present

## 🙏 Thanks For

[vue-pure-admin](https://github.com/pure-admin/vue-pure-admin)

---

⭐ Star us if this project helped you!
