<template>
  <el-collapse-item name="api-config">
    <template #title>
      <div class="section-title">
        <el-icon><Connection /></el-icon>
        <span>API 配置</span>
      </div>
    </template>

    <el-form label-width="100px" label-position="top">
      <!-- API URL -->
      <el-form-item label="API URL">
        <el-input
          :model-value="apiConfig.url"
          placeholder="https://api.example.com/endpoint"
          @update:modelValue="updateApiConfig('url', $event)"
        />
        <span class="form-hint">API 请求的完整 URL</span>
      </el-form-item>

      <!-- HTTP 方法 -->
      <el-form-item label="HTTP 方法">
        <el-select
          :model-value="apiConfig.method"
          placeholder="请选择 HTTP 方法"
          style="width: 100%"
          @change="updateApiConfig('method', $event)"
        >
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="PATCH" value="PATCH" />
          <el-option label="DELETE" value="DELETE" />
        </el-select>
      </el-form-item>

      <!-- 请求头 -->
      <el-form-item label="请求头 (Headers)">
        <el-input
          :model-value="headersText"
          type="textarea"
          :rows="4"
          placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
          @update:modelValue="updateHeaders"
        />
        <span class="form-hint">JSON 格式的请求头</span>
      </el-form-item>

      <!-- 请求体 -->
      <el-form-item v-if="showBody" label="请求体 (Body)">
        <el-input
          :model-value="bodyText"
          type="textarea"
          :rows="6"
          placeholder='{"key": "value"}'
          @update:modelValue="updateBody"
        />
        <span class="form-hint">JSON 格式的请求体（仅 POST/PUT/PATCH）</span>
      </el-form-item>

      <!-- 查询参数 -->
      <el-form-item label="查询参数 (Query)">
        <el-input
          :model-value="queryText"
          type="textarea"
          :rows="3"
          placeholder='{"page": 1, "size": 10}'
          @update:modelValue="updateQuery"
        />
        <span class="form-hint">JSON 格式的查询参数</span>
      </el-form-item>

      <!-- 超时时间 -->
      <el-form-item label="请求超时 (ms)">
        <el-input-number
          :model-value="apiConfig.timeout"
          :min="0"
          :step="1000"
          style="width: 100%"
          placeholder="30000"
          @change="updateApiConfig('timeout', $event)"
        />
        <span class="form-hint">API 请求的超时时间</span>
      </el-form-item>

      <!-- 响应处理 -->
      <el-form-item label="响应路径">
        <el-input
          :model-value="apiConfig.responsePath"
          placeholder="data.result"
          @update:modelValue="updateApiConfig('responsePath', $event)"
        />
        <span class="form-hint">从响应中提取数据的路径（如 data.result）</span>
      </el-form-item>
    </el-form>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Node } from "@vue-flow/core";
import { Connection } from "@element-plus/icons-vue";

interface Props {
  node: Node;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateData: [key: string, value: any];
}>();

// API 配置对象
const apiConfig = computed(() => {
  return props.node.data.apiConfig || {};
});

// 是否显示请求体（仅 POST/PUT/PATCH）
const showBody = computed(() => {
  const method = apiConfig.value.method?.toUpperCase();
  return method === "POST" || method === "PUT" || method === "PATCH";
});

// Headers 文本
const headersText = computed(() => {
  if (!apiConfig.value.headers) return "";
  return JSON.stringify(apiConfig.value.headers, null, 2);
});

// Body 文本
const bodyText = computed(() => {
  if (!apiConfig.value.body) return "";
  return JSON.stringify(apiConfig.value.body, null, 2);
});

// Query 文本
const queryText = computed(() => {
  if (!apiConfig.value.query) return "";
  return JSON.stringify(apiConfig.value.query, null, 2);
});

// 更新 API 配置
const updateApiConfig = (key: string, value: any) => {
  const newApiConfig = {
    ...apiConfig.value,
    [key]: value
  };
  emit("updateData", "apiConfig", newApiConfig);
};

// 更新 Headers
const updateHeaders = (text: string) => {
  try {
    const headers = text ? JSON.parse(text) : undefined;
    updateApiConfig("headers", headers);
  } catch (e) {
    // 如果 JSON 解析失败，暂时不更新
    console.warn("Invalid JSON for headers:", e);
  }
};

// 更新 Body
const updateBody = (text: string) => {
  try {
    const body = text ? JSON.parse(text) : undefined;
    updateApiConfig("body", body);
  } catch (e) {
    console.warn("Invalid JSON for body:", e);
  }
};

// 更新 Query
const updateQuery = (text: string) => {
  try {
    const query = text ? JSON.parse(text) : undefined;
    updateApiConfig("query", query);
  } catch (e) {
    console.warn("Invalid JSON for query:", e);
  }
};
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;

  .el-icon {
    color: #67c23a;
  }
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
