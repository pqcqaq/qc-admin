<template>
  <div class="search-form">
    <el-form :inline="true" :model="searchForm" class="demo-form-inline">
      <el-form-item label="日志级别" prop="level">
        <el-select
          v-model="searchForm.level"
          placeholder="请选择日志级别"
          clearable
        >
          <el-option label="DEBUG" value="debug" />
          <el-option label="INFO" value="info" />
          <el-option label="WARN" value="warn" />
          <el-option label="ERROR" value="error" />
          <el-option label="FATAL" value="fatal" />
        </el-select>
      </el-form-item>
      <el-form-item label="日志类型" prop="type">
        <el-select
          v-model="searchForm.type"
          placeholder="请选择日志类型"
          clearable
        >
          <el-option label="错误" value="Error" />
          <el-option label="崩溃" value="Panic" />
          <el-option label="手动" value="manul" />
        </el-select>
      </el-form-item>
      <el-form-item label="消息内容" prop="message">
        <el-input v-model="searchForm.message" placeholder="请输入消息内容" />
      </el-form-item>
      <el-form-item label="请求方法" prop="method">
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
        </el-select>
      </el-form-item>
      <el-form-item label="请求路径" prop="path">
        <el-input v-model="searchForm.path" placeholder="请输入请求路径" />
      </el-form-item>
      <el-form-item label="IP地址" prop="ip">
        <el-input v-model="searchForm.ip" placeholder="请输入IP地址" />
      </el-form-item>
      <el-form-item label="状态码" prop="code">
        <el-input-number
          v-model="searchForm.code"
          placeholder="请输入状态码"
          :min="100"
          :max="599"
          controls-position="right"
          style="width: 120px"
        />
      </el-form-item>
      <el-form-item label="开始时间" prop="beginTime">
        <el-date-picker
          v-model="searchForm.beginTime"
          type="datetime"
          placeholder="选择开始时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 180px"
        />
      </el-form-item>
      <el-form-item label="结束时间" prop="endTime">
        <el-date-picker
          v-model="searchForm.endTime"
          type="datetime"
          placeholder="选择结束时间"
          format="YYYY-MM-DD HH:mm:ss"
          value-format="YYYY-MM-DD HH:mm:ss"
          style="width: 180px"
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
  level: "debug" | "info" | "error" | "warn" | "fatal" | "";
  type: "Error" | "Panic" | "manul" | "";
  message: string;
  method: string;
  path: string;
  ip: string;
  code?: number;
  beginTime: string;
  endTime: string;
}

// 定义 emits
const emit = defineEmits<{
  search: [params: SearchFormData];
  reset: [];
}>();

// 搜索表单
const searchForm = reactive<SearchFormData>({
  level: "",
  type: "",
  message: "",
  method: "",
  path: "",
  ip: "",
  code: undefined,
  beginTime: "",
  endTime: ""
});

// 搜索
const handleSearch = () => {
  emit("search", { ...searchForm });
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    level: "",
    type: "",
    message: "",
    method: "",
    path: "",
    ip: "",
    code: undefined,
    beginTime: "",
    endTime: ""
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

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-input) {
    width: 160px;
  }

  :deep(.el-select) {
    width: 160px;
  }
}
</style>
