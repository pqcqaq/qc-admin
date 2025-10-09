<template>
  <div class="search-form">
    <el-form :inline="true" :model="searchForm" class="demo-form-inline">
      <el-form-item label="名称">
        <el-input
          v-model="searchForm.name"
          placeholder="请输入名称"
          clearable
        />
      </el-form-item>
      <el-form-item label="请求方法">
        <el-select
          v-model="searchForm.method"
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
      <el-form-item label="请求路径">
        <el-input
          v-model="searchForm.path"
          placeholder="请输入请求路径"
          clearable
        />
      </el-form-item>
      <el-form-item label="是否公开">
        <el-select
          v-model="searchForm.isPublic"
          placeholder="请选择是否公开"
          clearable
        >
          <el-option label="公开" value="true" />
          <el-option label="私有" value="false" />
        </el-select>
      </el-form-item>
      <!-- 是否启用 -->
      <el-form-item label="状态">
        <el-select
          v-model="searchForm.isActive"
          placeholder="请选择状态"
          clearable
        >
          <el-option label="激活" value="true" />
          <el-option label="禁用" value="false" />
        </el-select>
      </el-form-item>
      <!-- 类型 http/websocket -->
      <el-form-item label="类型">
        <el-select v-model="searchForm.type" placeholder="请选择类型" clearable>
          <el-option label="HTTP" value="http" />
          <el-option label="WebSocket" value="websocket" />
        </el-select>
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
  name: string;
  method: string;
  path: string;
  isPublic: string;
  isActive: string;
  type: string;
}

// 定义 emits
const emit = defineEmits<{
  search: [params: SearchFormData];
  reset: [];
}>();

// 搜索表单
const searchForm = reactive<SearchFormData>({
  name: "",
  method: "",
  path: "",
  isPublic: "",
  isActive: "",
  type: "http"
});

// 搜索
const handleSearch = () => {
  emit("search", { ...searchForm });
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: "",
    method: "",
    path: "",
    isPublic: "",
    isActive: ""
  });
  emit("reset");
};

// 暴露方法给父组件
defineExpose({
  resetForm: resetSearch
});
</script>

<style lang="scss" scoped>
.search-form {
  margin-bottom: 20px;
}
</style>
