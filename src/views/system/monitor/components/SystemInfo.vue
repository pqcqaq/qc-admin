<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span class="font-medium">系统信息</span>
        <el-button
          type="primary"
          size="small"
          :icon="Refresh"
          :loading="loading"
          @click="emit('refresh')"
        >
          刷新
        </el-button>
      </div>
    </template>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="操作系统">
        {{ currentStatus?.os || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="平台">
        {{ currentStatus?.platform || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="平台版本">
        {{ currentStatus?.platformVersion || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="主机名">
        {{ currentStatus?.hostname || "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="系统运行时间">
        {{ formatUptime(currentStatus?.uptime || 0) }}
      </el-descriptions-item>
      <el-descriptions-item v-if="currentStatus?.loadAvg1" label="1分钟负载">
        {{ currentStatus?.loadAvg1?.toFixed(2) }}
      </el-descriptions-item>
      <el-descriptions-item v-if="currentStatus?.loadAvg5" label="5分钟负载">
        {{ currentStatus?.loadAvg5?.toFixed(2) }}
      </el-descriptions-item>
      <el-descriptions-item v-if="currentStatus?.loadAvg15" label="15分钟负载">
        {{ currentStatus?.loadAvg15?.toFixed(2) }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import { Refresh } from "@element-plus/icons-vue";
import type { SystemMonitor } from "qc-admin-api-common/system_monitor";

interface Props {
  currentStatus: SystemMonitor | null;
  loading?: boolean;
}

interface Emits {
  (e: "refresh"): void;
}

defineProps<Props>();
const emit = defineEmits<Emits>();

// 格式化运行时间
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}天 ${hours}小时 ${minutes}分钟`;
};
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
