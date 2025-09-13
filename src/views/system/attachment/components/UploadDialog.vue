<template>
  <el-dialog
    v-model="visible"
    title="文件上传"
    width="600px"
    draggable
    @close="handleClose"
  >
    <div class="upload-container">
      <!-- 上传组件类型选择 -->
      <el-radio-group v-model="uploadType" class="mb-4">
        <el-radio-button label="drag">拖拽上传</el-radio-button>
        <el-radio-button label="card">卡片上传</el-radio-button>
        <el-radio-button label="button">按钮上传</el-radio-button>
      </el-radio-group>

      <!-- 文件数量限制选择 -->
      <div class="limit-controls mb-4">
        <el-radio-group v-model="limitMode">
          <el-radio-button label="single">单文件</el-radio-button>
          <el-radio-button label="multiple">多文件</el-radio-button>
        </el-radio-group>
        <el-input-number
          v-if="limitMode === 'multiple'"
          v-model="fileLimit"
          :min="2"
          :max="20"
          class="ml-4"
          controls-position="right"
        />
      </div>

      <!-- 上传组件 -->
      <UploadFormItem
        v-model="uploadedFiles"
        :type="uploadType"
        :limit="limitMode === 'single' ? 1 : fileLimit"
        :placeholder="getPlaceholder()"
        :tip="getTipText()"
        @upload-success="handleUploadSuccess"
        @upload-error="handleUploadError"
      />

      <!-- 上传结果展示 -->
      <div
        v-if="uploadedFiles && uploadedFiles.length > 0"
        class="upload-result mt-4"
      >
        <el-alert
          title="上传成功"
          type="success"
          :description="`已成功上传 ${Array.isArray(uploadedFiles) ? uploadedFiles.length : 1} 个文件`"
          show-icon
          :closable="false"
        />
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import UploadFormItem from "../../../../components/Upload/UploadFormItem.vue";

// 定义 props
const props = defineProps<{
  visible: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  success: [files: string | string[]];
}>();

// 响应式数据
const uploadType = ref<"drag" | "card" | "button">("drag");
const limitMode = ref<"single" | "multiple">("multiple");
const fileLimit = ref(5);
const uploadedFiles = ref<string | string[]>([]);

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 获取占位符文本
const getPlaceholder = () => {
  const typeTexts = {
    drag: "将文件拖到此处，或点击上传",
    card: "点击上传文件",
    button: "选择文件"
  };
  return typeTexts[uploadType.value];
};

// 获取提示文本
const getTipText = () => {
  const limit = limitMode.value === "single" ? 1 : fileLimit.value;
  const limitText = limit === 1 ? "只能上传1个文件" : `最多上传${limit}个文件`;
  return `${limitText}，文件大小不超过10MB`;
};

// 上传成功处理
const handleUploadSuccess = (files: any[]) => {
  ElMessage.success(`成功上传 ${files.length} 个文件`);
};

// 上传错误处理
const handleUploadError = (error: Error) => {
  console.error("上传失败:", error);
  ElMessage.error(`上传失败: ${error.message}`);
};

// 确定按钮处理
const handleConfirm = () => {
  if (uploadedFiles.value) {
    emit("success", uploadedFiles.value);
  }
  handleClose();
};

// 重置状态
const resetState = () => {
  uploadedFiles.value = limitMode.value === "single" ? "" : [];
  uploadType.value = "drag";
  limitMode.value = "multiple";
  fileLimit.value = 5;
};

// 监听弹窗显示状态
watch(
  () => props.visible,
  newVisible => {
    if (newVisible) {
      resetState();
    }
  }
);

// 监听限制模式变化
watch(limitMode, newMode => {
  uploadedFiles.value = newMode === "single" ? "" : [];
});

// 关闭对话框
const handleClose = () => {
  visible.value = false;
  resetState();
};
</script>

<style lang="scss" scoped>
.upload-container {
  .mb-4 {
    margin-bottom: 16px;
  }

  .mt-4 {
    margin-top: 16px;
  }

  .ml-4 {
    margin-left: 16px;
  }

  .limit-controls {
    display: flex;
    align-items: center;
    padding: 12px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;

    .el-input-number {
      width: 120px;
    }
  }

  .upload-result {
    .el-alert {
      border-radius: 6px;
    }
  }
}

.dialog-footer {
  text-align: right;
}
</style>
