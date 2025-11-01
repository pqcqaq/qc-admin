<template>
  <el-collapse-item name="edge-config" title="连线配置">
    <template #title>
      <div class="section-title">
        <el-icon><Connection /></el-icon>
        <span>连线配置</span>
      </div>
    </template>

    <!-- 标签 -->
    <el-form-item label="标签">
      <el-input
        :model-value="edge.label as string"
        placeholder="请输入连线标签"
        @update:modelValue="updateEdgeData('label', $event)"
      />
      <span class="form-hint">连线上显示的文本</span>
    </el-form-item>

    <!-- 分支名称（仅条件节点的边） -->
    <el-form-item v-if="edge.data?.branchName" label="分支名称">
      <el-input
        :model-value="edge.data.branchName"
        placeholder="请输入分支名称"
        disabled
      />
      <span class="form-hint">条件节点的分支标识（不可修改）</span>
    </el-form-item>

    <!-- 动画效果 -->
    <el-form-item label="动画效果">
      <el-switch
        :model-value="edge.animated"
        @change="updateEdgeData('animated', $event)"
      />
      <span class="form-hint">启用后，连线将显示流动动画</span>
    </el-form-item>

    <!-- 连线类型 -->
    <el-form-item label="连线类型">
      <el-select
        :model-value="edge.type || 'smoothstep'"
        style="width: 100%"
        @change="updateEdgeData('type', $event)"
      >
        <el-option label="平滑阶梯" value="smoothstep" />
        <el-option label="直线" value="straight" />
        <el-option label="贝塞尔曲线" value="default" />
        <el-option label="阶梯" value="step" />
      </el-select>
      <span class="form-hint">连线的显示样式</span>
    </el-form-item>

    <!-- 样式配置 -->
    <el-form-item label="样式配置">
      <el-input
        :model-value="styleJson"
        type="textarea"
        :rows="4"
        placeholder='{"stroke": "#ff0000", "strokeWidth": 2}'
        @update:modelValue="updateStyle"
      />
      <span class="form-hint"
        >JSON 格式的样式配置（stroke, strokeWidth 等）</span
      >
    </el-form-item>

    <!-- 自定义数据 -->
    <el-form-item label="自定义数据">
      <el-input
        :model-value="dataJson"
        type="textarea"
        :rows="4"
        placeholder='{"key": "value"}'
        @update:modelValue="updateData"
      />
      <span class="form-hint">JSON 格式的自定义数据</span>
    </el-form-item>

    <!-- 连线信息 -->
    <el-divider />
    <div class="edge-info">
      <div class="info-item">
        <span class="info-label">连线 ID:</span>
        <span class="info-value">{{ edge.id }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">源节点:</span>
        <span class="info-value">{{ edge.source }}</span>
      </div>
      <div class="info-item">
        <span class="info-label">目标节点:</span>
        <span class="info-value">{{ edge.target }}</span>
      </div>
      <div v-if="edge.sourceHandle" class="info-item">
        <span class="info-label">源 Handle:</span>
        <span class="info-value">{{ edge.sourceHandle }}</span>
      </div>
      <div v-if="edge.targetHandle" class="info-item">
        <span class="info-label">目标 Handle:</span>
        <span class="info-value">{{ edge.targetHandle }}</span>
      </div>
    </div>
  </el-collapse-item>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import type { Edge } from "@vue-flow/core";
import { Connection } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

interface Props {
  edge: Edge;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateEdge: [edgeId: string, updates: Partial<Edge>];
}>();

// 样式 JSON 字符串
const styleJson = ref("");
// 数据 JSON 字符串
const dataJson = ref("");

// 初始化 JSON 字符串
watch(
  () => props.edge,
  edge => {
    if (edge) {
      styleJson.value = edge.style ? JSON.stringify(edge.style, null, 2) : "";
      dataJson.value = edge.data ? JSON.stringify(edge.data, null, 2) : "";
    }
  },
  { immediate: true }
);

/**
 * 更新边的数据
 */
function updateEdgeData(key: string, value: any) {
  emit("updateEdge", props.edge.id, { [key]: value });
}

/**
 * 更新样式
 */
function updateStyle(value: string) {
  styleJson.value = value;
  if (!value.trim()) {
    emit("updateEdge", props.edge.id, { style: undefined });
    return;
  }

  try {
    const style = JSON.parse(value);
    emit("updateEdge", props.edge.id, { style });
  } catch (error) {
    ElMessage.error("样式配置格式错误，请输入有效的 JSON");
  }
}

/**
 * 更新自定义数据
 */
function updateData(value: string) {
  dataJson.value = value;
  if (!value.trim()) {
    emit("updateEdge", props.edge.id, { data: undefined });
    return;
  }

  try {
    const data = JSON.parse(value);
    emit("updateEdge", props.edge.id, { data });
  } catch (error) {
    ElMessage.error("自定义数据格式错误，请输入有效的 JSON");
  }
}
</script>

<style scoped lang="scss">
.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 500;
}

.form-hint {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.edge-info {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;

  .info-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 13px;

    &:last-child {
      margin-bottom: 0;
    }

    .info-label {
      font-weight: 500;
      color: #606266;
    }

    .info-value {
      max-width: 60%;
      color: #909399;
      text-align: right;
      word-break: break-all;
    }
  }
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #303133;
}
</style>
