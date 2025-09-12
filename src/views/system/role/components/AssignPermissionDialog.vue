<template>
  <el-dialog
    v-model="dialogVisible"
    title="分配权限"
    :width="700"
    draggable
    :before-close="handleClose"
  >
    <div class="mb-4">
      <span class="font-medium">角色：</span>
      <el-tag type="primary">{{ roleData?.name }}</el-tag>
    </div>

    <el-form ref="formRef">
      <el-form-item label="选择权限：">
        <div class="permission-tree-container">
          <el-input
            v-model="searchText"
            placeholder="搜索权限"
            clearable
            class="mb-3"
            :prefix-icon="Search"
          />
          <el-tree
            ref="treeRef"
            :data="permissionTreeData"
            :props="treeProps"
            show-checkbox
            node-key="id"
            :default-checked-keys="selectedPermissions"
            :filter-node-method="filterNode"
            class="permission-tree"
          >
            <template #default="{ data }">
              <span class="tree-node">
                <span>{{ data.name }}</span>
                <el-tag
                  v-if="data.action"
                  size="small"
                  type="info"
                  class="ml-2"
                >
                  {{ data.action }}
                </el-tag>
              </span>
            </template>
          </el-tree>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from "vue";
import { Search } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import {
  getAllPermissions,
  getAllScopes,
  type Role,
  type Permission,
  type Scope
} from "@/api/rbac";

interface Props {
  visible: boolean;
  roleData?: Role;
  loading: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  loading: false
});

const emit = defineEmits<{
  "update:visible": [visible: boolean];
  submit: [permissionIds: string[]];
}>();

const formRef = ref();
const treeRef = ref();
const searchText = ref("");
const allPermissions = ref<Permission[]>([]);
const allScopes = ref<Scope[]>([]);
const selectedPermissions = ref<string[]>([]);

const dialogVisible = computed({
  get() {
    return props.visible;
  },
  set(value) {
    emit("update:visible", value);
  }
});

const treeProps = reactive({
  children: "children",
  label: "name"
});

// 构建权限树数据
const permissionTreeData = computed(() => {
  const scopeMap = new Map<string, any>();

  // 先创建权限域节点
  allScopes.value.forEach(scope => {
    scopeMap.set(scope.id, {
      id: scope.id,
      name: scope.name,
      type: "scope",
      children: []
    });
  });

  // 添加权限节点
  allPermissions.value.forEach(permission => {
    const permissionNode = {
      id: permission.id,
      name: permission.name,
      action: permission.action,
      type: "permission"
    };

    if (permission.scope && scopeMap.has(permission.scope.id)) {
      scopeMap.get(permission.scope.id).children.push(permissionNode);
    } else {
      // 如果没有权限域，放到根节点
      scopeMap.set(`no-scope-${permission.id}`, permissionNode);
    }
  });

  return Array.from(scopeMap.values()).filter(node =>
    node.type === "scope" ? node.children.length > 0 : true
  );
});

// 获取权限列表
const getPermissions = async () => {
  try {
    const response = await getAllPermissions();
    allPermissions.value = response.data || [];
  } catch (error) {
    console.error("获取权限列表失败:", error);
  }
};

// 获取权限域列表
const getScopes = async () => {
  try {
    const response = await getAllScopes();
    allScopes.value = response.data || [];
  } catch (error) {
    console.error("获取权限域列表失败:", error);
  }
};

// 初始化已选权限
const initSelectedPermissions = () => {
  selectedPermissions.value = props.roleData?.permissions?.map(p => p.id) || [];
  nextTick(() => {
    if (treeRef.value) {
      treeRef.value.setCheckedKeys(selectedPermissions.value);
    }
  });
};

// 过滤节点
const filterNode = (value: string, data: any) => {
  if (!value) return true;
  return data.name.includes(value);
};

// 监听搜索文本
watch(searchText, val => {
  if (treeRef.value) {
    treeRef.value.filter(val);
  }
});

// 监听显示状态
watch(
  () => props.visible,
  val => {
    if (val) {
      getPermissions();
      getScopes();
      initSelectedPermissions();
    }
  }
);

// 提交
const handleSubmit = () => {
  if (!treeRef.value) return;

  const checkedKeys = treeRef.value.getCheckedKeys(false);
  // 只提交权限ID，过滤掉权限域ID
  const permissionIds = checkedKeys.filter((key: string) => {
    return allPermissions.value.some(p => p.id === key);
  });

  emit("submit", permissionIds);
};

// 关闭
const handleClose = () => {
  searchText.value = "";
  emit("update:visible", false);
};

onMounted(() => {
  getPermissions();
  getScopes();
});
</script>

<style lang="scss" scoped>
.permission-tree-container {
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 8px;
}

.permission-tree {
  .tree-node {
    display: flex;
    align-items: center;
    flex: 1;
  }
}
</style>
