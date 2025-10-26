<template>
  <el-dialog
    v-model="dialogVisible"
    title="地区详情"
    width="800px"
    draggable
    @close="handleClose"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="地区ID">
        {{ data.id }}
      </el-descriptions-item>
      <el-descriptions-item label="地区名称">
        {{ data.name }}
      </el-descriptions-item>
      <el-descriptions-item label="层级类型">
        <el-tag :type="getLevelTagType(data.level)">
          {{ getLevelText(data.level) }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="深度">
        {{ data.depth }}
      </el-descriptions-item>
      <el-descriptions-item label="地区编码">
        {{ data.code }}
      </el-descriptions-item>
      <el-descriptions-item label="父级ID">
        {{ data.parentId || "无(顶级地区)" }}
      </el-descriptions-item>
      <el-descriptions-item label="纬度">
        {{ data.latitude !== undefined ? data.latitude.toFixed(6) : "未设置" }}
      </el-descriptions-item>
      <el-descriptions-item label="经度">
        {{
          data.longitude !== undefined ? data.longitude.toFixed(6) : "未设置"
        }}
      </el-descriptions-item>
      <el-descriptions-item v-if="data.color" label="颜色">
        <div style="display: flex; gap: 8px; align-items: center">
          <div
            :style="{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: data.color,
              border: '1px solid var(--el-border-color)'
            }"
          />
          <span>{{ data.color }}</span>
        </div>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.parent" label="父级地区" :span="2">
        <el-tag type="info">{{ data.parent.name }}</el-tag>
        <span style="margin-left: 8px; color: var(--el-text-color-secondary)">
          ({{ data.parent.code }})
        </span>
      </el-descriptions-item>
      <el-descriptions-item
        v-if="data.children && data.children.length > 0"
        label="子级地区"
        :span="2"
      >
        <div style="display: flex; flex-wrap: wrap; gap: 8px">
          <el-tag
            v-for="child in data.children"
            :key="child.id"
            type="success"
            size="small"
          >
            {{ child.name }}
          </el-tag>
        </div>
        <div
          v-if="data.children.length > 10"
          style="margin-top: 8px; color: var(--el-text-color-secondary)"
        >
          共 {{ data.children.length }} 个子级地区
        </div>
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
import type { Area } from "qc-admin-api-common/area";

const props = defineProps<{
  visible: boolean;
  data: Area;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
}>();

// 对话框显示状态的计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit("update:visible", val)
});

// 层级类型标签类型
const getLevelTagType = (level: string) => {
  const typeMap = {
    country: "danger",
    province: "warning",
    city: "success",
    district: "primary",
    street: "info"
  };
  return typeMap[level] || "info";
};

// 层级类型文本
const getLevelText = (level: string) => {
  const textMap = {
    country: "国家",
    province: "省份",
    city: "城市",
    district: "区县",
    street: "街道"
  };
  return textMap[level] || level;
};

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
};
</script>

<style scoped lang="scss">
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style>
