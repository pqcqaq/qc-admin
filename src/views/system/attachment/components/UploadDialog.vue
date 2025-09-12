<template>
  <el-dialog
    v-model="visible"
    title="文件上传"
    width="600px"
    draggable
    @close="handleClose"
  >
    <div class="upload-container">
      <!-- 上传方式选择 -->
      <el-radio-group v-model="uploadMode" class="mb-4">
        <el-radio-button label="confirm" size="large"
          >分离式上传</el-radio-button
        >
        <el-radio-button label="direct" size="large">直接上传</el-radio-button>
      </el-radio-group>

      <!-- 分离式上传 -->
      <div v-if="uploadMode === 'confirm'" class="confirm-upload">
        <el-upload
          ref="uploadRef"
          class="upload-demo"
          drag
          :multiple="true"
          :auto-upload="false"
          :on-change="handleFileChange"
          :file-list="fileList"
          :on-remove="handleRemove"
        >
          <el-icon class="el-icon--upload">
            <upload-filled />
          </el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              分离式上传：先选择文件，然后批量上传
            </div>
          </template>
        </el-upload>

        <!-- 文件列表和上传进度 -->
        <div v-if="fileList.length > 0" class="file-list mt-4">
          <div v-for="(file, index) in fileList" :key="index" class="file-item">
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{
                formatFileSize(file.size || 0)
              }}</span>
            </div>
            <div class="file-progress">
              <el-progress
                v-if="file.uploadProgress !== undefined"
                :percentage="file.uploadProgress"
                :status="file.uploadStatus"
                :stroke-width="8"
              />
              <el-tag v-else type="info" size="small"> 待上传 </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 直接上传 -->
      <div v-else class="direct-upload">
        <el-upload
          class="upload-demo"
          drag
          :multiple="true"
          :action="directUploadUrl"
          :headers="uploadHeaders"
          :on-success="handleDirectUploadSuccess"
          :on-error="handleDirectUploadError"
          :on-progress="handleDirectUploadProgress"
          :before-upload="beforeDirectUpload"
        >
          <el-icon class="el-icon--upload">
            <upload-filled />
          </el-icon>
          <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          <template #tip>
            <div class="el-upload__tip">
              直接上传：选择文件后立即上传到服务器
            </div>
          </template>
        </el-upload>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          v-if="uploadMode === 'confirm'"
          type="primary"
          :loading="uploading"
          :disabled="fileList.length === 0"
          @click="handleConfirmUpload"
        >
          开始上传
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage } from "element-plus";
import { UploadFilled } from "@element-plus/icons-vue";
import type {
  UploadFile,
  UploadFiles,
  UploadProgressEvent
} from "element-plus";
import { prepareUpload, confirmUpload, directUpload } from "@/api/attachment";

interface FileItem extends UploadFile {
  uploadProgress?: number;
  uploadStatus?: "success" | "exception" | "warning";
  uploadToken?: string;
  fileId?: string;
  uploadSessionId?: string;
}

// 定义 props
const props = defineProps<{
  visible: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  "update:visible": [visible: boolean];
  success: [];
}>();

const uploadRef = ref();
const uploadMode = ref<"confirm" | "direct">("confirm");
const uploading = ref(false);
const fileList = ref<FileItem[]>([]);

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: value => emit("update:visible", value)
});

// 直接上传相关
const directUploadUrl = "/api/attachments/direct-upload";
const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem("token") || ""}`
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 文件选择变化（分离式上传）
const handleFileChange = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files.map(f => ({
    ...f,
    uploadProgress: undefined,
    uploadStatus: undefined
  }));
};

// 移除文件
const handleRemove = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files;
};

// 分离式上传 - 开始上传
const handleConfirmUpload = async () => {
  if (fileList.value.length === 0) {
    ElMessage.warning("请先选择文件");
    return;
  }

  uploading.value = true;

  try {
    for (let i = 0; i < fileList.value.length; i++) {
      const file = fileList.value[i];
      if (!file.raw) continue;

      try {
        // 1. 准备上传
        file.uploadProgress = 0;
        file.uploadStatus = undefined;

        const prepareData = {
          filename: file.name,
          contentType: file.raw.type || "application/octet-stream",
          size: file.raw.size
        };

        const prepareResult = await prepareUpload(prepareData);
        if (!prepareResult.success) {
          throw new Error(prepareResult.message || "准备上传失败");
        }

        // 2. 实际上传文件到第三方存储
        const uploadUrl = prepareResult.data.uploadUrl;

        // 使用XMLHttpRequest进行文件上传以支持进度监控
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          // 监听上传进度
          xhr.upload.addEventListener("progress", event => {
            if (event.lengthComputable) {
              file.uploadProgress = Math.round(
                (event.loaded / event.total) * 100
              );
            }
          });

          // 监听上传完成
          xhr.addEventListener("load", () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              file.uploadProgress = 100;
              resolve();
            } else {
              reject(new Error(`上传失败: ${xhr.statusText}`));
            }
          });

          // 监听上传错误
          xhr.addEventListener("error", () => {
            reject(new Error("网络错误，上传失败"));
          });

          // 发起请求 - 直接发送文件内容，不使用FormData
          xhr.open("PUT", uploadUrl);
          // 设置Content-Type为文件的MIME类型
          xhr.setRequestHeader(
            "Content-Type",
            file.raw.type || "application/octet-stream"
          );
          xhr.send(file.raw);
        });

        // 3. 确认上传完成
        const confirmData = {
          uploadSessionId: prepareResult.data.uploadSessionId
        };

        const confirmResult = await confirmUpload(confirmData);
        if (!confirmResult.success) {
          throw new Error(confirmResult.message || "确认上传失败");
        }

        file.uploadStatus = "success";
        ElMessage.success(`文件 ${file.name} 上传成功`);
      } catch (error) {
        file.uploadStatus = "exception";
        file.uploadProgress = 0;
        console.error(`文件 ${file.name} 上传失败:`, error);
        ElMessage.error(`文件 ${file.name} 上传失败: ${error.message}`);
      }
    }

    const successCount = fileList.value.filter(
      f => f.uploadStatus === "success"
    ).length;
    if (successCount > 0) {
      ElMessage.success(`成功上传 ${successCount} 个文件`);
      emit("success");
      handleClose();
    }
  } catch (error) {
    console.error("批量上传失败:", error);
    ElMessage.error("批量上传失败");
  } finally {
    uploading.value = false;
  }
};

// 直接上传 - 上传前检查
const beforeDirectUpload = (file: File) => {
  const isLt10M = file.size / 1024 / 1024 < 10;
  if (!isLt10M) {
    ElMessage.error("上传文件大小不能超过 10MB!");
    return false;
  }
  return true;
};

// 直接上传 - 上传成功
const handleDirectUploadSuccess = (response: any, file: UploadFile) => {
  if (response.success) {
    ElMessage.success(`文件 ${file.name} 上传成功`);
    emit("success");
  } else {
    ElMessage.error(`文件 ${file.name} 上传失败: ${response.message}`);
  }
};

// 直接上传 - 上传失败
const handleDirectUploadError = (error: Error, file: UploadFile) => {
  console.error("直接上传失败:", error);
  ElMessage.error(`文件 ${file.name} 上传失败`);
};

// 直接上传 - 上传进度
const handleDirectUploadProgress = (
  event: UploadProgressEvent,
  file: UploadFile
) => {
  // 可以在这里显示上传进度
  console.log(`文件 ${file.name} 上传进度: ${event.percent}%`);
};

// 重置状态
const resetState = () => {
  fileList.value = [];
  uploading.value = false;
  uploadMode.value = "confirm";
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

  .file-list {
    max-height: 300px;
    padding: 12px;
    overflow-y: auto;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;

    .file-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--el-border-color-lighter);

      &:last-child {
        border-bottom: none;
      }

      .file-info {
        display: flex;
        flex: 1;
        flex-direction: column;

        .file-name {
          margin-bottom: 4px;
          font-weight: 500;
        }

        .file-size {
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
      }

      .file-progress {
        width: 200px;
        margin-left: 12px;
      }
    }
  }
}

.dialog-footer {
  text-align: right;
}

:deep(.el-upload-dragger) {
  position: relative;
  width: 100%;
  height: 180px;
  overflow: hidden;
  text-align: center;
  border: 2px dashed var(--el-border-color);
  border-radius: 6px;
  transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);

  &:hover {
    border-color: var(--el-color-primary);
  }
}

:deep(.el-icon--upload) {
  margin: 40px 0 16px;
  font-size: 67px;
  line-height: 50px;
  color: var(--el-text-color-placeholder);
}
</style>
