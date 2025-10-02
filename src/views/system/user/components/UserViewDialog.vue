<template>
  <el-dialog
    v-model="visible"
    title="用户详情"
    width="600px"
    draggable
    @close="handleClose"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="用户ID">
        {{ userData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="用户名">
        {{ userData.name }}
      </el-descriptions-item>
      <el-descriptions-item label="年龄">
        {{ userData.age || "未设置" }}
      </el-descriptions-item>
      <el-descriptions-item label="性别">
        {{
          userData.sex === "male"
            ? "男"
            : userData.sex === "female"
              ? "女"
              : userData.sex === "other"
                ? "其他"
                : "未设置"
        }}
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag :type="userData.status === 'active' ? 'success' : 'danger'">
          {{ userData.status === "active" ? "激活" : "禁用" }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ userData.createTime || "未设置" }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ userData.updateTime || "未设置" }}
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
import type { User } from "qc-admin-api-common/user";

// 定义 props
const props = defineProps<{
  visible: boolean;
  userData: User;
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
