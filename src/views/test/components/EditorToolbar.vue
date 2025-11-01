<template>
  <div
    class="editor-toolbar"
    :style="{
      borderBottom: darkMode ? '1px solid #3a3a3a' : '1px solid #dcdfe6',
      background: darkMode ? '#1e1e1e' : '#f9fafb',
      color: darkMode ? '#e5e7eb' : '#303133'
    }"
  >
    <div class="toolbar-left">
      <el-button @click="handleBack">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
      <span class="app-name">{{ applicationName }}</span>
    </div>
    <div v-if="loading">
      <el-tag type="info" effect="dark">加载中...</el-tag>
    </div>
    <div v-else class="toolbar-right">
      <el-tag v-if="hasUnsavedChanges" type="warning" effect="dark">
        <el-icon><WarningFilled /></el-icon>
        有未保存的变更
      </el-tag>
      <div class="realtime-mode-switch">
        <span class="switch-label">实时模式</span>
        <el-switch
          :model-value="realtimeMode"
          @change="handleRealtimeModeChange"
        />
      </div>
      <el-button
        type="success"
        :loading="saving"
        :disabled="!hasUnsavedChanges"
        @click="handleSave"
      >
        <el-icon><DocumentChecked /></el-icon>
        保存
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  DocumentChecked,
  WarningFilled
} from "@element-plus/icons-vue";

// Props
interface Props {
  applicationName: string;
  hasUnsavedChanges?: boolean;
  saving?: boolean;
  darkMode?: boolean;
  realtimeMode?: boolean;
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  hasUnsavedChanges: false,
  saving: false,
  darkMode: false,
  realtimeMode: false,
  loading: false
});

// Emits
const emit = defineEmits<{
  back: [];
  save: [];
  "toggle-realtime": [enabled: boolean];
}>();

// 事件处理
function handleBack() {
  emit("back");
}

function handleSave() {
  emit("save");
}

function handleRealtimeModeChange(enabled: boolean) {
  emit("toggle-realtime", enabled);
}
</script>

<style lang="scss" scoped>
.editor-toolbar {
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px;
  box-shadow: 0 2px 4px rgb(0 0 0 / 5%);

  .toolbar-left {
    display: flex;
    gap: 16px;
    align-items: center;

    .app-name {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .toolbar-right {
    display: flex;
    gap: 12px;
    align-items: center;

    .realtime-mode-switch {
      display: flex;
      gap: 8px;
      align-items: center;
      padding: 0 12px;
      background: #f5f7fa;
      border-radius: 4px;

      .switch-label {
        font-size: 14px;
        color: #606266;
        white-space: nowrap;
      }
    }
  }
}
</style>
