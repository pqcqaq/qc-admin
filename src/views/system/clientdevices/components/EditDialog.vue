<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    draggable
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="设备名称" prop="name">
            <el-input
              v-model="form.name"
              placeholder="请输入设备名称"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="设备状态" prop="enabled">
            <el-switch
              v-model="form.enabled"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-form-item label="设备备注" prop="description">
        <el-input
          v-model="form.description"
          placeholder="请输入设备备注"
          type="textarea"
          clearable
        />
      </el-form-item>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="AccessToken过期时间" prop="accessTokenExpiry">
            <el-input-number
              v-model="form.accessTokenExpiry"
              :min="1000"
              :max="86400000"
              :step="60000"
              placeholder="毫秒"
              style="width: 100%"
            />
            <div class="form-tip">单位：毫秒（最小1秒钟，最大24小时）</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="RefreshToken过期时间" prop="refreshTokenExpiry">
            <el-input-number
              v-model="form.refreshTokenExpiry"
              :min="3600000"
              :max="2592000000"
              :step="3600000"
              placeholder="毫秒"
              style="width: 100%"
            />
            <div class="form-tip">单位：毫秒（最小1小时，最大30天）</div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="匿名登录" prop="anonymous">
        <el-switch
          v-model="form.anonymous"
          active-text="允许所有角色登录"
          inactive-text="仅限指定角色登录"
        />
        <div class="form-tip">
          开启后，任何用户都可以使用此设备登录；关闭后，只有拥有指定角色的用户才能登录
        </div>
      </el-form-item>

      <el-form-item v-if="!form.anonymous" label="关联角色" prop="roles">
        <RoleSelector v-model="form.roles" placeholder="请选择关联的角色" />
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
import { type FormInstance, ElMessage, FormItemRule } from "element-plus";
import type {
  ClientDevice,
  RoleInfo,
  CreateClientDeviceRequest,
  UpdateClientDeviceRequest
} from "@/api/client_devices";
import RoleSelector from "@/components/Role/RoleSelector.vue";
import { Arrayable } from "@vueuse/core";

type DataType = ClientDevice;

interface FormData {
  id?: string;
  name: string;
  description: string;
  enabled: boolean;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
  anonymous: boolean;
  roles: RoleInfo[];
}

// 定义 props
const props = defineProps<{
  visible: boolean;
  type: "add" | "edit";
  data?: DataType;
  loading: boolean;
  getDetailApi: (data: { id: string }) => Promise<DataType>;
}>();

// 定义 emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  submit: [
    formData:
      | CreateClientDeviceRequest
      | (UpdateClientDeviceRequest & { id: string })
  ];
}>();

const formRef = ref<FormInstance>();

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const dialogTitle = computed(() => {
  return props.type === "add" ? "新增客户端设备" : "编辑客户端设备";
});

// 表单数据
const form = reactive<FormData>({
  id: "",
  name: "",
  description: "",
  enabled: true,
  accessTokenExpiry: 3600000, // 默认1小时
  refreshTokenExpiry: 86400000, // 默认24小时
  anonymous: false,
  roles: []
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入设备名称", trigger: "blur" },
    {
      min: 1,
      max: 100,
      message: "设备名称长度在 1 到 100 个字符",
      trigger: "blur"
    }
  ],
  enabled: [{ required: true, message: "请选择设备状态", trigger: "change" }],
  accessTokenExpiry: [
    { required: true, message: "请输入AccessToken过期时间", trigger: "blur" },
    {
      type: "number",
      min: 1000,
      max: 86400000,
      message: "AccessToken过期时间在 1分钟 到 24小时 之间",
      trigger: "blur"
    }
  ],
  refreshTokenExpiry: [
    { required: true, message: "请输入RefreshToken过期时间", trigger: "blur" },
    {
      type: "number",
      min: 3600000,
      max: 2592000000,
      message: "RefreshToken过期时间在 1小时 到 30天 之间",
      trigger: "blur"
    }
  ],
  anonymous: [
    { required: true, message: "请选择是否允许匿名登录", trigger: "change" }
  ],
  roles: [
    {
      validator: (rule: any, value: RoleInfo[], callback: any) => {
        if (!form.anonymous && (!value || value.length === 0)) {
          callback(new Error("非匿名模式下必须选择至少一个关联角色"));
        } else {
          callback();
        }
      },
      trigger: ["change", "blur"]
    }
  ]
} satisfies Record<string, Arrayable<FormItemRule>>;

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: "",
    name: "",
    enabled: true,
    accessTokenExpiry: 3600000,
    refreshTokenExpiry: 86400000,
    anonymous: false,
    roles: []
  });
};

// 监听弹窗显示和数据变化
watch(
  [() => props.visible, () => props.data],
  ([newVisible, newData]) => {
    if (newVisible && newData && props.type === "edit") {
      props.getDetailApi({ id: newData.id }).then(res => {
        Object.assign(form, res);
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

// 监听匿名登录状态变化
watch(
  () => form.anonymous,
  newAnonymous => {
    if (newAnonymous) {
      form.roles = [];
    }
    // 重新验证roles字段
    nextTick(() => {
      formRef.value?.validateField("roles");
    });
  }
);

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    // 构建提交数据
    const submitData = {
      name: form.name,
      enabled: form.enabled,
      description: form.description,
      accessTokenExpiry: form.accessTokenExpiry,
      refreshTokenExpiry: form.refreshTokenExpiry,
      anonymous: form.anonymous,
      roleIds: form.roles.map(role => role.id)
    };

    if (props.type === "edit" && form.id) {
      emit("submit", { id: form.id, ...submitData });
    } else {
      emit("submit", submitData);
    }
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

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #909399;
}
</style>
