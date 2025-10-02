<template>
  <el-dialog
    v-model="visible"
    title="设备详情"
    width="800px"
    draggable
    @close="handleClose"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="设备ID">
        {{ data.id }}
      </el-descriptions-item>
      <el-descriptions-item label="设备名称">
        {{ data.name }}
      </el-descriptions-item>
      <el-descriptions-item label="设备状态">
        <el-tag :type="data.enabled ? 'success' : 'danger'">
          {{ data.enabled ? "启用" : "禁用" }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="匿名登录">
        <el-tag :type="data.anonymous ? 'warning' : 'info'">
          {{ data.anonymous ? "允许所有角色登录" : "仅限指定角色登录" }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="AccessToken过期时间">
        {{ formatExpiry(data.accessTokenExpiry) }}
      </el-descriptions-item>
      <el-descriptions-item label="RefreshToken过期时间">
        {{ formatExpiry(data.refreshTokenExpiry) }}
      </el-descriptions-item>
      <!-- <el-descriptions-item v-if="data.clientId" label="Client ID" :span="2">
        <el-text class="mx-1" truncated style="max-width: 600px">
          {{ data.clientId }}
        </el-text>
      </el-descriptions-item>
      <el-descriptions-item
        v-if="data.clientSecret"
        label="Client Secret"
        :span="2"
      >
        <el-text class="mx-1" truncated style="max-width: 600px">
          {{ maskSecret(data.clientSecret) }}
        </el-text>
      </el-descriptions-item> -->
      <el-descriptions-item
        v-if="!data.anonymous && data.roles?.length"
        label="关联角色"
        :span="2"
      >
        <div class="role-tags">
          <el-tag
            v-for="role in data.roles"
            :key="role.id"
            type="primary"
            size="small"
            class="role-tag"
          >
            {{ role.name }}
          </el-tag>
        </div>
      </el-descriptions-item>
      <!-- <el-descriptions-item v-if="data.description" label="设备描述" :span="2">
        <div
          style="
            max-height: 100px;
            overflow-y: auto;
            word-break: break-all;
            white-space: pre-wrap;
          "
        >
          {{ data.description }}
        </div>
      </el-descriptions-item>
      <el-descriptions-item v-if="data.lastLoginTime" label="最后登录时间">
        {{ data.lastLoginTime }}
      </el-descriptions-item>
      <el-descriptions-item v-if="data.loginCount" label="登录次数">
        {{ data.loginCount }}
      </el-descriptions-item> -->
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
import { ElTag, ElText } from "element-plus";
import type { ClientDevice } from "qc-admin-api-common/client_devices";

// 定义 props
const props = defineProps<{
  visible: boolean;
  data: ClientDevice;
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

// 格式化过期时间
const formatExpiry = (expiry: number) => {
  const seconds = expiry / 1000;
  const minutes = seconds / 60;
  const hours = minutes / 60;
  const days = hours / 24;

  if (days >= 1) {
    return `${Math.floor(days)}天 ${Math.floor(hours % 24)}小时`;
  } else if (hours >= 1) {
    return `${Math.floor(hours)}小时 ${Math.floor(minutes % 60)}分钟`;
  } else {
    return `${Math.floor(minutes)}分钟`;
  }
};

// 遮罩敏感信息
const maskSecret = (secret: string) => {
  if (!secret || secret.length <= 8) {
    return secret;
  }
  const start = secret.substring(0, 4);
  const end = secret.substring(secret.length - 4);
  const middle = "*".repeat(Math.min(secret.length - 8, 20));
  return `${start}${middle}${end}`;
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

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.role-tag {
  margin: 0;
}

:deep(.el-descriptions__body) {
  .el-descriptions__table {
    .el-descriptions__cell {
      vertical-align: top;
    }
  }
}
</style>
