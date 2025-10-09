<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    draggable
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <!-- Type -->
      <el-form-item label="类型" prop="type" label-width="90">
        <template v-slot:label>
          <span>API类型</span>
          <el-tooltip
            content="Websocket类型为client操作时允许的Topic"
            effect="dark"
            placement="right"
          >
            <el-icon><QuestionFilled /></el-icon>
          </el-tooltip>
        </template>
        <el-select v-model="form.type" placeholder="请选择类型">
          <el-option label="HTTP" value="http" />
          <el-option label="WebSocket" value="websocket" />
        </el-select>
      </el-form-item>
      <!-- 提示信息 -->
      <el-form-item label="名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入名称" />
      </el-form-item>
      <el-form-item label="描述" prop="description">
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="3"
          placeholder="请输入描述"
        />
      </el-form-item>
      <el-form-item v-if="form.type === 'http'" label="请求方法" prop="method">
        <el-select v-model="form.method" placeholder="请选择请求方法">
          <el-option label="GET" value="GET" />
          <el-option label="POST" value="POST" />
          <el-option label="PUT" value="PUT" />
          <el-option label="DELETE" value="DELETE" />
          <el-option label="PATCH" value="PATCH" />
          <el-option label="HEAD" value="HEAD" />
          <el-option label="OPTIONS" value="OPTIONS" />
        </el-select>
      </el-form-item>
      <el-form-item v-else label="操作类型" prop="method">
        <el-select v-model="form.method" placeholder="请选择请求方法">
          <el-option label="Subscribe" value="Subscribe" />
          <el-option label="ChannelStart" value="ChannelStart" />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="`${form.type === 'http' ? '请求路径' : 'Topic'}`"
        prop="path"
      >
        <el-input
          v-model="form.path"
          :placeholder="`请输入${form.type === 'http' ? '请求路径' : 'Topic'}`"
        />
      </el-form-item>
      <el-form-item label="是否公开" prop="isPublic">
        <el-switch
          v-model="form.isPublic"
          active-text="公开"
          inactive-text="私有"
        />
      </el-form-item>
      <el-form-item label="状态" prop="isActive">
        <el-switch
          v-model="form.isActive"
          active-text="激活"
          inactive-text="禁用"
        />
      </el-form-item>
      <!-- 权限列表 -->
      <el-form-item v-if="!form.isPublic" label="权限" prop="permissions">
        <PermissionSelector
          v-model="form.permissions"
          placeholder="请选择权限"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          确定
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, computed, watch } from "vue";
import { type FormInstance } from "element-plus";
import type { APIAuth } from "qc-admin-api-common/api_auth";
import PermissionSelector from "@/components/Permission/PermissionSelector.vue";
import { Permission } from "qc-admin-api-common/rbac";
import { ElTooltip, ElIcon } from "element-plus";
import { QuestionFilled } from "@element-plus/icons-vue";

interface FormData {
  id: string;
  name: string;
  description: string;
  method: string;
  path: string;
  isPublic: boolean;
  isActive: boolean;
  permissions?: Permission[];
  type: "http" | "websocket";
}

// 定义 props
const props = defineProps<{
  visible: boolean;
  type: "add" | "edit";
  data?: APIAuth;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  submit: [formData: FormData];
}>();

const formRef = ref<FormInstance>();

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const dialogTitle = computed(() => {
  return props.type === "add" ? "新增API认证" : "编辑API认证";
});

// 表单数据
const form = reactive<FormData>({
  id: "",
  name: "",
  description: "",
  method: "",
  path: "",
  isPublic: false,
  isActive: true,
  permissions: [],
  type: "http"
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入名称", trigger: "blur" },
    { min: 2, max: 50, message: "名称长度在 2 到 50 个字符", trigger: "blur" }
  ],
  description: [
    { required: true, message: "请输入描述", trigger: "blur" },
    { min: 2, max: 200, message: "描述长度在 2 到 200 个字符", trigger: "blur" }
  ],
  method: [{ required: true, message: "请选择请求方法", trigger: "change" }],
  path: [{ required: true, message: "请输入请求路径", trigger: "blur" }],
  isPublic: [{ required: true, message: "请选择是否公开", trigger: "change" }],
  isActive: [{ required: true, message: "请选择状态", trigger: "change" }],
  type: [{ required: true, message: "请选择类型", trigger: "change" }]
};

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: "",
    name: "",
    description: "",
    method: "GET",
    path: "",
    isPublic: false,
    isActive: true,
    permissions: []
  });
};

// 监听弹窗显示和用户数据变化
watch(
  [() => props.visible, () => props.data],
  ([newVisible, newData]) => {
    if (newVisible && newData && props.type === "edit") {
      Object.assign(form, {
        id: newData.id,
        name: newData.name,
        description: newData.description,
        method: newData.method,
        path: newData.path,
        isPublic: newData.isPublic,
        isActive: newData.isActive,
        permissions: newData.permissions || []
      });
    } else if (newVisible && props.type === "add") {
      resetForm();
    }
  },
  { immediate: true }
);

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVisible => {
    if (newVisible) {
      nextTick(() => {
        formRef.value?.clearValidate();
      });
    }
  }
);

// 监听form变化，type改变时，修改method的默认值
watch(
  () => form.type,
  newType => {
    if (newType === "http") {
      form.method = "GET";
    } else if (newType === "websocket") {
      form.method = "Subscribe";
    }
  }
);

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;
    emit("submit", { ...form });
  });
};

// 关闭对话框
const handleClose = () => {
  visible.value = false;
  resetForm();
};
</script>

<style lang="scss" scoped>
.dialog-footer {
  text-align: right;
}
</style>
