<template>
  <el-row :gutter="20" class="status-cards">
    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="hover" class="status-card cpu-card">
        <div class="card-content">
          <div class="icon-wrapper">
            <el-icon :size="40">
              <component :is="Monitor" />
            </el-icon>
          </div>
          <div class="info">
            <div class="title">CPU 使用率</div>
            <div class="value">
              {{ currentStatus?.cpuUsagePercent?.toFixed(2) || 0 }}%
            </div>
            <div class="subtitle">{{ currentStatus?.cpuCores || 0 }} 核心</div>
          </div>
        </div>
        <div class="progress-bar">
          <el-progress
            :percentage="currentStatus?.cpuUsagePercent || 0"
            :color="getProgressColor(currentStatus?.cpuUsagePercent || 0)"
            :show-text="false"
          />
        </div>
      </el-card>
    </el-col>

    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="hover" class="status-card memory-card">
        <div class="card-content">
          <div class="icon-wrapper">
            <el-icon :size="40">
              <component :is="Cpu" />
            </el-icon>
          </div>
          <div class="info">
            <div class="title">内存使用率</div>
            <div class="value">
              {{ currentStatus?.memoryUsagePercent?.toFixed(2) || 0 }}%
            </div>
            <div class="subtitle">
              {{ formatBytes(currentStatus?.memoryUsed || 0) }} /
              {{ formatBytes(currentStatus?.memoryTotal || 0) }}
            </div>
          </div>
        </div>
        <div class="progress-bar">
          <el-progress
            :percentage="currentStatus?.memoryUsagePercent || 0"
            :color="getProgressColor(currentStatus?.memoryUsagePercent || 0)"
            :show-text="false"
          />
        </div>
      </el-card>
    </el-col>

    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="hover" class="status-card disk-card">
        <div class="card-content">
          <div class="icon-wrapper">
            <el-icon :size="40">
              <component :is="Coin" />
            </el-icon>
          </div>
          <div class="info">
            <div class="title">磁盘使用率</div>
            <div class="value">
              {{ currentStatus?.diskUsagePercent?.toFixed(2) || 0 }}%
            </div>
            <div class="subtitle">
              {{ formatBytes(currentStatus?.diskUsed || 0) }} /
              {{ formatBytes(currentStatus?.diskTotal || 0) }}
            </div>
          </div>
        </div>
        <div class="progress-bar">
          <el-progress
            :percentage="currentStatus?.diskUsagePercent || 0"
            :color="getProgressColor(currentStatus?.diskUsagePercent || 0)"
            :show-text="false"
          />
        </div>
      </el-card>
    </el-col>

    <el-col :xs="24" :sm="12" :lg="6">
      <el-card shadow="hover" class="status-card network-card">
        <div class="card-content">
          <div class="icon-wrapper">
            <el-icon :size="40">
              <component :is="Connection" />
            </el-icon>
          </div>
          <div class="info">
            <div class="title">Goroutines</div>
            <div class="value">
              {{ currentStatus?.goroutinesCount || 0 }}
            </div>
            <div class="subtitle">GC: {{ currentStatus?.gcCount || 0 }} 次</div>
          </div>
        </div>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup lang="ts">
import { Monitor, Cpu, Coin, Connection } from "@element-plus/icons-vue";
import type { SystemMonitor } from "qc-admin-api-common/system_monitor";

interface Props {
  currentStatus: SystemMonitor | null;
}

defineProps<Props>();

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

// 根据使用率获取进度条颜色
const getProgressColor = (percentage: number): string => {
  if (percentage < 50) return "#52c41a";
  if (percentage < 80) return "#faad14";
  return "#f5222d";
};
</script>

<style scoped lang="scss">
.status-cards {
  .status-card {
    height: 160px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-5px);
    }

    .card-content {
      display: flex;
      align-items: center;
      margin-bottom: 15px;

      .icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        margin-right: 15px;
        border-radius: 12px;
      }

      .info {
        flex: 1;

        .title {
          margin-bottom: 8px;
          font-size: 14px;
          color: var(--el-text-color-secondary);
        }

        .value {
          margin-bottom: 5px;
          font-size: 28px;
          font-weight: bold;
          color: var(--el-text-color-primary);
        }

        .subtitle {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }
    }

    &.cpu-card .icon-wrapper {
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    &.memory-card .icon-wrapper {
      color: white;
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    &.disk-card .icon-wrapper {
      color: white;
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    &.network-card .icon-wrapper {
      color: white;
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
    }
  }
}

@media (width <= 768px) {
  .status-cards {
    .el-col {
      margin-bottom: 15px;
    }
  }
}
</style>
