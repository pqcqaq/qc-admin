<template>
  <el-card shadow="never">
    <template #header>
      <div class="card-header">
        <span class="font-medium">历史监控数据</span>
        <div class="controls">
          <el-radio-group
            :model-value="timeRange"
            size="small"
            @change="val => emit('time-range-change', val as number)"
          >
            <el-radio-button :label="1">1小时</el-radio-button>
            <el-radio-button :label="6">6小时</el-radio-button>
            <el-radio-button :label="24">24小时</el-radio-button>
            <el-radio-button :label="168">7天</el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </template>

    <!-- CPU 使用率图表 -->
    <div class="chart-wrapper">
      <h4 class="chart-title">CPU 使用率</h4>
      <div ref="cpuChartRef" class="chart" />
    </div>

    <!-- 内存使用率图表 -->
    <div class="chart-wrapper">
      <h4 class="chart-title">内存使用率</h4>
      <div ref="memoryChartRef" class="chart" />
    </div>

    <!-- 磁盘使用率图表 -->
    <div class="chart-wrapper">
      <h4 class="chart-title">磁盘使用率</h4>
      <div ref="diskChartRef" class="chart" />
    </div>

    <!-- Goroutine 数量图表 -->
    <div class="chart-wrapper">
      <h4 class="chart-title">Goroutine 数量</h4>
      <div ref="goroutineChartRef" class="chart" />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import * as echarts from "echarts";
import type { ECharts } from "echarts";
import dayjs from "dayjs";
import type { SystemMonitor } from "qc-admin-api-common/system_monitor";

interface Props {
  historyData: SystemMonitor[];
  timeRange: number;
}

interface Emits {
  (e: "time-range-change", value: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 图表引用
const cpuChartRef = ref<HTMLElement>();
const memoryChartRef = ref<HTMLElement>();
const diskChartRef = ref<HTMLElement>();
const goroutineChartRef = ref<HTMLElement>();

// 图表实例
let cpuChart: ECharts | null = null;
let memoryChart: ECharts | null = null;
let diskChart: ECharts | null = null;
let goroutineChart: ECharts | null = null;

// 初始化图表
const initCharts = () => {
  if (cpuChartRef.value) {
    cpuChart = echarts.init(cpuChartRef.value);
  }
  if (memoryChartRef.value) {
    memoryChart = echarts.init(memoryChartRef.value);
  }
  if (diskChartRef.value) {
    diskChart = echarts.init(diskChartRef.value);
  }
  if (goroutineChartRef.value) {
    goroutineChart = echarts.init(goroutineChartRef.value);
  }

  // 窗口大小改变时重新调整图表
  window.addEventListener("resize", handleResize);
};

// 更新图表数据
const updateCharts = () => {
  if (!props.historyData.length) return;

  const timeData = props.historyData.map(item =>
    dayjs(item.recordedAt).format("MM-DD HH:mm")
  );

  // CPU 图表
  if (cpuChart) {
    cpuChart.setOption({
      tooltip: {
        trigger: "axis",
        formatter: "{b}<br/>{a}: {c}%"
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: timeData
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: {
          formatter: "{value}%"
        }
      },
      series: [
        {
          name: "CPU使用率",
          type: "line",
          smooth: true,
          data: props.historyData.map(item => item.cpuUsagePercent.toFixed(2)),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(24, 144, 255, 0.6)" },
              { offset: 1, color: "rgba(24, 144, 255, 0.1)" }
            ])
          },
          lineStyle: {
            color: "#1890ff"
          },
          itemStyle: {
            color: "#1890ff"
          }
        }
      ]
    });
  }

  // 内存图表
  if (memoryChart) {
    memoryChart.setOption({
      tooltip: {
        trigger: "axis",
        formatter: "{b}<br/>{a}: {c}%"
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: timeData
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: {
          formatter: "{value}%"
        }
      },
      series: [
        {
          name: "内存使用率",
          type: "line",
          smooth: true,
          data: props.historyData.map(item =>
            item.memoryUsagePercent.toFixed(2)
          ),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(82, 196, 26, 0.6)" },
              { offset: 1, color: "rgba(82, 196, 26, 0.1)" }
            ])
          },
          lineStyle: {
            color: "#52c41a"
          },
          itemStyle: {
            color: "#52c41a"
          }
        }
      ]
    });
  }

  // 磁盘图表
  if (diskChart) {
    diskChart.setOption({
      tooltip: {
        trigger: "axis",
        formatter: "{b}<br/>{a}: {c}%"
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: timeData
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: {
          formatter: "{value}%"
        }
      },
      series: [
        {
          name: "磁盘使用率",
          type: "line",
          smooth: true,
          data: props.historyData.map(item => item.diskUsagePercent.toFixed(2)),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(250, 173, 20, 0.6)" },
              { offset: 1, color: "rgba(250, 173, 20, 0.1)" }
            ])
          },
          lineStyle: {
            color: "#faad14"
          },
          itemStyle: {
            color: "#faad14"
          }
        }
      ]
    });
  }

  // Goroutine 图表
  if (goroutineChart) {
    goroutineChart.setOption({
      tooltip: {
        trigger: "axis",
        formatter: "{b}<br/>{a}: {c}"
      },
      grid: {
        left: "3%",
        right: "4%",
        bottom: "3%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: timeData
      },
      yAxis: {
        type: "value"
      },
      series: [
        {
          name: "Goroutine数量",
          type: "line",
          smooth: true,
          data: props.historyData.map(item => item.goroutinesCount),
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(114, 46, 209, 0.6)" },
              { offset: 1, color: "rgba(114, 46, 209, 0.1)" }
            ])
          },
          lineStyle: {
            color: "#722ed1"
          },
          itemStyle: {
            color: "#722ed1"
          }
        }
      ]
    });
  }
};

// 处理窗口大小改变
const handleResize = () => {
  cpuChart?.resize();
  memoryChart?.resize();
  diskChart?.resize();
  goroutineChart?.resize();
};

// 监听历史数据变化
watch(
  () => props.historyData,
  () => {
    updateCharts();
  },
  { deep: true }
);

// 生命周期
onMounted(() => {
  initCharts();
  updateCharts();
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  cpuChart?.dispose();
  memoryChart?.dispose();
  diskChart?.dispose();
  goroutineChart?.dispose();
});
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .controls {
    display: flex;
    gap: 10px;
  }
}

.chart-wrapper {
  margin-bottom: 30px;

  .chart-title {
    padding-left: 10px;
    margin-bottom: 15px;
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    border-left: 3px solid var(--el-color-primary);
  }

  .chart {
    width: 100%;
    height: 350px;
  }
}

@media (width <= 768px) {
  .chart-wrapper .chart {
    height: 250px;
  }
}
</style>
