# 系统监控模块

系统监控页面用于实时展示和查看服务器的系统状态，包括 CPU、内存、磁盘、网络等资源使用情况。

## 📂 项目结构

```
monitor/
├── index.vue                    # 主页面
├── README.md                    # 文档
├── components/                  # 组件目录
│   ├── index.ts                # 组件导出
│   ├── StatusCards.vue         # 状态卡片组件
│   ├── SystemInfo.vue          # 系统信息组件
│   ├── RuntimeInfo.vue         # 运行时信息组件
│   └── HistoryCharts.vue       # 历史数据图表组件
├── composables/                 # 组合式函数
│   └── useSystemMonitor.ts     # 监控数据管理
└── types/                       # 类型定义
    └── index.ts                # 类型导出
```

## 页面位置

`src/views/system/monitor/index.vue`

## 功能特性

### 1. 实时状态卡片

四个卡片实时展示关键系统指标：

- **CPU 使用率卡片**
  - 显示当前 CPU 使用率百分比
  - 显示 CPU 核心数
  - 带渐变色进度条

- **内存使用率卡片**
  - 显示当前内存使用率百分比
  - 显示已使用内存和总内存
  - 带渐变色进度条

- **磁盘使用率卡片**
  - 显示当前磁盘使用率百分比
  - 显示已使用磁盘和总磁盘容量
  - 带渐变色进度条

- **Goroutine 卡片**
  - 显示当前 Goroutine 数量
  - 显示 GC（垃圾回收）次数

### 2. 系统信息展示

两个信息面板展示详细的系统信息：

- **系统信息面板**
  - 操作系统类型
  - 平台信息
  - 平台版本
  - 主机名
  - 系统运行时间
  - 系统负载（1/5/15 分钟，仅 Unix 系统）

- **运行时信息面板**
  - 堆内存分配
  - 堆系统内存
  - Goroutine 数量
  - GC 次数
  - 网络发送/接收字节数
  - 记录时间

### 3. 历史数据图表

四个 ECharts 图表展示历史趋势：

- **CPU 使用率趋势图** - 蓝色区域图
- **内存使用率趋势图** - 绿色区域图
- **磁盘使用率趋势图** - 橙色区域图
- **Goroutine 数量趋势图** - 紫色区域图

每个图表都支持：

- 时间范围切换（1小时/6小时/24小时/7天）
- 鼠标悬停查看详细数据
- 响应式缩放

### 4. 自动刷新

- 每 30 秒自动刷新当前状态和历史数据
- 支持手动刷新按钮
- 页面离开时自动停止刷新

### 5. 响应式设计

- 支持多种屏幕尺寸
- 移动端友好的布局
- 图表自动调整大小

## 技术实现

### 依赖库

- **Vue 3** - 前端框架
- **TypeScript** - 类型安全
- **Element Plus** - UI 组件库
- **ECharts** - 图表库
- **Day.js** - 时间处理
- **@vueuse/core** - Vue 组合式函数工具

### 数据格式

```typescript
interface SystemStatus {
  id: string;
  cpuUsagePercent: number;
  cpuCores: number;
  memoryTotal: number;
  memoryUsed: number;
  memoryFree: number;
  memoryUsagePercent: number;
  diskTotal: number;
  diskUsed: number;
  diskFree: number;
  diskUsagePercent: number;
  networkBytesSent: number;
  networkBytesRecv: number;
  os: string;
  platform: string;
  platformVersion: string;
  hostname: string;
  goroutinesCount: number;
  heapAlloc: number;
  heapSys: number;
  gcCount: number;
  loadAvg1?: number;
  loadAvg5?: number;
  loadAvg15?: number;
  uptime: number;
  recordedAt: string;
  createdAt: string;
}
```

## API 集成

页面中有模拟数据，需要替换为实际的 API 调用。

### 需要实现的 API 接口

在 `qc-admin-api-common` 中已经定义了 API 接口，需要在后端实现相应的 handler：

```typescript
import {
  getLatestSystemMonitor,
  getSystemMonitorHistory
} from "qc-admin-api-common/system_monitor";

// 使用示例
const fetchCurrentStatus = async () => {
  try {
    const response = await getLatestSystemMonitor();
    currentStatus.value = response.data;
  } catch (error) {
    console.error("Failed to fetch current status:", error);
  }
};

const fetchHistoryData = async () => {
  try {
    const response = await getSystemMonitorHistory({
      limit: 100,
      hours: timeRange.value
    });
    historyData.value = response.data;
  } catch (error) {
    console.error("Failed to fetch history data:", error);
  }
};
```

### 替换模拟数据

在 `index.vue` 文件中找到以下注释并替换为实际的 API 调用：

```vue
// 在 fetchCurrentStatus 函数中 // TODO: 替换为实际的 API 调用 // const response
= await getLatestSystemMonitor(); // currentStatus.value = response.data; // 在
fetchHistoryData 函数中 // TODO: 替换为实际的 API 调用 // const response = await
getSystemMonitorHistory(100, timeRange.value); // historyData.value =
response.data;
```

## 样式定制

### 主题色

状态卡片使用不同的渐变色主题：

- CPU: 紫色渐变 `#667eea → #764ba2`
- 内存: 粉红渐变 `#f093fb → #f5576c`
- 磁盘: 蓝色渐变 `#4facfe → #00f2fe`
- Goroutine: 绿色渐变 `#43e97b → #38f9d7`

### 进度条颜色

根据使用率自动调整进度条颜色：

- 0-50%: 绿色 `#52c41a`
- 50-80%: 橙色 `#faad14`
- 80-100%: 红色 `#f5222d`

## 添加到路由

需要在后端菜单系统中添加此页面的路由配置。

### 路由配置示例

如果使用静态路由配置（如 `src/router/backup/system.ts`），可以添加：

```typescript
{
  path: "/system/monitor",
  name: "SystemMonitor",
  component: () => import("@/views/system/monitor/index.vue"),
  meta: {
    title: "系统监控",
    icon: "ep:monitor",
    showLink: true
  }
}
```

### 菜单配置

在数据库的菜单表中添加记录：

```sql
INSERT INTO sys_menus (title, path, component, icon, type, parent_id, rank)
VALUES ('系统监控', '/system/monitor', 'views/system/monitor/index.vue', 'ep:monitor', 'menu', <系统管理的ID>, 100);
```

## 性能优化建议

1. **图表懒加载** - 图表仅在需要时初始化
2. **数据节流** - 避免过于频繁的数据请求
3. **组件缓存** - 使用 `keep-alive` 缓存组件状态
4. **按需加载** - 图表数据按需加载，不一次性加载所有历史数据

## 扩展功能建议

1. **告警阈值设置** - 允许用户设置告警阈值
2. **导出功能** - 支持导出监控数据为 CSV 或 Excel
3. **对比模式** - 支持多个时间段的数据对比
4. **详细视图** - 点击卡片查看更详细的监控信息
5. **自定义仪表板** - 允许用户自定义监控指标和布局

## 常见问题

### 1. 图表不显示

确保：

- ECharts 已正确安装
- 图表容器有明确的高度
- 数据格式正确

### 2. 自动刷新不工作

检查：

- 定时器是否正确启动
- 组件卸载时是否清理了定时器
- API 请求是否正常

### 3. 移动端显示异常

确认：

- 响应式样式是否正确
- 媒体查询是否生效
- 图表是否支持响应式

## 许可证

与主项目相同
