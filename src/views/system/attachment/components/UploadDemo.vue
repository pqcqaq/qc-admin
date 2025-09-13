<template>
  <div class="upload-demo-page">
    <el-card class="demo-card">
      <template #header>
        <div class="card-header">
          <span>UploadFormItem 组件示例</span>
        </div>
      </template>

      <!-- 头像上传示例 -->
      <div class="demo-section">
        <h3>头像上传 (type="avatar", limit=1)</h3>
        <UploadFormItem
          v-model="avatarFile"
          type="avatar"
          :limit="1"
          :url="avatarUrl"
          placeholder="上传头像"
          @upload-success="handleAvatarSuccess"
        />
        <p class="result-text">选中的文件ID: {{ avatarFile || "无" }}</p>
      </div>

      <!-- 拖拽上传示例 -->
      <div class="demo-section">
        <h3>拖拽上传 (type="drag", limit=5)</h3>
        <UploadFormItem
          v-model="dragFiles"
          type="drag"
          :limit="5"
          placeholder="将文件拖到此处，或点击上传"
          tip="支持多文件上传，最多5个文件"
          @upload-success="handleDragSuccess"
        />
        <p class="result-text">
          选中的文件IDs:
          {{
            Array.isArray(dragFiles) ? dragFiles.join(", ") : dragFiles || "无"
          }}
        </p>
      </div>

      <!-- 卡片上传示例 -->
      <div class="demo-section">
        <h3>卡片上传 (type="card", limit=3)</h3>
        <UploadFormItem
          v-model="cardFiles"
          type="card"
          :limit="3"
          placeholder="添加文件"
          @upload-success="handleCardSuccess"
        />
        <p class="result-text">
          选中的文件IDs:
          {{
            Array.isArray(cardFiles) ? cardFiles.join(", ") : cardFiles || "无"
          }}
        </p>
      </div>

      <!-- 按钮上传示例 -->
      <div class="demo-section">
        <h3>按钮上传 (type="button", limit=1)</h3>
        <UploadFormItem
          v-model="buttonFile"
          type="button"
          :limit="1"
          placeholder="选择文件"
          @upload-success="handleButtonSuccess"
        />
        <p class="result-text">选中的文件ID: {{ buttonFile || "无" }}</p>
      </div>

      <!-- 批量操作 -->
      <div class="demo-section">
        <h3>批量操作</h3>
        <el-space>
          <el-button @click="clearAllFiles">清空所有文件</el-button>
          <el-button @click="showAllResults">显示所有结果</el-button>
          <el-button type="primary" @click="openUploadDialog"
            >打开上传对话框</el-button
          >
        </el-space>
      </div>
    </el-card>

    <!-- 上传对话框 -->
    <UploadDialog
      v-model:visible="dialogVisible"
      @success="handleDialogSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import UploadFormItem from "../../../../components/Upload/UploadFormItem.vue";
import UploadDialog from "./UploadDialog.vue";

// 响应式数据
const avatarFile = ref<string>("");
const dragFiles = ref<string[]>([]);
const cardFiles = ref<string[]>([]);
const buttonFile = ref<string>("");
const dialogVisible = ref(false);

// 头像回显URL示例
const avatarUrl = ref(
  "https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png"
);

// 事件处理
const handleAvatarSuccess = (files: any[]) => {
  ElMessage.success(`头像上传成功: ${files[0]?.name}`);
};

const handleDragSuccess = (files: any[]) => {
  ElMessage.success(`拖拽上传成功: ${files.length} 个文件`);
};

const handleCardSuccess = (files: any[]) => {
  ElMessage.success(`卡片上传成功: ${files.length} 个文件`);
};

const handleButtonSuccess = (files: any[]) => {
  ElMessage.success(`按钮上传成功: ${files[0]?.name}`);
};

const handleDialogSuccess = (files: string | string[]) => {
  ElMessage.success("对话框上传成功");
  console.log("上传的文件:", files);
};

// 批量操作
const clearAllFiles = () => {
  avatarFile.value = "";
  dragFiles.value = [];
  cardFiles.value = [];
  buttonFile.value = "";
  ElMessage.info("已清空所有文件");
};

const showAllResults = () => {
  const results = {
    avatar: avatarFile.value,
    drag: dragFiles.value,
    card: cardFiles.value,
    button: buttonFile.value
  };
  console.log("所有上传结果:", results);
  ElMessage.info("查看控制台获取详细结果");
};

const openUploadDialog = () => {
  dialogVisible.value = true;
};
</script>

<style lang="scss" scoped>
.upload-demo-page {
  padding: 20px;

  .demo-card {
    max-width: 800px;
    margin: 0 auto;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .demo-section {
    margin-bottom: 40px;
    padding: 20px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-extra-light);

    h3 {
      margin: 0 0 16px 0;
      color: var(--el-text-color-primary);
      font-size: 16px;
      font-weight: 600;
    }

    .result-text {
      margin-top: 12px;
      padding: 8px 12px;
      background: var(--el-fill-color-light);
      border-radius: 4px;
      font-size: 12px;
      color: var(--el-text-color-secondary);
      word-break: break-all;
    }
  }
}
</style>
