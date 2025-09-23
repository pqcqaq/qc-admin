<template>
  <div class="search-form">
    <el-form :inline="true" :model="searchForm" class="demo-form-inline">
      <el-form-item label="设备名称" prop="name">
        <el-input
          v-model="searchForm.name"
          placeholder="请输入设备名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="设备标识" prop="code">
        <el-input
          v-model="searchForm.code"
          placeholder="请输入设备标识码"
          clearable
        />
      </el-form-item>

      <el-form-item label="设备状态" prop="enabled">
        <el-select
          v-model="searchForm.enabled"
          placeholder="请选择设备状态"
          clearable
        >
          <el-option label="启用" :value="true" />
          <el-option label="禁用" :value="false" />
        </el-select>
      </el-form-item>

      <el-form-item label="登录模式" prop="anonymous">
        <el-select
          v-model="searchForm.anonymous"
          placeholder="请选择登录模式"
          clearable
        >
          <el-option label="匿名登录" :value="true" />
          <el-option label="角色限制" :value="false" />
        </el-select>
      </el-form-item>

      <el-form-item label="排序字段" prop="orderBy">
        <el-select
          v-model="searchForm.orderBy"
          placeholder="请选择排序字段"
          clearable
        >
          <el-option label="创建时间" value="create_time" />
          <el-option label="更新时间" value="update_time" />
          <el-option label="设备名称" value="name" />
        </el-select>
      </el-form-item>

      <el-form-item label="排序方式" prop="order">
        <el-select
          v-model="searchForm.order"
          placeholder="请选择排序方式"
          clearable
        >
          <el-option label="升序" value="asc" />
          <el-option label="降序" value="desc" />
        </el-select>
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
        <el-button type="primary" @click="handleSearch">
          <el-icon><Search /></el-icon>
          查询
        </el-button>
        <el-button @click="resetSearch">
          <el-icon><Refresh /></el-icon>
          重置
        </el-button>
        <el-button type="success" @click="handleExport">
          <el-icon><Download /></el-icon>
          导出
        </el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { Search, Refresh, Download } from "@element-plus/icons-vue";
import type {
  ClientDevicePageRequest,
  ClientDeviceOrderByField,
  OrderDirection
} from "@/api/client_devices";

interface SearchFormData
  extends Omit<ClientDevicePageRequest, "page" | "pageSize"> {
  name?: string;
  code?: string;
  enabled?: boolean;
  anonymous?: boolean;
  order?: OrderDirection;
  orderBy?: ClientDeviceOrderByField;
  beginTime?: string;
  endTime?: string;
}

// 定义 emits
const emit = defineEmits<{
  search: [params: SearchFormData];
  reset: [];
  export: [params: SearchFormData];
}>();

// 搜索表单
const searchForm = reactive<SearchFormData>({
  name: "",
  code: "",
  enabled: undefined,
  anonymous: undefined,
  order: undefined,
  orderBy: undefined,
  beginTime: "",
  endTime: ""
});

// 搜索
const handleSearch = () => {
  // 过滤掉空字符串的字段，保留 false 和 0
  const params = Object.entries(searchForm).reduce(
    (acc, [key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>
  );

  emit("search", params);
};

// 重置搜索
const resetSearch = () => {
  Object.assign(searchForm, {
    name: "",
    code: "",
    enabled: undefined,
    anonymous: undefined,
    order: undefined,
    orderBy: undefined,
    beginTime: "",
    endTime: ""
  });
  emit("reset");
};

// 导出数据
const handleExport = () => {
  // 过滤掉空字符串的字段，保留 false 和 0
  const params = Object.entries(searchForm).reduce(
    (acc, [key, value]) => {
      if (value !== "" && value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    },
    {} as Record<string, any>
  );

  emit("export", params);
};

// 暴露方法给父组件
defineExpose({
  resetForm: resetSearch,
  getSearchParams: () => {
    const params = Object.entries(searchForm).reduce(
      (acc, [key, value]) => {
        if (value !== "" && value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, any>
    );
    return params;
  }
});
</script>

<style lang="scss" scoped>
.search-form {
  padding: 20px;
  margin-bottom: 20px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 5%);

  // 响应式设计
  @media (width <= 768px) {
    :deep(.el-form-item) {
      display: block;
      margin-bottom: 16px;
    }

    :deep(.el-input),
    :deep(.el-select) {
      width: 100%;
    }

    :deep(.el-date-picker) {
      width: 100% !important;
    }
  }

  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-input) {
    width: 160px;
  }

  :deep(.el-select) {
    width: 160px;
  }

  :deep(.el-button) {
    margin-left: 8px;

    &:first-child {
      margin-left: 0;
    }
  }
}
</style>
