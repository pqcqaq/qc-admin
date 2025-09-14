<template>
  <el-dialog
    v-model="visible"
    title="用户详情"
    width="600px"
    draggable
    @close="handleClose"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="记录ID">
        {{ data.id }}
      </el-descriptions-item>
      <el-descriptions-item label="名称">
        {{ data.name }}
      </el-descriptions-item>
      <el-descriptions-item label="描述">
        {{ data.description || "未设置" }}
      </el-descriptions-item>
      <el-descriptions-item label="请求路径">
        {{ data.path }}
      </el-descriptions-item>
      <el-descriptions-item label="请求方法">
        {{ data.method }}
      </el-descriptions-item>
      <el-descriptions-item label="是否公开">
        <el-tag :type="data.isPublic ? 'success' : 'danger'">
          {{ data.isPublic ? "公开" : "私有" }}
        </el-tag>
      </el-descriptions-item>
      <!-- 所需要权限 -->
      <el-descriptions-item label="所需权限">
        <div v-if="data.permissions && data.permissions.length > 0">
          <el-tag
            v-for="permission in data.permissions"
            :key="permission.id"
            style=" margin-right: 4px;margin-bottom: 4px"
            >{{ permission.action }}</el-tag
          >
        </div>
        <div v-else>
          <el-tag type="info" effect="plain">无</el-tag>
        </div>
      </el-descriptions-item>
      <!-- 是否启用 -->
      <el-descriptions-item label="状态">
        <el-tag :type="data.isActive ? 'success' : 'warning'">
          {{ data.isActive ? "激活" : "禁用" }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ data.createTime || "未设置" }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ data.updateTime || "未设置" }}
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
import { ElTag } from "element-plus";
import type { APIAuth } from "@/api/api_auth";

// 定义 props
const props = defineProps<{
  visible: boolean;
  data: APIAuth;
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

// 关闭对话框
const handleClose = () => {
  visible.value = false;
};
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}
</style>
