<template>
  <el-dialog
    v-model="visible"
    title="日志详情"
    width="800px"
    draggable
    @close="handleClose"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="日志ID">
        {{ data.id }}
      </el-descriptions-item>
      <el-descriptions-item label="日志级别">
        <el-tag :type="getLevelTagType(data.level)">
          {{ getLevelText(data.level) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="日志类型">
        <el-tag :type="getTypeTagType(data.type)">
          {{ getTypeText(data.type) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.code" label="状态码">
        <el-tag :type="getStatusCodeTagType(data.code)">
          {{ data.code }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.method" label="请求方法">
        <el-tag :type="getMethodTagType(data.method)">
          {{ data.method }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.ip" label="IP地址">
        {{ data.ip }}
      </el-descriptions-item>
      <el-descriptions-item v-if="data.path" label="请求路径" :span="2">
        <el-text class="mx-1" truncated style="max-width: 400px">
          {{ data.path }}
        </el-text>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.query" label="查询参数" :span="2">
        <el-text class="mx-1" truncated style="max-width: 400px">
          {{ data.query }}
        </el-text>
      </el-descriptions-item>
      <el-descriptions-item label="消息内容" :span="2">
        <div
          style="
            max-height: 100px;
            overflow-y: auto;
            word-break: break-all;
            white-space: pre-wrap;
          "
        >
          {{ data.message }}
        </div>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.userAgent" label="用户代理" :span="2">
        <el-text class="mx-1" truncated style="max-width: 500px">
          {{ data.userAgent }}
        </el-text>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.data" label="附加数据" :span="2">
        <el-scrollbar max-height="150px">
          <pre
            style="
              margin: 0;
              font-size: 12px;
              word-break: break-all;
              white-space: pre-wrap;
            "
            >{{ formatJsonData(data.data) }}</pre
          >
        </el-scrollbar>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.stack" label="堆栈信息" :span="2">
        <el-scrollbar max-height="200px">
          <pre
            style="
              margin: 0;
              font-size: 12px;
              word-break: break-all;
              white-space: pre-wrap;
            "
            >{{ data.stack }}</pre
          >
        </el-scrollbar>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ data.createTime }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ data.updateTime }}
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElTag, ElText, ElScrollbar } from "element-plus";
import type { Logging } from "@/api/logging";

// 定义 props
const props = defineProps<{
  visible: boolean;
  data: Logging;
}>();

// 定义 emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
}>();

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 获取日志级别标签类型
const getLevelTagType = (level: string) => {
  const levelMap = {
    debug: "info",
    info: "success",
    warn: "warning",
    error: "danger",
    fatal: "danger"
  };
  return levelMap[level] || "info";
};

// 获取日志级别文本
const getLevelText = (level: string) => {
  const levelMap = {
    debug: "DEBUG",
    info: "INFO",
    warn: "WARN",
    error: "ERROR",
    fatal: "FATAL"
  };
  return levelMap[level] || level.toUpperCase();
};

// 获取日志类型标签类型
const getTypeTagType = (type: string) => {
  const typeMap = {
    Error: "danger",
    Panic: "danger",
    manul: "info"
  };
  return typeMap[type] || "info";
};

// 获取日志类型文本
const getTypeText = (type: string) => {
  const typeMap = {
    Error: "错误",
    Panic: "崩溃",
    manul: "手动"
  };
  return typeMap[type] || type;
};

// 获取HTTP方法标签类型
const getMethodTagType = (method: string) => {
  const methodMap = {
    GET: "success",
    POST: "primary",
    PUT: "warning",
    DELETE: "danger",
    PATCH: "info"
  };
  return methodMap[method] || "info";
};

// 获取状态码标签类型
const getStatusCodeTagType = (code: number) => {
  if (code >= 500) return "danger";
  if (code >= 400) return "warning";
  if (code >= 300) return "info";
  return "success";
};

// 格式化JSON数据
const formatJsonData = (data: Record<string, any>) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch (error) {
    return String(data);
  }
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}

:deep(.el-descriptions__body) {
  .el-descriptions__table {
    .el-descriptions__cell {
      vertical-align: top;
    }
  }
}
</style>
