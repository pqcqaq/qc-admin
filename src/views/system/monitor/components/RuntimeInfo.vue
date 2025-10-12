<template>
  <el-card shadow="never">
    <template #header>
      <span class="font-medium">运行时信息</span>
    </template>
    <el-descriptions :column="1" border>
      <el-descriptions-item label="堆内存分配">
        {{ formatBytes(currentStatus?.heapAlloc || 0) }}
      </el-descriptions-item>
      <el-descriptions-item label="堆系统内存">
        {{ formatBytes(currentStatus?.heapSys || 0) }}
      </el-descriptions-item>
      <el-descriptions-item label="Goroutine数量">
        {{ currentStatus?.goroutinesCount || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="GC次数">
        {{ currentStatus?.gcCount || 0 }}
      </el-descriptions-item>
      <el-descriptions-item label="网络发送">
        {{ formatBytes(currentStatus?.networkBytesSent || 0) }}
      </el-descriptions-item>
      <el-descriptions-item label="网络接收">
        {{ formatBytes(currentStatus?.networkBytesRecv || 0) }}
      </el-descriptions-item>
      <el-descriptions-item label="记录时间">
        {{ formatTime(currentStatus?.recordedAt) }}
      </el-descriptions-item>
    </el-descriptions>
  </el-card>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
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

// 格式化时间
const formatTime = (time: string | undefined): string => {
  if (!time) return "-";
  return dayjs(time).format("YYYY-MM-DD HH:mm:ss");
};
</script>
