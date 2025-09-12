<template>
  <pure-table
    ref="tableRef"
    :data="dataList"
    :columns="columns"
    :pagination="pagination"
    :paginationSmall="true"
    :loading="loading"
    :header-cell-style="{
      background: 'var(--el-table-row-hover-bg-color)',
      color: 'var(--el-text-color-primary)'
    }"
    @page-size-change="handleSizeChange"
    @page-current-change="handleCurrentChange"
  >
    <template #operation="{ row }">
      <!-- <el-button
        class="reset-margin"
        link
        type="primary"
        size="small"
        @click="handlePreview(row)"
      >
        预览
      </el-button> -->
      <el-button
        class="reset-margin"
        link
        type="primary"
        size="small"
        @click="handleDownload(row)"
      >
        下载
      </el-button>
      <el-button
        class="reset-margin"
        link
        type="primary"
        size="small"
        @click="handleEdit(row)"
      >
        编辑
      </el-button>
      <el-button
        class="reset-margin"
        link
        type="primary"
        size="small"
        @click="handleView(row)"
      >
        查看
      </el-button>
      <el-popconfirm
        :title="`是否确认删除文件${row.originalFilename}?`"
        @confirm="handleDelete(row)"
      >
        <template #reference>
          <el-button class="reset-margin" link type="danger" size="small">
            删除
          </el-button>
        </template>
      </el-popconfirm>
    </template>
  </pure-table>
</template>

<script setup lang="tsx">
import { ref } from "vue";
import { ElTag, ElImage } from "element-plus";
import { PureTable } from "@pureadmin/table";
import type { Attachment } from "@/api/attachment";

interface PaginationData {
  total: number;
  pageSize: number;
  currentPage: number;
  background: boolean;
}

// 定义 props
const props = defineProps<{
  dataList: Attachment[];
  pagination: PaginationData;
  loading: boolean;
}>();

// 定义 emits
const emit = defineEmits<{
  edit: [attachment: Attachment];
  view: [attachment: Attachment];
  delete: [attachment: Attachment];
  preview: [attachment: Attachment];
  download: [attachment: Attachment];
  "page-size-change": [size: number];
  "page-current-change": [page: number];
}>();

const tableRef = ref();

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
  if (contentType.startsWith("image/"))
    return { type: "success", text: "图片" };
  if (contentType.startsWith("video/"))
    return { type: "warning", text: "视频" };
  if (contentType.startsWith("audio/")) return { type: "info", text: "音频" };
  if (
    contentType.includes("pdf") ||
    contentType.includes("word") ||
    contentType.includes("excel") ||
    contentType.includes("powerpoint")
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

// 表格列配置
const columns: TableColumnList = [
  {
    label: "序号",
    type: "index",
    width: 70,
    hide: false
  },
  {
    label: "预览",
    prop: "preview",
    minWidth: 80,
    cellRenderer: ({ row }) => {
      if (row.contentType.startsWith("image/") && row.url) {
        return (
          <ElImage
            style="width: 40px; height: 40px"
            src={row.url}
            fit="cover"
            preview-src-list={[row.url]}
            preview-teleported={true}
          />
        );
      }
      return <span>--</span>;
    }
  },
  {
    label: "文件名",
    prop: "filename",
    minWidth: 200,
    showOverflowTooltip: true
  },
  {
    label: "文件大小",
    prop: "size",
    minWidth: 100,
    cellRenderer: ({ row }) => formatFileSize(row.size)
  },
  {
    label: "文件类型",
    prop: "contentType",
    minWidth: 120,
    cellRenderer: ({ row }) => {
      const tag = getFileTypeTag(row.contentType);
      return (
        <ElTag type={tag.type as any} size="small">
          {tag.text}
        </ElTag>
      );
    }
  },
  {
    label: "存储类型",
    prop: "storageProvider",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      const tag = getStorageProviderTag(row.storageProvider);
      return (
        <ElTag type={tag.type as any} size="small">
          {tag.text}
        </ElTag>
      );
    }
  },
  {
    label: "标签",
    prop: "tags",
    minWidth: 150,
    cellRenderer: ({ row }) => {
      if (!row.tags || row.tags.length === 0) {
        return <span style="color: #999;">无标签</span>;
      }
      return (
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          {row.tags.slice(0, 3).map((tag: string) => (
            <ElTag key={tag} size="small" type="info">
              {tag}
            </ElTag>
          ))}
          {row.tags.length > 3 && (
            <ElTag size="small" type="info">
              +{row.tags.length - 3}
            </ElTag>
          )}
        </div>
      );
    }
  },
  {
    label: "状态",
    prop: "status",
    minWidth: 100,
    cellRenderer: ({ row }) => {
      const statusMap = {
        active: { type: "success", text: "正常" },
        deleted: { type: "danger", text: "已删除" },
        processing: { type: "warning", text: "处理中" }
      };
      const status = statusMap[row.status as keyof typeof statusMap] || {
        type: "",
        text: row.status
      };
      return (
        <ElTag type={status.type as any} size="small">
          {status.text}
        </ElTag>
      );
    }
  },
  {
    label: "创建时间",
    prop: "createTime",
    minWidth: 180
  },
  {
    label: "操作",
    fixed: "right",
    width: 240,
    slot: "operation"
  }
];

// 事件处理
const handleEdit = (row: Attachment) => {
  emit("edit", row);
};

const handleView = (row: Attachment) => {
  emit("view", row);
};

const handleDelete = (row: Attachment) => {
  emit("delete", row);
};

const handleDownload = (row: Attachment) => {
  emit("download", row);
};

const handleSizeChange = (val: number) => {
  emit("page-size-change", val);
};

const handleCurrentChange = (val: number) => {
  emit("page-current-change", val);
};
</script>

<style lang="scss" scoped>
.reset-margin {
  margin: 0;
}
</style>
