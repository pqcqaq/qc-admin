import { ref } from "vue";
import type { SystemMonitor } from "qc-admin-api-common/system_monitor";
import {
  getLatestSystemMonitor,
  getSystemMonitorHistory
} from "qc-admin-api-common/system_monitor";
import { message } from "@/utils/message";
import { useSocketStore } from "@/store/modules/socket";

export function useSystemMonitor() {
  const loading = ref(false);
  const currentStatus = ref<SystemMonitor | null>(null);
  const historyData = ref<SystemMonitor[]>([]);
  const timeRange = ref(1); // 默认1小时

  const socketStore = useSocketStore();

  socketStore.hookOnMounted("system/monitor/update", (data: SystemMonitor) => {
    currentStatus.value = data;
    // 直接拼接到历史数据中
    const omitLast = historyData.value.slice(0, -1);
    historyData.value = [data, ...omitLast];
  });

  // 获取当前系统状态
  const fetchCurrentStatus = async () => {
    loading.value = true;
    try {
      const response = await getLatestSystemMonitor();
      currentStatus.value = response.data;
    } catch (error) {
      console.error("Failed to fetch current status:", error);
      message("获取系统状态失败，请稍后重试", {
        type: "error"
      });
    } finally {
      loading.value = false;
    }
  };

  // 获取历史数据
  const fetchHistoryData = async () => {
    try {
      const response = await getSystemMonitorHistory({
        limit: timeRange.value * 100 > 10000 ? 10000 : timeRange.value * 100, // 最多1000条
        hours: timeRange.value
      });
      historyData.value = response.data;
    } catch (error) {
      console.error("Failed to fetch history data:", error);
    }
  };

  return {
    loading,
    currentStatus,
    historyData,
    timeRange,
    fetchCurrentStatus,
    fetchHistoryData
  };
}
