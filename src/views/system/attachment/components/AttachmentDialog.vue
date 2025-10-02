<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    draggable
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="文件名" prop="filename">
        <el-input v-model="form.filename" placeholder="请输入文件名" />
      </el-form-item>
      <el-form-item label="存储类型" prop="storageProvider">
        <el-select v-model="form.storageProvider" placeholder="请选择存储类型">
          <el-option label="本地存储" value="local" />
          <el-option label="S3" value="s3" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-select v-model="form.status" placeholder="请选择状态">
          <el-option label="正常" value="active" />
          <el-option label="已删除" value="deleted" />
          <el-option label="处理中" value="processing" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签" prop="tags">
        <TagInput v-model="form.tags" :max-tags="10" />
      </el-form-item>
      <el-form-item v-if="type === 'edit'" label="存储路径">
        <el-input
          v-model="form.path"
          placeholder="存储路径"
          readonly
          type="textarea"
          :rows="2"
        />
      </el-form-item>
      <el-form-item v-if="type === 'edit'" label="文件大小">
        <el-input :value="formatFileSize(form.size || 0)" readonly />
      </el-form-item>
      <el-form-item v-if="type === 'edit'" label="文件类型">
        <el-input v-model="form.contentType" readonly />
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
import type { Attachment } from "qc-admin-api-common/attachment";
import TagInput from "./TagInput.vue";

interface AttachmentFormData {
  id: string;
  filename: string;
  originalFilename: string;
  size?: number;
  contentType: string;
  path: string;
  storageProvider: string;
  status: string;
  tags: string[];
}

// 定义 props
const props = defineProps<{
  visible: boolean;
  type: "add" | "edit";
  attachmentData?: Attachment;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  submit: [formData: AttachmentFormData];
}>();

const formRef = ref<FormInstance>();

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

const dialogTitle = computed(() => {
  return props.type === "add" ? "新增附件" : "编辑附件";
});

// 表单数据
const form = reactive<AttachmentFormData>({
  id: "",
  filename: "",
  originalFilename: "",
  size: 0,
  contentType: "",
  path: "",
  storageProvider: "s3",
  status: "active",
  tags: []
});

// 表单验证规则
const rules = {
  // originalFilename: [
  //   { required: true, message: "请输入原始文件名", trigger: "blur" },
  //   {
  //     min: 1,
  //     max: 255,
  //     message: "文件名长度在 1 到 255 个字符",
  //     trigger: "blur"
  //   }
  // ],
  filename: [
    { required: true, message: "请输入文件名", trigger: "blur" },
    {
      min: 1,
      max: 255,
      message: "文件名长度在 1 到 255 个字符",
      trigger: "blur"
    }
  ],
  storageProvider: [
    { required: true, message: "请选择存储类型", trigger: "change" }
  ],
  status: [{ required: true, message: "请选择状态", trigger: "change" }]
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: "",
    filename: "",
    size: 0,
    contentType: "",
    path: "",
    storageProvider: "s3",
    status: "active",
    tags: []
  });
};

// 监听附件数据变化
watch(
  () => props.attachmentData,
  newData => {
    if (newData && props.type === "edit") {
      Object.assign(form, {
        id: newData.id,
        filename: newData.filename,
        size: newData.size,
        contentType: newData.contentType,
        path: newData.path,
        storageProvider: newData.storageProvider || "s3",
        status: newData.status || "active",
        tags: newData.tags || []
      });
    } else {
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
