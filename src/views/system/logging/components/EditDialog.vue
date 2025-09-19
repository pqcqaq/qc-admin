<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="800px"
    draggable
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="日志级别" prop="level">
            <el-select v-model="form.level" placeholder="请选择日志级别">
              <el-option label="DEBUG" value="debug" />
              <el-option label="INFO" value="info" />
              <el-option label="WARN" value="warn" />
              <el-option label="ERROR" value="error" />
              <el-option label="FATAL" value="fatal" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="日志类型" prop="type">
            <el-select v-model="form.type" placeholder="请选择日志类型">
              <el-option label="错误" value="Error" />
              <el-option label="崩溃" value="Panic" />
              <el-option label="手动" value="manul" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="消息内容" prop="message">
        <el-input
          v-model="form.message"
          type="textarea"
          :rows="3"
          placeholder="请输入消息内容"
        />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="请求方法" prop="method">
            <el-select
              v-model="form.method"
              placeholder="请选择请求方法"
              clearable
            >
              <el-option label="GET" value="GET" />
              <el-option label="POST" value="POST" />
              <el-option label="PUT" value="PUT" />
              <el-option label="DELETE" value="DELETE" />
              <el-option label="PATCH" value="PATCH" />
              <el-option label="HEAD" value="HEAD" />
              <el-option label="OPTIONS" value="OPTIONS" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态码" prop="code">
            <el-input-number
              v-model="form.code"
              :min="100"
              :max="599"
              placeholder="请输入状态码"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="请求路径" prop="path">
        <el-input v-model="form.path" placeholder="请输入请求路径" clearable />
      </el-form-item>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="IP地址" prop="ip">
            <el-input v-model="form.ip" placeholder="请输入IP地址" clearable />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="查询参数" prop="query">
            <el-input
              v-model="form.query"
              placeholder="请输入查询参数"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="用户代理" prop="userAgent">
        <el-input
          v-model="form.userAgent"
          placeholder="请输入用户代理信息"
          clearable
        />
      </el-form-item>

      <el-form-item label="附加数据" prop="dataJson">
        <el-input
          v-model="form.dataJson"
          type="textarea"
          :rows="3"
          placeholder="请输入JSON格式的附加数据"
        />
      </el-form-item>

      <el-form-item label="堆栈信息" prop="stack">
        <el-input
          v-model="form.stack"
          type="textarea"
          :rows="5"
          placeholder="请输入堆栈信息"
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
import { type FormInstance, ElMessage, FormItemRule } from "element-plus";
import type { Logging } from "@/api/logging";
import { Arrayable } from "@vueuse/core";

interface FormData {
  id: string;
  level: "debug" | "info" | "error" | "warn" | "fatal";
  type: "Error" | "Panic" | "manul";
  message: string;
  method?: string;
  path?: string;
  ip?: string;
  query?: string;
  code?: number;
  userAgent?: string;
  dataJson: string; // JSON字符串形式
  stack?: string;
}

// 定义 props
const props = defineProps<{
  visible: boolean;
  type: "add" | "edit";
  data?: Logging;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  submit: [
    formData: Omit<FormData, "dataJson"> & { data?: Record<string, any> }
  ];
}>();

const formRef = ref<FormInstance>();

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const dialogTitle = computed(() => {
  return props.type === "add" ? "新增日志" : "编辑日志";
});

// 表单数据
const form = reactive<FormData>({
  id: "",
  level: "info",
  type: "manul",
  message: "",
  method: "",
  path: "",
  ip: "",
  query: "",
  code: undefined,
  userAgent: "",
  dataJson: "",
  stack: ""
});

// 表单验证规则
const rules = {
  level: [{ required: true, message: "请选择日志级别", trigger: "change" }],
  type: [{ required: true, message: "请选择日志类型", trigger: "change" }],
  message: [
    { required: true, message: "请输入消息内容", trigger: "blur" },
    {
      min: 1,
      max: 500,
      message: "消息内容长度在 1 到 500 个字符",
      trigger: "blur"
    }
  ],
  method: [
    { max: 127, message: "请求方法长度不能超过 127 个字符", trigger: "blur" }
  ],
  path: [
    { max: 255, message: "请求路径长度不能超过 255 个字符", trigger: "blur" }
  ],
  ip: [{ max: 45, message: "IP地址长度不能超过 45 个字符", trigger: "blur" }],
  query: [
    { max: 1000, message: "查询参数长度不能超过 1000 个字符", trigger: "blur" }
  ],
  code: [
    {
      type: "number",
      min: 100,
      max: 599,
      message: "状态码应在 100-599 之间",
      trigger: "blur"
    }
  ],
  userAgent: [
    { max: 512, message: "用户代理长度不能超过 512 个字符", trigger: "blur" }
  ],
  dataJson: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (!value) {
          callback();
          return;
        }
        try {
          JSON.parse(value);
          callback();
        } catch (error) {
          callback(new Error("附加数据必须是有效的JSON格式"));
        }
      },
      trigger: "blur"
    }
  ],
  stack: [
    { max: 8192, message: "堆栈信息长度不能超过 8192 个字符", trigger: "blur" }
  ]
} satisfies Record<string, Arrayable<FormItemRule>>;

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: "",
    level: "info",
    type: "manul",
    message: "",
    method: "",
    path: "",
    ip: "",
    query: "",
    code: undefined,
    userAgent: "",
    dataJson: "",
    stack: ""
  });
};

// 监听弹窗显示和数据变化
watch(
  [() => props.visible, () => props.data],
  ([newVisible, newData]) => {
    if (newVisible && newData && props.type === "edit") {
      Object.assign(form, {
        id: newData.id,
        level: newData.level,
        type: newData.type,
        message: newData.message,
        method: newData.method || "",
        path: newData.path || "",
        ip: newData.ip || "",
        query: newData.query || "",
        code: newData.code,
        userAgent: newData.userAgent || "",
        dataJson: newData.data ? JSON.stringify(newData.data, null, 2) : "",
        stack: newData.stack || ""
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

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  await formRef.value.validate(async valid => {
    if (!valid) return;

    // 处理JSON数据
    let parsedData: Record<string, any> | undefined;
    if (form.dataJson) {
      try {
        parsedData = JSON.parse(form.dataJson);
      } catch (error) {
        ElMessage.error("附加数据JSON格式错误");
        return;
      }
    }

    // 构建提交数据
    const submitData = {
      id: form.id,
      level: form.level,
      type: form.type,
      message: form.message,
      method: form.method || undefined,
      path: form.path || undefined,
      ip: form.ip || undefined,
      query: form.query || undefined,
      code: form.code,
      userAgent: form.userAgent || undefined,
      data: parsedData,
      stack: form.stack || undefined
    };

    emit("submit", submitData);
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
