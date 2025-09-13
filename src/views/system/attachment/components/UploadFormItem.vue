<template>
  <div
    class="upload-form-item"
    :class="[`upload-${type}`, { 'upload-single': limit === 1 }]"
  >
    <!-- 圆形头像上传 -->
    <div v-if="type === 'avatar'" class="avatar-upload">
      <el-upload
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
        :before-upload="beforeUpload"
        accept="image/*"
      >
        <div class="avatar-wrapper">
          <img v-if="displayUrl" :src="displayUrl" class="avatar-image" />
          <div v-else class="avatar-placeholder">
            <el-icon class="avatar-icon">
              <Plus />
            </el-icon>
            <span class="avatar-text">{{ placeholder || "上传头像" }}</span>
          </div>
          <div class="avatar-overlay">
            <el-icon class="overlay-icon">
              <Camera />
            </el-icon>
          </div>
        </div>
      </el-upload>
    </div>

    <!-- 拖拽上传区域 -->
    <div v-else-if="type === 'drag'" class="drag-upload">
      <el-upload
        ref="uploadRef"
        class="upload-drag"
        drag
        :multiple="limit !== 1"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        :on-remove="handleRemove"
        :limit="limit"
        :on-exceed="handleExceed"
      >
        <div class="upload-content">
          <el-icon class="el-icon--upload">
            <upload-filled />
          </el-icon>
          <div class="el-upload__text">
            {{ placeholder || "将文件拖到此处，或点击上传" }}
          </div>
          <div v-if="tipText" class="el-upload__tip">
            {{ tipText }}
          </div>
        </div>
      </el-upload>
    </div>

    <!-- 卡片式上传 -->
    <div v-else-if="type === 'card'" class="card-upload">
      <div class="upload-grid">
        <!-- 已上传文件预览 -->
        <div
          v-for="(file, index) in uploadedFiles"
          :key="file.id || index"
          class="upload-card file-card"
        >
          <div class="file-preview">
            <img
              v-if="isImage(file.name)"
              :src="file.url"
              class="preview-image"
            />
            <div v-else class="file-icon">
              <el-icon size="40">
                <Document />
              </el-icon>
            </div>
          </div>
          <div class="file-info">
            <div class="file-name" :title="file.name">{{ file.name }}</div>
            <div class="file-actions">
              <el-button
                type="primary"
                link
                size="small"
                @click="previewFile(file)"
              >
                预览
              </el-button>
              <el-button
                type="danger"
                link
                size="small"
                @click="removeUploadedFile(index)"
              >
                删除
              </el-button>
            </div>
          </div>
          <div v-if="file.uploading" class="upload-progress">
            <el-progress :percentage="file.progress" :stroke-width="4" />
          </div>
        </div>

        <!-- 上传按钮 -->
        <div
          v-if="showUploadButton"
          class="upload-card upload-trigger"
          @click="triggerUpload"
        >
          <el-icon class="upload-icon">
            <Plus />
          </el-icon>
          <div class="upload-text">{{ uploadButtonText }}</div>
        </div>
      </div>

      <!-- 隐藏的上传组件 -->
      <el-upload
        ref="uploadRef"
        style="display: none"
        :multiple="limit !== 1"
        :auto-upload="false"
        :on-change="handleFileChange"
        :limit="limit"
        :on-exceed="handleExceed"
        :show-file-list="false"
      />
    </div>

    <!-- 简单按钮上传 -->
    <div v-else class="button-upload">
      <el-upload
        ref="uploadRef"
        :multiple="limit !== 1"
        :auto-upload="false"
        :on-change="handleFileChange"
        :file-list="fileList"
        :on-remove="handleRemove"
        :limit="limit"
        :on-exceed="handleExceed"
        :show-file-list="limit !== 1"
      >
        <el-button type="primary">
          <el-icon><Upload /></el-icon>
          {{ placeholder || "选择文件" }}
        </el-button>
        <template #tip>
          <div class="el-upload__tip">
            {{ tipText }}
          </div>
        </template>
      </el-upload>

      <!-- 单文件模式下显示文件信息 -->
      <div v-if="limit === 1 && selectedFile" class="single-file-info">
        <div class="file-item">
          <el-icon><Document /></el-icon>
          <span class="file-name">{{ selectedFile.name }}</span>
          <el-button type="danger" link size="small" @click="clearSelectedFile">
            移除
          </el-button>
        </div>
        <div v-if="selectedFile.uploading" class="upload-progress">
          <el-progress :percentage="selectedFile.progress" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import {
  Plus,
  Upload,
  UploadFilled,
  Camera,
  Document
} from "@element-plus/icons-vue";
import type { UploadFile, UploadFiles } from "element-plus";
import { prepareUpload, confirmUpload } from "@/api/attachment";

// 定义组件类型
type UploadType = "avatar" | "drag" | "card" | "button";

// 定义文件接口
interface FileItem {
  id?: string;
  name: string;
  url?: string;
  size?: number;
  uploading?: boolean;
  progress?: number;
  raw?: File;
}

// Props 定义
const props = withDefaults(
  defineProps<{
    /** 双向绑定的值 - 单文件时为文件ID字符串，多文件时为文件ID数组 */
    modelValue?: string | string[];
    /** 上传组件类型 */
    type?: UploadType;
    /** 文件数量限制 */
    limit?: number;
    /** 占位符文本 */
    placeholder?: string;
    /** 提示文本 */
    tip?: string;
    /** 回显URL - 仅在limit=1时生效 */
    url?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 接受的文件类型 */
    accept?: string;
    /** 文件大小限制(MB) */
    maxSize?: number;
    /** 是否自动上传 */
    autoUpload?: boolean;
  }>(),
  {
    type: "drag",
    limit: 10,
    maxSize: 10,
    autoUpload: true
  }
);

// Emits 定义
const emit = defineEmits<{
  "update:modelValue": [value: string | string[]];
  "upload-success": [files: FileItem[]];
  "upload-error": [error: Error];
}>();

// Refs
const uploadRef = ref();
const fileList = ref<UploadFile[]>([]);
const uploadedFiles = ref<FileItem[]>([]);
const selectedFile = ref<FileItem | null>(null);
const pendingFiles = ref<FileItem[]>([]); // 待上传文件列表（用于非自动上传模式）

// 计算属性
const tipText = computed(() => {
  if (props.tip) return props.tip;
  const sizeText = `文件大小不超过${props.maxSize}MB`;
  const limitText =
    props.limit === 1 ? "只能上传1个文件" : `最多上传${props.limit}个文件`;
  const uploadModeText = props.autoUpload ? "" : "，文件将在组件销毁时自动上传";
  return `${limitText}，${sizeText}${uploadModeText}`;
});

const showUploadButton = computed(() => {
  if (props.disabled) return false;
  if (props.limit === 1) {
    return !selectedFile.value && uploadedFiles.value.length === 0;
  }
  return uploadedFiles.value.length < props.limit;
});

const uploadButtonText = computed(() => {
  return props.placeholder || (props.limit === 1 ? "上传文件" : "添加文件");
});

// 显示的URL（优先使用回显URL）
const displayUrl = computed(() => {
  if (props.type === "avatar" && props.limit === 1) {
    // 优先级：uploadedFiles[0].url > selectedFile.url > props.url
    // 已上传成功的 > 未上传的 > props的
    return uploadedFiles.value[0]?.url || selectedFile.value?.url || props.url;
  }
  return null;
});

// 文件类型判断
const isImage = (filename: string) => {
  const imageExts = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];
  const ext = filename.toLowerCase().substring(filename.lastIndexOf("."));
  return imageExts.includes(ext);
};

// 上传前验证
const beforeUpload = (file: File) => {
  // 文件大小检查
  const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize;
  if (!isLtMaxSize) {
    ElMessage.error(`文件大小不能超过 ${props.maxSize}MB!`);
    return false;
  }
  return true;
};

// 文件选择变化
const handleFileChange = async (file: UploadFile, files: UploadFiles) => {
  if (!beforeUpload(file.raw!)) {
    return;
  }

  if (props.autoUpload) {
    // 自动上传模式：立即上传
    await uploadFile(file);
  } else {
    // 非自动上传模式：添加到待上传列表
    const fileItem: FileItem = {
      name: file.name,
      size: file.raw.size,
      uploading: false,
      progress: 0,
      raw: file.raw
    };

    // 为图片文件创建预览URL
    if (file.raw && isImage(file.name)) {
      fileItem.url = URL.createObjectURL(file.raw);
    }

    if (props.limit === 1) {
      selectedFile.value = fileItem;
      pendingFiles.value = [fileItem];
      // 对于头像模式，也需要更新uploadedFiles用于显示
      if (props.type === "avatar") {
        uploadedFiles.value = [fileItem];
      }
    } else {
      uploadedFiles.value.push(fileItem);
      pendingFiles.value.push(fileItem);
    }
  }
};

// 上传文件
const uploadFile = async (file: UploadFile) => {
  if (!file.raw) return;

  const fileItem: FileItem = {
    name: file.name,
    size: file.raw.size,
    uploading: true,
    progress: 0,
    raw: file.raw
  };

  // 更新UI状态
  if (props.limit === 1) {
    selectedFile.value = fileItem;
  } else {
    uploadedFiles.value.push(fileItem);
  }

  try {
    // 1. 准备上传
    const prepareData = {
      filename: file.name,
      contentType: file.raw.type || "application/octet-stream",
      size: file.raw.size
    };

    const prepareResult = await prepareUpload(prepareData);
    if (!prepareResult.success) {
      throw new Error(prepareResult.message || "准备上传失败");
    }

    // 2. 上传到存储服务
    const uploadUrl = prepareResult.data.uploadUrl;
    await uploadToStorage(file.raw, uploadUrl, progress => {
      fileItem.progress = progress;
    });

    // 3. 确认上传
    const confirmData = {
      uploadSessionId: prepareResult.data.uploadSessionId
    };

    const confirmResult = await confirmUpload(confirmData);
    if (!confirmResult.success) {
      throw new Error(confirmResult.message || "确认上传失败");
    }

    // 更新文件信息
    fileItem.id = confirmResult.data.id;
    fileItem.url = confirmResult.data.url;
    fileItem.uploading = false;
    fileItem.progress = 100;

    // 更新modelValue
    updateModelValue();

    ElMessage.success("文件上传成功");
    emit("upload-success", [fileItem]);
  } catch (error) {
    console.error("文件上传失败:", error);
    ElMessage.error(`文件上传失败: ${error.message}`);

    // 移除失败的文件
    if (props.limit === 1) {
      selectedFile.value = null;
    } else {
      const index = uploadedFiles.value.indexOf(fileItem);
      if (index > -1) {
        uploadedFiles.value.splice(index, 1);
      }
    }

    emit("upload-error", error);
  }
};

// 批量上传待上传文件（用于非自动上传模式）
const uploadPendingFiles = async () => {
  if (pendingFiles.value.length === 0) {
    return;
  }

  console.log(`开始上传 ${pendingFiles.value.length} 个待上传文件`);

  const filesToUpload = [...pendingFiles.value];
  const successFiles: FileItem[] = [];

  for (const fileItem of filesToUpload) {
    if (!fileItem.raw) continue;

    try {
      // 更新上传状态
      fileItem.uploading = true;
      fileItem.progress = 0;

      // 1. 准备上传
      const prepareData = {
        filename: fileItem.name,
        contentType: fileItem.raw.type || "application/octet-stream",
        size: fileItem.raw.size
      };

      const prepareResult = await prepareUpload(prepareData);
      if (!prepareResult.success) {
        throw new Error(prepareResult.message || "准备上传失败");
      }

      // 2. 上传到存储服务
      const uploadUrl = prepareResult.data.uploadUrl;
      await uploadToStorage(fileItem.raw, uploadUrl, progress => {
        fileItem.progress = progress;
      });

      // 3. 确认上传
      const confirmData = {
        uploadSessionId: prepareResult.data.uploadSessionId
      };

      const confirmResult = await confirmUpload(confirmData);
      if (!confirmResult.success) {
        throw new Error(confirmResult.message || "确认上传失败");
      }

      // 更新文件信息
      fileItem.id = confirmResult.data.id;
      fileItem.url = confirmResult.data.url;
      fileItem.uploading = false;
      fileItem.progress = 100;

      successFiles.push(fileItem);

      console.log(`文件 ${fileItem.name} 上传成功`);
    } catch (error) {
      console.error(`文件 ${fileItem.name} 上传失败:`, error);
      fileItem.uploading = false;
      fileItem.progress = 0;
      emit("upload-error", error);
    }
  }

  // 清空待上传列表
  pendingFiles.value = [];

  // 更新modelValue
  updateModelValue();

  if (successFiles.length > 0) {
    console.log(`批量上传完成，成功上传 ${successFiles.length} 个文件`);
    emit("upload-success", successFiles);
  }
};

// 上传到存储服务
const uploadToStorage = (
  file: File,
  uploadUrl: string,
  onProgress: (progress: number) => void
) => {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", event => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`上传失败: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("网络错误，上传失败"));
    });

    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream"
    );
    xhr.send(file);
  });
};

// 更新modelValue
const updateModelValue = () => {
  // 只有在自动上传模式下，或者文件已经上传完成时才更新modelValue
  if (props.limit === 1) {
    const fileId = selectedFile.value?.id || uploadedFiles.value[0]?.id || "";
    emit("update:modelValue", fileId);
  } else {
    const fileIds = uploadedFiles.value
      .map(f => f.id)
      .filter(Boolean) as string[];
    emit("update:modelValue", fileIds);
  }
};

// 移除文件
const handleRemove = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files;
};

// 移除已上传文件
const removeUploadedFile = (index: number) => {
  const file = uploadedFiles.value[index];
  // 清理对象URL
  if (file?.url && file.url.startsWith("blob:")) {
    URL.revokeObjectURL(file.url);
  }
  uploadedFiles.value.splice(index, 1);
  updateModelValue();
};

// 清除选中文件
const clearSelectedFile = () => {
  // 清理对象URL
  if (selectedFile.value?.url && selectedFile.value.url.startsWith("blob:")) {
    URL.revokeObjectURL(selectedFile.value.url);
  }
  selectedFile.value = null;
  // 对于头像模式，也需要清空uploadedFiles
  if (props.type === "avatar") {
    uploadedFiles.value = [];
  }
  updateModelValue();
};

// 超出文件数量限制
const handleExceed = () => {
  ElMessage.warning(`最多只能上传 ${props.limit} 个文件`);
};

// 触发上传（用于卡片模式）
const triggerUpload = () => {
  // 创建一个隐藏的文件输入元素
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = props.limit !== 1;
  if (props.accept) {
    fileInput.accept = props.accept;
  }
  fileInput.style.display = "none";

  fileInput.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      // 检查文件数量限制
      if (target.files.length + uploadedFiles.value.length > props.limit) {
        ElMessage.warning(`最多只能上传 ${props.limit} 个文件`);
        return;
      }

      for (let i = 0; i < target.files.length; i++) {
        const file = target.files[i];
        // 为 File 对象添加 uid 属性
        (file as any).uid = Date.now() + i;
        const uploadFile: UploadFile = {
          name: file.name,
          size: file.size,
          raw: file as any,
          uid: Date.now() + i,
          status: "ready"
        };
        handleFileChange(uploadFile, [uploadFile]);
      }
    }
  };

  fileInput.click();
};

// 预览文件
const previewFile = (file: FileItem) => {
  if (file.url) {
    window.open(file.url, "_blank");
  }
};

// 监听modelValue变化进行回显
watch(
  () => props.modelValue,
  newValue => {
    // 这里可以根据需要实现从文件ID获取文件信息的逻辑
    // 通常需要调用API获取文件详情
  },
  { immediate: true }
);

// 组件销毁前上传待上传的文件
onBeforeUnmount(async () => {
  // 清理创建的对象URL
  [...uploadedFiles.value, ...pendingFiles.value, selectedFile.value].forEach(
    file => {
      if (file?.url && file.url.startsWith("blob:")) {
        URL.revokeObjectURL(file.url);
      }
    }
  );

  if (!props.autoUpload && pendingFiles.value.length > 0) {
    console.log("组件即将销毁，开始上传待上传文件");
    await uploadPendingFiles();
  }
});

// 暴露方法
defineExpose({
  clearFiles: () => {
    uploadedFiles.value = [];
    selectedFile.value = null;
    fileList.value = [];
    pendingFiles.value = [];
    updateModelValue();
  },
  uploadPendingFiles: () => uploadPendingFiles()
});
</script>

<style lang="scss" scoped>
.upload-form-item {
  min-width: 300px;
  width: 100%;

  &.upload-single {
    .file-list {
      display: none;
    }
  }
}

// 头像上传样式
.avatar-upload {
  display: inline-block;

  .avatar-wrapper {
    position: relative;
    width: 100px;
    height: 100px;
    border: 2px dashed var(--el-border-color);
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--el-color-primary);

      .avatar-overlay {
        opacity: 1;
      }
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: var(--el-text-color-placeholder);

      .avatar-icon {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .avatar-text {
        font-size: 12px;
      }
    }

    .avatar-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;

      .overlay-icon {
        color: white;
        font-size: 20px;
      }
    }
  }
}

// 拖拽上传样式
.drag-upload {
  :deep(.el-upload-dragger) {
    width: 100%;
    min-width: 320px;
    height: 180px;
    border: 2px dashed var(--el-border-color);
    border-radius: 6px;
    text-align: center;
    transition: border-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    box-sizing: border-box;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  .upload-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    max-width: 280px;
  }

  :deep(.el-icon--upload) {
    margin: 0 0 16px 0;
    font-size: 48px;
    color: var(--el-text-color-placeholder);
  }

  :deep(.el-upload__text) {
    margin: 0 0 8px 0;
    font-size: 14px;
    line-height: 1.4;
    color: var(--el-text-color-regular);
    word-break: keep-all;
    white-space: nowrap;
    text-align: center;

    // 如果文本太长，允许换行
    @media (max-width: 400px) {
      white-space: normal;
      word-break: break-all;
    }
  }

  :deep(.el-upload__tip) {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
    text-align: center;
  }
}

// 卡片上传样式
.card-upload {
  .upload-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .upload-card {
    position: relative;
    width: 120px;
    height: 120px;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    overflow: hidden;

    &.file-card {
      .file-preview {
        height: 80px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-light);

        .preview-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .file-icon {
          color: var(--el-text-color-placeholder);
        }
      }

      .file-info {
        padding: 4px 8px;
        height: 40px;
        background: white;

        .file-name {
          font-size: 12px;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-actions {
          display: flex;
          gap: 4px;
          margin-top: 2px;
        }
      }

      .upload-progress {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0 8px 4px;
      }
    }

    &.upload-trigger {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 2px dashed var(--el-border-color);
      color: var(--el-text-color-placeholder);
      transition: all 0.3s;

      &:hover {
        border-color: var(--el-color-primary);
        color: var(--el-color-primary);
      }

      .upload-icon {
        font-size: 32px;
        margin-bottom: 8px;
      }

      .upload-text {
        font-size: 12px;
      }
    }
  }
}

// 按钮上传样式
.button-upload {
  .single-file-info {
    margin-top: 12px;

    .file-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-radius: 4px;

      .file-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .upload-progress {
      margin-top: 8px;
    }
  }
}
</style>
