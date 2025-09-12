<template>
  <div class="main">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span class="font-medium">菜单管理</span>
          <div class="buttons">
            <el-button type="primary" :icon="Plus" @click="openDialog()">
              新增菜单
            </el-button>
            <el-button type="success" :icon="Refresh" @click="getTableData">
              刷新
            </el-button>
          </div>
        </div>
      </template>

      <!-- 搜索表单组件 -->
      <SearchForm @search="handleSearch" @reset="handleReset" />

      <!-- 菜单表格组件 -->
      <MenuTable
        :data-list="dataList"
        :loading="loading"
        @edit="openDialog('edit', $event)"
        @view="handleView"
        @delete="handleDelete"
        @add-child="openDialog('add', undefined, $event)"
      />
    </el-card>

    <!-- 新增/编辑对话框组件 -->
    <MenuDialog
      v-model:visible="dialogVisible"
      :type="dialogType"
      :menu-data="currentMenu"
      :parent-menu="parentMenu"
      :loading="submitLoading"
      @submit="handleSubmit"
    />

    <!-- 查看对话框组件 -->
    <MenuViewDialog v-model:visible="viewDialogVisible" :menu-data="viewData" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { Plus, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getScopeTree,
  createScope,
  updateScope,
  deleteScope,
  type Scope
} from "@/api/rbac";
import {
  SearchForm,
  MenuTable,
  MenuDialog,
  MenuViewDialog
} from "./components";

defineOptions({
  name: "SystemMenu"
});

const loading = ref(false);
const submitLoading = ref(false);
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogType = ref<"add" | "edit">("add");
const currentMenu = ref<Scope>();
const parentMenu = ref<Scope>();

// 搜索表单数据
const searchParams = reactive({
  name: "",
  type: "",
  hidden: null as boolean | null,
  disabled: null as boolean | null
});

// 查看数据
const viewData = ref<Scope>({} as Scope);

// 表格数据
const dataList = ref<Scope[]>([]);

// 获取菜单树数据
const getTableData = async () => {
  loading.value = true;
  try {
    const response = await getScopeTree();
    dataList.value = response.data || [];

    // 如果有搜索条件，则进行过滤
    if (hasSearchParams()) {
      dataList.value = filterTreeData(dataList.value, searchParams);
    }
  } catch (error) {
    console.error("获取菜单列表失败:", error);
    ElMessage.error("获取菜单列表失败");
  } finally {
    loading.value = false;
  }
};

// 检查是否有搜索参数
const hasSearchParams = () => {
  return (
    searchParams.name ||
    searchParams.type ||
    searchParams.hidden !== null ||
    searchParams.disabled !== null
  );
};

// 过滤树数据
const filterTreeData = (data: Scope[], params: any): Scope[] => {
  return data.filter(item => {
    let match = true;

    if (params.name && !item.name.includes(params.name)) {
      match = false;
    }
    if (params.type && item.type !== params.type) {
      match = false;
    }
    if (params.hidden !== null && item.hidden !== params.hidden) {
      match = false;
    }
    if (params.disabled !== null && item.disabled !== params.disabled) {
      match = false;
    }

    // 递归过滤子节点
    if (item.children && item.children.length > 0) {
      item.children = filterTreeData(item.children, params);
      // 如果子节点有匹配的，父节点也要保留
      if (item.children.length > 0) {
        match = true;
      }
    }

    return match;
  });
};

// 搜索处理
const handleSearch = (params: typeof searchParams) => {
  Object.assign(searchParams, params);
  getTableData();
};

// 重置搜索
const handleReset = () => {
  Object.assign(searchParams, {
    name: "",
    type: "",
    hidden: null,
    disabled: null
  });
  getTableData();
};

// 打开对话框
const openDialog = (
  type: "add" | "edit" = "add",
  row?: Scope,
  parent?: Scope
) => {
  dialogType.value = type;
  currentMenu.value = row;
  parentMenu.value = parent;
  dialogVisible.value = true;
};

// 提交表单
const handleSubmit = async (formData: any) => {
  submitLoading.value = true;
  try {
    if (dialogType.value === "add") {
      await createScope(formData);
      ElMessage.success("创建菜单成功");
    } else {
      await updateScope(formData.id, formData);
      ElMessage.success("更新菜单成功");
    }
    dialogVisible.value = false;
    getTableData();
  } catch (error) {
    console.error("保存菜单失败:", error);
    ElMessage.error("保存菜单失败");
  } finally {
    submitLoading.value = false;
  }
};

// 查看菜单
const handleView = (row: Scope) => {
  viewData.value = { ...row };
  viewDialogVisible.value = true;
};

// 删除菜单
const handleDelete = async (row: Scope) => {
  try {
    loading.value = true;
    await deleteScope(row.id);
    ElMessage.success("删除菜单成功");
    await getTableData();
  } catch (error) {
    console.error("删除菜单失败:", error);
    ElMessage.error("删除菜单失败");
    loading.value = false;
  }
};

onMounted(() => {
  getTableData();
});
</script>

<style lang="scss" scoped>
.main {
  margin: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
