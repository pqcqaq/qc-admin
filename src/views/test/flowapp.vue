<template>
  <div class="flowapp-container">
    <!-- 应用列表视图 -->
    <div v-if="!currentApplication" class="application-list-view">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <h2>工作流应用</h2>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" @click="handleCreateApplication">
            <el-icon><Plus /></el-icon>
            新建应用
          </el-button>
        </div>
      </div>

      <!-- 应用列表 -->
      <div class="application-list">
        <el-table
          v-loading="loading"
          :data="applications"
          stripe
          style="width: 100%"
        >
          <el-table-column prop="name" label="应用名称" min-width="200" />
          <el-table-column prop="description" label="描述" min-width="300" />
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="更新时间" width="180">
            <template #default="{ row }">
              {{ formatDate(row.updateTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="280" fixed="right">
            <template #default="{ row }">
              <el-button
                type="primary"
                size="small"
                @click="handleEditApplication(row)"
              >
                编辑
              </el-button>
              <el-button
                type="success"
                size="small"
                @click="handleCloneApplication(row)"
              >
                克隆
              </el-button>
              <el-button
                type="danger"
                size="small"
                @click="handleDeleteApplication(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- 图形化编辑视图 -->
    <div
      v-else
      class="flow-editor-view"
      @contextmenu="onContextMenu"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
    >
      <!-- 顶部工具栏 -->
      <div class="editor-toolbar">
        <div class="toolbar-left">
          <el-button @click="handleBackToList">
            <el-icon><ArrowLeft /></el-icon>
            返回列表
          </el-button>
          <span class="app-name">{{ currentApplication.name }}</span>
        </div>
        <div class="toolbar-right">
          <el-button
            type="success"
            :loading="saving"
            @click="handleSaveWorkflow"
          >
            <el-icon><DocumentChecked /></el-icon>
            保存
          </el-button>
        </div>
      </div>

      <!-- Vue Flow 画布 -->
      <VueFlow
        id="workflow-canvas"
        ref="vueFlowRef"
        :nodes="nodes"
        :edges="edges"
        :default-viewport="{ zoom: 1 }"
        :min-zoom="0.2"
        :max-zoom="4"
        :node-types="nodeTypes"
        :class="{ dark: darkMode }"
        class="basic-flow"
        :default-edge-options="defaultEdgeOptions"
        :connect-on-click="true"
        @node-click="onNodeClick"
        @edge-click="onEdgeClick"
        @node-context-menu="onNodeContextMenu"
        @edge-context-menu="onEdgeContextMenu"
        @pane-context-menu="onPaneContextMenu"
        @drop="onDrop"
        @dragover="onDragOver"
        @connect="onConnect"
      >
        <Background pattern-color="#aaa" :gap="16" />
        <MiniMap pannable zoomable position="bottom-left" />
      </VueFlow>

      <!-- 顶部控制按钮 -->
      <Controls class="controls" position="top-left">
        <ControlButton title="重置视图" @click="resetTransform">
          <Refresh />
        </ControlButton>

        <ControlButton title="适应画布" @click="fitView">
          <FullScreen />
        </ControlButton>

        <ControlButton title="切换暗黑模式" @click="changeDarkMode">
          <Moon v-if="!darkMode" />
          <Sunny v-else />
        </ControlButton>

        <ControlButton title="导出数据" @click="logToObject">
          <More />
        </ControlButton>

        <ControlButton title="清空画布" @click="clearCanvas">
          <Delete />
        </ControlButton>
      </Controls>

      <!-- 底部节点面板 -->
      <NodePalette
        :dark-mode="darkMode"
        :dragging-node-id="draggingNodeId"
        @drag-start="onPaletteDragStart"
        @delete-node="handleDeleteNode"
      />

      <!-- 右侧属性面板 -->
      <PropertiesPanel
        :dark-mode="darkMode"
        :selected-node="selectedNode"
        @update-node="handleUpdateNode"
        @delete-node="handleDeleteNode"
      />

      <!-- 右键菜单 -->
      <ContextMenu
        :dark-mode="darkMode"
        :visible="contextMenu.visible"
        :x="contextMenu.x"
        :y="contextMenu.y"
        :menu-type="contextMenu.type"
        :target-node="contextMenu.targetNode"
        :target-edge="contextMenu.targetEdge"
        @close="closeContextMenu"
        @zoom-in="handleZoomIn"
        @zoom-out="handleZoomOut"
        @fit-view="fitView"
        @reset-view="resetTransform"
        @select-all="handleSelectAll"
        @clear-canvas="clearCanvas"
        @edit-node="handleEditNodeFromMenu"
        @copy-node="handleCopyNode"
        @duplicate-node="handleDuplicateNode"
        @delete-node="handleDeleteNodeFromMenu"
        @toggle-connectable="handleToggleConnectable"
        @edit-edge="handleEditEdge"
        @delete-edge="handleDeleteEdgeFromMenu"
        @toggle-animation="handleToggleAnimation"
      />
    </div>

    <!-- 创建/编辑应用对话框 -->
    <el-dialog
      v-model="applicationDialogVisible"
      :title="isEditingApplication ? '编辑应用' : '新建应用'"
      width="600px"
    >
      <el-form
        ref="applicationFormRef"
        :model="applicationForm"
        :rules="applicationFormRules"
        label-width="100px"
      >
        <el-form-item label="应用名称" prop="name">
          <el-input
            v-model="applicationForm.name"
            placeholder="请输入应用名称"
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="applicationForm.description"
            type="textarea"
            :rows="4"
            placeholder="请输入应用描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="applicationDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitApplication">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, shallowRef, computed, watch } from "vue";
import {
  VueFlow,
  MarkerType,
  type DefaultEdgeOptions,
  type Connection,
  type Node,
  type Edge
} from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { ControlButton, Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import {
  Moon,
  Refresh,
  Sunny,
  More,
  Delete,
  FullScreen,
  Plus,
  ArrowLeft,
  DocumentChecked
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";

// 导入组件
import NodePalette from "./components/NodePalette.vue";
import PropertiesPanel from "./components/PropertiesPanel.vue";
import ContextMenu from "./components/ContextMenu.vue";

// 导入类型和配置
import type { NodeTemplate } from "./components/types";
import { useWorkflowApplication } from "./composables/useWorkflowApplication";

// 使用 workflow application composable
const workflowApp = useWorkflowApplication();
const {
  currentApplication,
  applications,
  loading,
  saving,
  loadApplications,
  loadApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  cloneApplication,
  saveWorkflow,
  workflow
} = workflowApp;

// Vue Flow 实例
const vueFlowRef = ref();

// 使用 ref 和 computed 来访问 workflow 的属性
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const nodeTypes = shallowRef<any>({});

// 使用 computed 来保持 selectedNode 的响应式
const selectedNode = computed(() => {
  return workflow?.selectedNode?.value || null;
});

// 状态管理
const darkMode = ref(false);
const isDraggingFromPalette = ref(false);
const draggingNodeId = ref<string | null>(null);
const mouseDownPos = ref<{ x: number; y: number } | null>(null);
const isDragging = ref(false);

// 分页状态
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
});

// 应用对话框状态
const applicationDialogVisible = ref(false);
const isEditingApplication = ref(false);
const applicationFormRef = ref<FormInstance>();
const applicationForm = ref({
  name: "",
  description: ""
});
const applicationFormRules = {
  name: [{ required: true, message: "请输入应用名称", trigger: "blur" }]
};

// 右键菜单状态
const contextMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  type: "canvas" | "node" | "edge";
  targetNode: Node | null;
  targetEdge: Edge | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  type: "canvas",
  targetNode: null,
  targetEdge: null
});

// 默认边配置
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed }
};

/**
 * 工具函数
 */
function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  return date.toLocaleString("zh-CN");
}

/**
 * 应用列表操作
 */
async function handleCreateApplication() {
  isEditingApplication.value = false;
  applicationForm.value = {
    name: "",
    description: ""
  };
  applicationDialogVisible.value = true;
}

async function handleEditApplication(app: any) {
  // 加载应用数据
  await loadApplication(app.id);
}

async function handleCloneApplication(app: any) {
  await cloneApplication(app.id);
  await loadApplications();
}

async function handleDeleteApplication(app: any) {
  await deleteApplication(app.id);
}

async function handleSubmitApplication() {
  if (!applicationFormRef.value) return;

  await applicationFormRef.value.validate(async valid => {
    if (valid) {
      if (isEditingApplication.value) {
        // 更新应用
        await updateApplication(currentApplication.value!.id, {
          ...applicationForm.value,
          startNodeId: currentApplication.value!.startNodeId
        });
      } else {
        // 创建应用 - 后端会自动创建默认开始节点
        const newApp = await createApplication({
          ...applicationForm.value,
          status: "draft",
          startNodeId: ""
        });
        if (newApp) {
          // 创建成功后加载应用（会加载后端创建的默认开始节点）
          await loadApplication(newApp.id);
        }
      }
      applicationDialogVisible.value = false;
    }
  });
}

function handleBackToList() {
  // 返回列表前可以提示保存
  if (workflow.getAllNodes().length > 0) {
    ElMessageBox.confirm("是否保存当前工作流？", "提示", {
      confirmButtonText: "保存",
      cancelButtonText: "不保存",
      distinguishCancelAndClose: true,
      type: "warning"
    })
      .then(async () => {
        await saveWorkflow();
        currentApplication.value = null;
      })
      .catch(action => {
        if (action === "cancel") {
          currentApplication.value = null;
        }
      });
  } else {
    currentApplication.value = null;
  }
}

async function handleSaveWorkflow() {
  await saveWorkflow();
}

async function handlePageChange(page: number) {
  pagination.value.page = page;
  const result = await loadApplications({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  });
  if (result) {
    pagination.value.total = result.total;
    pagination.value.totalPages = result.totalPages;
  }
}

async function handleSizeChange(size: number) {
  pagination.value.pageSize = size;
  pagination.value.page = 1;
  const result = await loadApplications({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  });
  if (result) {
    pagination.value.total = result.total;
    pagination.value.totalPages = result.totalPages;
  }
}

// 在组件挂载后初始化
onMounted(async () => {
  // 同步数据
  nodeTypes.value = workflow.nodeTypes;

  // 使用 watch 来同步 nodes 和 edges
  watch(
    () => workflow?.nodes?.value,
    newNodes => {
      if (newNodes) {
        nodes.value = newNodes;
      }
    },
    { immediate: true, deep: true }
  );

  watch(
    () => workflow?.edges?.value,
    newEdges => {
      if (newEdges) {
        edges.value = newEdges;
      }
    },
    { immediate: true, deep: true }
  );

  // 加载应用列表
  const result = await loadApplications({
    page: pagination.value.page,
    pageSize: pagination.value.pageSize
  });
  if (result) {
    pagination.value.total = result.total;
    pagination.value.totalPages = result.totalPages;
  }
});

/**
 * 控制按钮事件
 */
function resetTransform() {
  workflow?.fitView({ duration: 300 });
}

function fitView() {
  workflow?.fitView({ padding: 0.2, duration: 300 });
}

function changeDarkMode() {
  darkMode.value = !darkMode.value;
}

async function logToObject() {
  await workflow?.exportData();
}

async function clearCanvas() {
  await workflow?.clearCanvas();
}

/**
 * 节点事件处理
 */
function onNodeClick({ node }: { node: Node }) {
  workflow?.setSelectedNodeId(node.id);
}

function onEdgeClick({ edge }: { edge: any }) {
  console.log("Edge clicked:", edge);
}

// 画布鼠标按下事件
function onCanvasMouseDown(event: MouseEvent) {
  // 检查是否点击在节点上
  const target = event.target as HTMLElement;
  const nodeElement = target.closest(".vue-flow__node");

  if (nodeElement) {
    const nodeId = nodeElement.getAttribute("data-id");
    if (nodeId) {
      console.log("Mouse down on node:", nodeId);
      // 记录鼠标按下位置和节点ID，但不立即设置 draggingNodeId
      mouseDownPos.value = { x: event.clientX, y: event.clientY };
      isDragging.value = false;
      // 暂存节点ID，等待移动
      (event.currentTarget as any)._pendingDragNodeId = nodeId;
    }
  }
}

// 画布鼠标移动事件
function onCanvasMouseMove(event: MouseEvent) {
  if (mouseDownPos.value && !isDragging.value) {
    // 计算移动距离
    const dx = event.clientX - mouseDownPos.value.x;
    const dy = event.clientY - mouseDownPos.value.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // 如果移动距离超过5像素，认为是拖拽
    if (distance > 5) {
      isDragging.value = true;
      const nodeId = (event.currentTarget as any)._pendingDragNodeId;
      if (nodeId) {
        console.log("Start dragging node:", nodeId);
        draggingNodeId.value = nodeId;
      }
    }
  }
}

// 画布鼠标抬起事件
function onCanvasMouseUp() {
  console.log("Mouse up, clearing draggingNodeId");
  mouseDownPos.value = null;
  isDragging.value = false;
  draggingNodeId.value = null;
}

/**
 * 连接事件处理
 */
async function onConnect(params: Connection) {
  await workflow?.addEdge(params);

  // 连接后自动保存到后端
  if (currentApplication.value) {
    await saveWorkflow();
  }
}

/**
 * 拖拽事件处理
 */
function onDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "move";
  }
}

async function onDrop(event: DragEvent) {
  event.preventDefault();

  if (!event.dataTransfer) return;

  const templateData = event.dataTransfer.getData("application/vueflow-node");
  if (!templateData) return;

  try {
    const template: NodeTemplate = JSON.parse(templateData);
    const position = workflow?.screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY
    });

    if (position) {
      await workflow?.addNode(template.type, position);

      // 添加节点后自动保存到后端
      if (currentApplication.value) {
        await saveWorkflow();
      }
    }
  } catch (error) {
    console.error("Failed to create node:", error);
  }
}

function onPaletteDragStart(_template: NodeTemplate) {
  isDraggingFromPalette.value = true;
}

/**
 * 节点更新和删除
 */
async function handleUpdateNode(nodeId: string, updates: any) {
  await workflow?.updateNode(nodeId, updates);

  // 更新节点后自动保存到后端
  if (currentApplication.value) {
    await saveWorkflow();
  }
}

async function handleDeleteNode(nodeId: string) {
  await workflow?.deleteNode(nodeId);

  // 删除节点后自动保存到后端
  if (currentApplication.value) {
    await saveWorkflow();
  }
}

/**
 * 右键菜单处理
 */
// 阻止默认右键菜单
function onContextMenu(event: MouseEvent) {
  event.preventDefault();
}

// 画布右键菜单
function onPaneContextMenu(event: MouseEvent) {
  event.preventDefault();
  contextMenu.value = {
    visible: true,
    x: event.clientX,
    y: event.clientY,
    type: "canvas",
    targetNode: null,
    targetEdge: null
  };
}

// 节点右键菜单
function onNodeContextMenu({ event, node }: any) {
  const mouseEvent = event as MouseEvent;
  mouseEvent.preventDefault();
  mouseEvent.stopPropagation();
  contextMenu.value = {
    visible: true,
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
    type: "node",
    targetNode: node,
    targetEdge: null
  };
}

// 连线右键菜单
function onEdgeContextMenu({ event, edge }: any) {
  const mouseEvent = event as MouseEvent;
  mouseEvent.preventDefault();
  mouseEvent.stopPropagation();
  contextMenu.value = {
    visible: true,
    x: mouseEvent.clientX,
    y: mouseEvent.clientY,
    type: "edge",
    targetNode: null,
    targetEdge: edge
  };
}

// 关闭右键菜单
function closeContextMenu() {
  contextMenu.value.visible = false;
}

// 画布操作
function handleZoomIn() {
  if (vueFlowRef.value) {
    vueFlowRef.value.zoomIn();
  }
}

function handleZoomOut() {
  if (vueFlowRef.value) {
    vueFlowRef.value.zoomOut();
  }
}

async function handleSelectAll() {
  await workflow?.selectAllNodes();
}

// 节点操作
function handleEditNodeFromMenu(node: Node) {
  workflow?.setSelectedNodeId(node.id);
  ElMessage.info("请在右侧属性面板编辑节点");
}

function handleCopyNode(node: Node) {
  // 复制节点数据到剪贴板
  const nodeData = JSON.stringify(node);
  navigator.clipboard.writeText(nodeData).then(() => {
    ElMessage.success("节点已复制到剪贴板");
  });
}

async function handleDuplicateNode(node: Node) {
  await workflow?.cloneNode(node);
}

async function handleDeleteNodeFromMenu(node: Node) {
  await handleDeleteNode(node.id);
}

async function handleToggleConnectable(node: Node) {
  await workflow?.updateNode(node.id, {
    connectable: !node.connectable
  });
  ElMessage.success(node.connectable ? "已禁用节点连接" : "已启用节点连接");
}

// 连线操作
async function handleEditEdge(edge: Edge) {
  try {
    const { value } = await ElMessageBox.prompt(
      "请输入连接线标签",
      "编辑连接",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        inputValue: (edge.label as string) || ""
      }
    );

    await workflow?.updateEdge(edge.id, { label: value });
  } catch {
    // 用户取消
  }
}

async function handleDeleteEdgeFromMenu(edge: Edge) {
  await workflow?.deleteEdge(edge.id);
}

async function handleToggleAnimation(edge: Edge) {
  await workflow?.updateEdge(edge.id, {
    animated: !edge.animated
  });
  ElMessage.success(edge.animated ? "已关闭动画" : "已开启动画");
}
</script>
<style lang="scss" scoped>
.flowapp-container {
  display: flex;
  flex-direction: column;
  width: calc(100% - 35px);
  height: calc(100% - 35px);
  background-color: #f5f7fa;
}

// 应用列表视图
.application-list-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 20px;

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .toolbar-left {
      h2 {
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #303133;
      }
    }
  }

  .application-list {
    display: flex;
    flex: 1;
    flex-direction: column;
    padding: 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 10%);

    .pagination {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}

// 图形化编辑视图
.flow-editor-view {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .editor-toolbar {
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
    background: white;
    border-bottom: 1px solid #e4e7ed;
    box-shadow: 0 2px 4px rgb(0 0 0 / 5%);

    .toolbar-left {
      display: flex;
      gap: 16px;
      align-items: center;

      .app-name {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
      }
    }
  }
}

.basic-flow {
  width: 100%;
  height: 100%;
  transition:
    background 0.3s ease,
    color 0.3s ease;

  // 选中节点样式
  :deep(.vue-flow__node.selected) {
    box-shadow: 0 0 0 3px #409eff;
  }

  // 边样式
  :deep(.vue-flow__edge) {
    &.selected {
      .vue-flow__edge-path {
        stroke: #409eff;
        stroke-width: 2;
      }
    }
  }

  // 边标签样式
  :deep(.vue-flow__edge-text) {
    font-size: 12px;
    fill: #606266;
  }

  :deep(.vue-flow__edge-textbg) {
    fill: white;
  }
}

// 暗黑模式
.basic-flow.dark {
  color: #fffffb;
  background: #1a1a1a;

  :deep(.vue-flow__node.selected) {
    box-shadow: 0 0 0 3px #409eff;
  }

  :deep(.vue-flow__edge-text) {
    fill: #fffffb;
  }

  :deep(.vue-flow__edge-textbg) {
    fill: #2d3748;
  }

  :deep(.vue-flow__controls) {
    background: #2d3748;
    border: 1px solid #4a5568;

    .vue-flow__controls-button {
      background: #2d3748;
      border-bottom: 1px solid #4a5568;

      &:hover {
        background: #4a5568;
      }

      svg {
        fill: #fffffb;
      }
    }
  }

  :deep(.vue-flow__minimap) {
    background: #2d3748;
    border: 1px solid #4a5568;
  }
}

// 控制按钮样式
.controls {
  :deep(.vue-flow__controls-button) {
    width: 36px;
    height: 36px;
    border: none;
    border-bottom: 1px solid #e4e7ed;
    transition: all 0.3s ease;

    &:hover {
      color: #409eff;
      background: #ecf5ff;
    }

    svg {
      width: 18px;
      height: 18px;
    }
  }
}

// MiniMap 样式
:deep(.vue-flow__minimap) {
  border: 2px solid #e4e7ed;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
  transform: scale(70%);
  transform-origin: bottom left;
}
</style>
