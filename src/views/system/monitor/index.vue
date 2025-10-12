<template>
  <div class="system-monitor">
    <!-- 当前状态概览 -->
    <StatusCards :current-status="currentStatus" />

    <!-- 系统信息 -->
    <el-row :gutter="20" class="info-section">
      <el-col :xs="24" :lg="12">
        <SystemInfo
          :current-status="currentStatus"
          :loading="loading"
          @refresh="handleRefresh"
        />
      </el-col>

      <el-col :xs="24" :lg="12">
        <RuntimeInfo :current-status="currentStatus" />
      </el-col>
    </el-row>

    <!-- 历史数据图表 -->
    <el-row :gutter="20" class="charts-section">
      <el-col :span="24">
        <HistoryCharts
          :history-data="historyData"
          :time-range="timeRange"
          @time-range-change="handleTimeRangeChange"
        />
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { onMounted, nextTick } from "vue";
import {
  StatusCards,
  SystemInfo,
  RuntimeInfo,
  HistoryCharts
} from "./components";
import { useSystemMonitor } from "./composables/useSystemMonitor";

// 使用组合式函数
const {
  loading,
  currentStatus,
  historyData,
  timeRange,
  fetchCurrentStatus,
  fetchHistoryData
} = useSystemMonitor();

// 处理时间范围变化
const handleTimeRangeChange = async (value: number) => {
  timeRange.value = value;
  await fetchHistoryData();
};

const handleRefresh = async () => {
  await fetchCurrentStatus();
  await nextTick();
  await fetchHistoryData();
};

// 生命周期
onMounted(async () => {
  await handleRefresh();
});
</script>

<style scoped lang="scss">
.system-monitor {
  padding: 20px;

  .info-section {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .charts-section {
    margin-bottom: 20px;
  }
}

@media (width <= 768px) {
  .system-monitor {
    padding: 10px;
  }
}
</style>
