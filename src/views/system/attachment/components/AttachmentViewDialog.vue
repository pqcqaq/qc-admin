<template>
  <el-dialog
    v-model="visible"
    title="附件详情"
    width="700px"
    draggable
    @close="handleClose"
  >
    <el-descriptions :column="2" border>
      <el-descriptions-item label="附件ID">
        {{ attachmentData.id }}
      </el-descriptions-item>
      <el-descriptions-item label="文件名">
        {{ attachmentData.filename }}
      </el-descriptions-item>
      <el-descriptions-item label="文件名">
        {{ attachmentData.filename }}
      </el-descriptions-item>
      <el-descriptions-item label="文件大小">
        {{ formatFileSize(attachmentData.size || 0) }}
      </el-descriptions-item>
      <el-descriptions-item label="文件类型">
        <el-tag
          :type="getFileTypeTag(attachmentData.contentType).type as any"
          size="small"
        >
          {{ getFileTypeTag(attachmentData.contentType).text }}
        </el-tag>
        <div class="mt-1 text-xs text-gray-500">
          {{ attachmentData.contentType }}
        </div>
      </el-descriptions-item>
      <el-descriptions-item label="存储类型">
        <el-tag
          :type="
            getStorageProviderTag(attachmentData.storageProvider).type as any
          "
          size="small"
        >
          {{ getStorageProviderTag(attachmentData.storageProvider).text }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="状态">
        <el-tag
          :type="getStatusTag(attachmentData.status).type as any"
          size="small"
        >
          {{ getStatusTag(attachmentData.status).text }}
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="标签" :span="2">
        <div
          v-if="attachmentData.tags && attachmentData.tags.length > 0"
          class="tags-container"
        >
          <el-tag
            v-for="tag in attachmentData.tags"
            :key="tag"
            type="info"
            size="small"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
        <span v-else class="no-tags">无标签</span>
      </el-descriptions-item>
      <el-descriptions-item label="存储路径" :span="2">
        <el-input
          :value="attachmentData.path"
          readonly
          type="textarea"
          :rows="2"
        />
      </el-descriptions-item>
      <el-descriptions-item label="创建时间">
        {{ attachmentData.createTime || "未设置" }}
      </el-descriptions-item>
      <el-descriptions-item label="更新时间">
        {{ attachmentData.updateTime || "未设置" }}
      </el-descriptions-item>
      <el-descriptions-item
        v-if="attachmentData.contentType?.startsWith('image/')"
        label="预览"
        :span="2"
      >
        <el-image
          v-if="attachmentData.url"
          :src="attachmentData.url"
          style="max-width: 300px; max-height: 200px"
          fit="contain"
          :preview-src-list="[attachmentData.url]"
          preview-teleported
        />
        <span v-else>暂无预览</span>
      </el-descriptions-item>
    </el-descriptions>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button
          v-if="attachmentData.url"
          type="primary"
          @click="handleDownload"
        >
          下载文件
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElTag, ElImage } from "element-plus";
import type { Attachment } from "qc-admin-api-common/attachment";

// 定义 props
const props = defineProps<{
  visible: boolean;
  attachmentData: Attachment;
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

// 格式化文件大小
const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 获取文件类型标签
const getFileTypeTag = (contentType: string) => {
  if (contentType?.startsWith("image/"))
    return { type: "success", text: "图片" };
  if (contentType?.startsWith("video/"))
    return { type: "warning", text: "视频" };
  if (contentType?.startsWith("audio/")) return { type: "info", text: "音频" };
  if (
    contentType?.includes("pdf") ||
    contentType?.includes("word") ||
    contentType?.includes("excel") ||
    contentType?.includes("powerpoint")
  )
    return { type: "primary", text: "文档" };
  return { type: "", text: "其他" };
};

// 获取存储类型标签
const getStorageProviderTag = (storageProvider: string) => {
  const typeMap = {
    local: { type: "info", text: "本地" },
    s3: { type: "warning", text: "S3" }
  };
  return (
    typeMap[storageProvider as keyof typeof typeMap] || {
      type: "",
      text: storageProvider
    }
  );
};

// 获取状态标签
const getStatusTag = (status: string) => {
  const statusMap = {
    active: { type: "success", text: "正常" },
    deleted: { type: "danger", text: "已删除" },
    processing: { type: "warning", text: "处理中" }
  };
  return (
    statusMap[status as keyof typeof statusMap] || {
      type: "",
      text: status
    }
  );
};

// 下载文件
const handleDownload = () => {
  if (props.attachmentData.url) {
    const link = document.createElement("a");
    link.href = props.attachmentData.url;
    link.download = props.attachmentData.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
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

.mt-1 {
  margin-top: 4px;
}

.text-xs {
  font-size: 12px;
}

.text-gray-500 {
  color: #6b7280;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin: 0;
}

.no-tags {
  font-style: italic;
  color: #999;
}
</style>
