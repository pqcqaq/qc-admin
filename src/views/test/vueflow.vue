<template>
  <div
    class="flow-container"
    @contextmenu="onContextMenu"
    @mousedown="onCanvasMouseDown"
    @mousemove="onCanvasMouseMove"
    @mouseup="onCanvasMouseUp"
  >
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
  FullScreen
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";

// 导入组件
import NodePalette from "./components/NodePalette.vue";
import PropertiesPanel from "./components/PropertiesPanel.vue";
import ContextMenu from "./components/ContextMenu.vue";

// 导入类型和配置
import { NodeTypeEnum, type NodeTemplate } from "./components/types";
import { useWorkflow } from "./composables/useWorkflow";

// Vue Flow 实例
const vueFlowRef = ref();

// 工作流配置
const workflowOptions = {
  vueFlowId: "workflow-canvas",

  // 节点操作回调
  beforeAddNode: async (context: any) => {
    // 业务逻辑：限制节点数量
    if (context.allNodes.length >= 50) {
      return { success: false, error: "节点数量已达上限（最多50个）" };
    }

    // 业务逻辑：限制开始节点只能有一个
    if (context.nodeType === NodeTypeEnum.START) {
      const startNodes = context.allNodes.filter(
        (n: any) => n.type === NodeTypeEnum.START
      );
      if (startNodes.length >= 1) {
        return { success: false, error: "只能有一个开始节点" };
      }
    }

    // 业务逻辑：限制结束节点只能有一个
    if (context.nodeType === NodeTypeEnum.END) {
      const endNodes = context.allNodes.filter(
        (n: any) => n.type === NodeTypeEnum.END
      );
      if (endNodes.length >= 1) {
        return { success: false, error: "只能有一个结束节点" };
      }
    }

    return { success: true };
  },

  beforeDeleteNode: async (context: any) => {
    // 业务逻辑：删除前检查是否有关联连线
    if (context.relatedEdges.length > 0) {
      console.log(
        `节点有 ${context.relatedEdges.length} 条关联连线，将一并删除`
      );
    }
    return { success: true };
  },

  beforeAddEdge: async (context: any) => {
    // 业务逻辑：防止自连接
    if (context.connection.source === context.connection.target) {
      return { success: false, error: "不能连接到自己" };
    }

    // 业务逻辑：防止重复连接
    const existingEdge = context.allEdges.find(
      (e: any) =>
        e.source === context.connection.source &&
        e.target === context.connection.target
    );
    if (existingEdge) {
      return { success: false, error: "已存在相同的连接" };
    }

    return { success: true };
  }
};

// 延迟初始化 workflow（在 onMounted 中初始化）
const workflowRef = shallowRef<any>(null);

// 使用 ref 和 computed 来访问 workflow 的属性
const nodes = ref<Node[]>([]);
const edges = ref<Edge[]>([]);
const nodeTypes = shallowRef<any>({});

// 使用 computed 来保持 selectedNode 的响应式
const selectedNode = computed(() => {
  return workflowRef.value?.selectedNode?.value || null;
});

// 状态管理
const darkMode = ref(false);
const isDraggingFromPalette = ref(false);
const draggingNodeId = ref<string | null>(null);
const mouseDownPos = ref<{ x: number; y: number } | null>(null);
const isDragging = ref(false);

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

// 初始化数据
const initData = async () => {
  const initialNodes: Node[] = [
    {
      id: "1",
      type: NodeTypeEnum.START,
      data: { label: "开始", color: "#67C23A" },
      position: { x: 250, y: 50 }
    },
    {
      id: "2",
      type: NodeTypeEnum.PROCESS,
      data: { label: "流程节点1", description: "处理数据", color: "#409EFF" },
      position: { x: 250, y: 180 }
    },
    {
      id: "3",
      type: NodeTypeEnum.DECISION,
      data: { label: "判断", description: "条件分支", color: "#E6A23C" },
      position: { x: 250, y: 350 }
    },
    {
      id: "4",
      type: NodeTypeEnum.PROCESS,
      data: { label: "流程节点2", color: "#409EFF" },
      position: { x: 100, y: 520 }
    },
    {
      id: "5",
      type: NodeTypeEnum.PROCESS,
      data: { label: "流程节点3", color: "#409EFF" },
      position: { x: 400, y: 520 }
    },
    {
      id: "6",
      type: NodeTypeEnum.END,
      data: { label: "结束", color: "#F56C6C" },
      position: { x: 250, y: 680 }
    }
  ];

  const initialEdges: Edge[] = [
    {
      id: "e1-2",
      source: "1",
      target: "2",
      label: "开始"
    },
    {
      id: "e2-3",
      source: "2",
      target: "3",
      label: "处理完成"
    },
    {
      id: "e3-4",
      source: "3",
      target: "4",
      label: "条件A"
    },
    {
      id: "e3-5",
      source: "3",
      target: "5",
      label: "条件B"
    },
    {
      id: "e4-6",
      source: "4",
      target: "6"
    },
    {
      id: "e5-6",
      source: "5",
      target: "6"
    }
  ];

  // 使用 workflow 的 importData 方法初始化数据（静默模式）
  await workflowRef.value!.importData({
    nodes: initialNodes,
    edges: initialEdges
  });
};

// 在组件挂载后初始化
onMounted(async () => {
  // 初始化 workflow
  workflowRef.value = useWorkflow(workflowOptions);

  // 同步数据
  nodeTypes.value = workflowRef.value.nodeTypes;

  // 使用 watch 来同步 nodes 和 edges
  watch(
    () => workflowRef.value?.nodes?.value,
    newNodes => {
      if (newNodes) {
        nodes.value = newNodes;
      }
    },
    { immediate: true, deep: true }
  );

  watch(
    () => workflowRef.value?.edges?.value,
    newEdges => {
      if (newEdges) {
        edges.value = newEdges;
      }
    },
    { immediate: true, deep: true }
  );

  // 初始化数据
  await initData();
});

/**
 * 控制按钮事件
 */
function resetTransform() {
  workflowRef.value?.fitView({ duration: 300 });
}

function fitView() {
  workflowRef.value?.fitView({ padding: 0.2, duration: 300 });
}

function changeDarkMode() {
  darkMode.value = !darkMode.value;
}

async function logToObject() {
  await workflowRef.value?.exportData();
}

async function clearCanvas() {
  await workflowRef.value?.clearCanvas();
}

/**
 * 节点事件处理
 */
function onNodeClick({ node }: { node: Node }) {
  workflowRef.value?.setSelectedNodeId(node.id);
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
  await workflowRef.value?.addEdge(params);
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
    const position = workflowRef.value?.screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY
    });

    if (position) {
      await workflowRef.value?.addNode(template.type, position);
    }
  } catch (error) {
    console.error("Failed to create node:", error);
  }
}

function onPaletteDragStart(template: NodeTemplate) {
  isDraggingFromPalette.value = true;
}

/**
 * 节点更新和删除
 */
async function handleUpdateNode(nodeId: string, updates: any) {
  await workflowRef.value?.updateNode(nodeId, updates);
}

async function handleDeleteNode(nodeId: string) {
  await workflowRef.value?.deleteNode(nodeId);
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
  await workflowRef.value?.selectAllNodes();
}

// 节点操作
function handleEditNodeFromMenu(node: Node) {
  workflowRef.value?.setSelectedNodeId(node.id);
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
  await workflowRef.value?.cloneNode(node);
}

async function handleDeleteNodeFromMenu(node: Node) {
  await handleDeleteNode(node.id);
}

async function handleToggleConnectable(node: Node) {
  await workflowRef.value?.updateNode(node.id, {
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

    await workflowRef.value?.updateEdge(edge.id, { label: value });
  } catch {
    // 用户取消
  }
}

async function handleDeleteEdgeFromMenu(edge: Edge) {
  await workflowRef.value?.deleteEdge(edge.id);
}

async function handleToggleAnimation(edge: Edge) {
  await workflowRef.value?.updateEdge(edge.id, {
    animated: !edge.animated
  });
  ElMessage.success(edge.animated ? "已关闭动画" : "已开启动画");
}
</script>
<style lang="scss" scoped>
.flow-container {
  position: relative;
  width: calc(100% - 25px);
  height: calc(100% - 25px);
  overflow: hidden;
  background-color: #f5f7fa;
  transition: background-color 0.3s ease;
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
