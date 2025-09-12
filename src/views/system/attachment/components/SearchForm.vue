<template>
  <div class="search-form">
    <el-form :inline="true" :model="searchForm" class="demo-form-inline">
      <el-form-item label="文件名">
        <el-input
          v-model="searchForm.filename"
          placeholder="请输入文件名"
          clearable
        />
      </el-form-item>
      <el-form-item label="文件类型">
        <el-select
          v-model="searchForm.contentType"
          placeholder="请选择文件类型"
          clearable
        >
          <el-option label="图片" value="image" />
          <el-option label="文档" value="document" />
          <el-option label="视频" value="video" />
          <el-option label="音频" value="audio" />
          <el-option label="其他" value="other" />
        </el-select>
      </el-form-item>
      <el-form-item label="存储类型">
        <el-select
          v-model="searchForm.storageProvider"
          placeholder="请选择存储类型"
          clearable
        >
          <el-option label="本地存储" value="local" />
          <el-option label="云存储" value="cloud" />
          <el-option label="OSS" value="oss" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态">
        <el-select
          v-model="searchForm.status"
          placeholder="请选择状态"
          clearable
        >
          <el-option label="正常" value="active" />
          <el-option label="已删除" value="deleted" />
          <el-option label="处理中" value="processing" />
        </el-select>
      </el-form-item>
      <el-form-item label="标签">
        <el-input
          v-model="searchForm.tags"
          placeholder="请输入标签"
          clearable
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleSearch">查询</el-button>
        <el-button @click="resetSearch">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";

interface SearchFormData {
  filename: string;
  contentType: string;
  storageProvider: string;
  status: string;
  tags: string;
}

// 定义 emits
const emit = defineEmits<{
  search: [params: SearchFormData];
  reset: [];
}>();

// 搜索表单
const searchForm = reactive<SearchFormData>({
  filename: "",
  contentType: "",
  storageProvider: "",
  status: "",
  tags: ""
});

// 搜索
const handleSearch = () => {
  emit("search", { ...searchForm });
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    filename: "",
    contentType: "",
    storageProvider: "",
    status: "",
    tags: ""
  });
  emit("reset");
};

// 暴露方法给父组件
defineExpose({
  resetForm: () => {
    Object.assign(searchForm, {
      filename: "",
      contentType: "",
      storageProvider: "",
      status: "",
      tags: ""
    });
  }
});
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
