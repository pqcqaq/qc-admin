<template>
  <div
    class="flow-editor-view"
    @contextmenu="onContextMenu"
    @mousedown="onCanvasMouseDown"
    @mousemove="onCanvasMouseMove"
    @mouseup="onCanvasMouseUp"
  >
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
      v-model="openNodePalette"
      :dark-mode="darkMode"
      :dragging-node-id="draggingNodeId"
      :go-left="!openSidePanel"
      @drag-start="onPaletteDragStart"
      @delete-node="handleDeleteNode"
    />

    <!-- 右侧属性面板 -->
    <PropertiesPanel
      v-model="openSidePanel"
      :dark-mode="darkMode"
      :selected-node="selectedNode"
      :selected-edge="selectedEdge"
      @update-node="handleUpdateNode"
      @delete-node="handleDeleteNode"
      @update-edge="handleUpdateEdge"
      @delete-edge="handleDeleteEdge"
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
import { ref, shallowRef, computed } from "vue";
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
import NodePalette from "./NodePalette.vue";
import PropertiesPanel from "./PropertiesPanel/index.vue";
import ContextMenu from "./ContextMenu/ContextMenu.vue";
import { useWorkflow } from "@/composables/workflow/useWorkflow";

// 导入类型和配置
import type { NodeTemplate } from "./types";
import { getNodeConnectionRule, NodeTypeEnum } from "./types";

// Props
interface Props {
  workflow: ReturnType<typeof useWorkflow>;
  darkMode?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  darkMode: false
});

// Emits
const emit = defineEmits<{
  "update:darkMode": [value: boolean];
}>();

// Vue Flow 实例
const vueFlowRef = ref();

// 从 workflow 获取数据
const nodes = computed(() => props.workflow.nodes.value);
const edges = computed(() => props.workflow.edges.value);
const nodeTypes = shallowRef(props.workflow.nodeTypes);
const selectedNode = computed(() => props.workflow.selectedNode.value || null);
const selectedEdge = computed(() => props.workflow.selectedEdge.value || null);

// 状态管理
const isDraggingFromPalette = ref(false);
const draggingNodeId = ref<string | null>(null);
const mouseDownPos = ref<{ x: number; y: number } | null>(null);
const isDragging = ref(false);
const openSidePanel = ref(false);
const openNodePalette = ref(false);

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
  animated: false,
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 2 }
};

/**
 * 控制按钮事件
 */
function resetTransform() {
  props.workflow?.fitView({ duration: 300 });
}

function fitView() {
  props.workflow?.fitView({ padding: 0.2, duration: 300 });
}

function changeDarkMode() {
  emit("update:darkMode", !props.darkMode);
}

async function logToObject() {
  await props.workflow?.exportData();
}

async function clearCanvas() {
  await props.workflow?.clearCanvas();
}

/**
 * 节点事件处理
 */
function onNodeClick({ node }: { node: Node }) {
  props.workflow?.setSelectedNodeId(node.id);
}

function onEdgeClick({ edge }: { edge: any }) {
  props.workflow?.setSelectedEdgeId(edge.id);
}

// 画布鼠标事件
function onCanvasMouseDown(event: MouseEvent) {
  const target = event.target as HTMLElement;
  const nodeElement = target.closest(".vue-flow__node");

  if (nodeElement) {
    const nodeId = nodeElement.getAttribute("data-id");
    if (nodeId) {
      mouseDownPos.value = { x: event.clientX, y: event.clientY };
      isDragging.value = false;
      (event.currentTarget as any)._pendingDragNodeId = nodeId;
    }
  }
}

function onCanvasMouseMove(event: MouseEvent) {
  if (mouseDownPos.value && !isDragging.value) {
    const dx = event.clientX - mouseDownPos.value.x;
    const dy = event.clientY - mouseDownPos.value.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5) {
      isDragging.value = true;
      const nodeId = (event.currentTarget as any)._pendingDragNodeId;
      if (nodeId) {
        draggingNodeId.value = nodeId;
      }
    }
  }
}

function onCanvasMouseUp() {
  mouseDownPos.value = null;
  isDragging.value = false;
  draggingNodeId.value = null;
}

/**
 * 连接事件处理
 */
async function onConnect(params: Connection) {
  console.log("[onConnect] 创建连接:", params);

  const sourceNode = props.workflow
    ?.getAllNodes()
    .find(n => n.id === params.source);
  const targetNode = props.workflow
    ?.getAllNodes()
    .find(n => n.id === params.target);

  if (!sourceNode) {
    ElMessage.error("源节点不存在");
    return;
  }

  if (!targetNode) {
    ElMessage.error("目标节点不存在");
    return;
  }

  // 验证连接规则
  if (params.source === params.target) {
    ElMessage.warning("不能连接到自己");
    return;
  }

  const sourceRule = getNodeConnectionRule(sourceNode.type);
  const targetRule = getNodeConnectionRule(targetNode.type);

  if (sourceRule.maxOutputConnections === 0) {
    ElMessage.warning("该节点不能连接到其他节点");
    return;
  }

  if (targetNode.type === "start") {
    ElMessage.warning("开始节点不能被其他节点连接");
    return;
  }

  const existingEdges = props.workflow?.getAllEdges() || [];
  const duplicateEdge = existingEdges.find(
    e =>
      e.source === params.source &&
      e.target === params.target &&
      e.sourceHandle === params.sourceHandle
  );
  if (duplicateEdge) {
    ElMessage.warning("该连接已存在");
    return;
  }

  const isBranchConnection = params.sourceHandle?.includes("-branch-");
  const isParallelChildConnection = params.sourceHandle?.includes("-parallel-");

  if (!isBranchConnection && !isParallelChildConnection) {
    // 普通连接验证
    if (!sourceRule.canHaveNextNode) {
      ElMessage.warning(
        `${sourceNode.data?.label || "该节点"}不能有普通输出连接，请使用分支连接`
      );
      return;
    }

    const existingNextNodeEdges = existingEdges.filter(
      e =>
        e.source === params.source &&
        !e.sourceHandle?.includes("-branch-") &&
        !e.sourceHandle?.includes("-parallel-")
    );

    if (
      sourceRule.maxOutputConnections === 1 &&
      existingNextNodeEdges.length > 0
    ) {
      ElMessage.warning("该节点已有一个主输出连接，请先断开现有连接");
      return;
    }
  } else if (isBranchConnection) {
    // 分支连接验证
    if (!sourceRule.canHaveBranches) {
      ElMessage.warning(`${sourceNode.data?.label || "该节点"}不支持分支连接`);
      return;
    }

    // 检查目标节点是否可以作为分支的目标
    if (!targetRule.canBeParallel) {
      ElMessage.warning(
        `${targetNode.data?.label || "目标节点"}不能作为分支的目标节点`
      );
      return;
    }
  } else if (isParallelChildConnection) {
    // 并行子节点连接验证
    if (!targetRule.canBeParallel) {
      ElMessage.warning(
        `${targetNode.data?.label || "目标节点"}不能作为并行子节点`
      );
      return;
    }
  }

  type EnhancedConnection = Connection & {
    data: any;
    type: string;
    animated: boolean;
    label: string;
    style: object;
  };

  const enhancedParams: EnhancedConnection = {
    ...params,
    data: {},
    type: "smoothstep",
    animated: false,
    label: "",
    style: { strokeWidth: 2 }
  };

  // 处理条件节点的分支连接
  if (
    sourceNode.type === NodeTypeEnum.CONDITION_CHECKER &&
    params.sourceHandle
  ) {
    // 使用正则提取分支名称（格式：nodeId-branch-branchName）
    const match = params.sourceHandle.match(/-branch-(.+)$/);
    if (match) {
      const branchName = match[1];
      enhancedParams.type = "smoothstep";
      enhancedParams.animated = true;
      enhancedParams.label = branchName;
      enhancedParams.style = {
        strokeWidth: 2,
        stroke: "#E6A23C"
      };
      enhancedParams.data = {
        branchName,
        label: branchName
      };
    }
  }

  // 处理并行节点的任务连接
  if (
    sourceNode.type === NodeTypeEnum.PARALLEL_EXECUTOR &&
    params.sourceHandle
  ) {
    // 使用正则检测并行连接（格式：nodeId-parallel-threadId）
    const match = params.sourceHandle.match(/-parallel-(.+)$/);
    if (match) {
      const threadId = match[1];
      enhancedParams.type = "smoothstep";
      enhancedParams.animated = true;
      enhancedParams.label = "并行";
      enhancedParams.style = {
        strokeWidth: 2,
        stroke: "#909399",
        strokeDasharray: "5,5"
      };
      enhancedParams.data = {
        isParallelChild: true,
        threadId, // 保存 thread ID，方便后续使用
        label: "并行"
      };
    }
  }

  await props.workflow?.addEdge(enhancedParams);
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
    const position = props.workflow?.screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY
    });

    if (position) {
      await props.workflow?.addNode(template.type, position);
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
  await props.workflow?.updateNode(nodeId, updates);
}

async function handleDeleteNode(nodeId: string) {
  await props.workflow?.deleteNode(nodeId);
}

/**
 * 右键菜单处理
 */
function onContextMenu(event: MouseEvent) {
  event.preventDefault();
}

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

function closeContextMenu() {
  contextMenu.value.visible = false;
}

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
  await props.workflow?.selectAllNodes();
}

function handleEditNodeFromMenu(node: Node) {
  props.workflow?.setSelectedNodeId(node.id);
  ElMessage.info("请在右侧属性面板编辑节点");
}

function handleCopyNode(node: Node) {
  const nodeData = JSON.stringify(node);
  navigator.clipboard.writeText(nodeData).then(() => {
    ElMessage.success("节点已复制到剪贴板");
  });
}

async function handleDuplicateNode(node: Node) {
  await props.workflow?.cloneNode(node);
}

async function handleDeleteNodeFromMenu(node: Node) {
  await handleDeleteNode(node.id);
}

async function handleToggleConnectable(node: Node) {
  await props.workflow?.updateNode(node.id, {
    connectable: !node.connectable
  });
  ElMessage.success(node.connectable ? "已禁用节点连接" : "已启用节点连接");
}

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

    await props.workflow?.updateEdge(edge.id, { label: value });
  } catch {
    // 用户取消
  }
}

async function handleDeleteEdgeFromMenu(edge: Edge) {
  await props.workflow?.deleteEdge(edge.id);
}

async function handleToggleAnimation(edge: Edge) {
  await props.workflow?.updateEdge(edge.id, {
    animated: !edge.animated
  });
  ElMessage.success(edge.animated ? "已关闭动画" : "已开启动画");
}

/**
 * 从属性面板更新边
 */
async function handleUpdateEdge(edgeId: string, updates: Partial<Edge>) {
  await props.workflow?.updateEdge(edgeId, updates);
}

/**
 * 从属性面板删除边
 */
async function handleDeleteEdge(edgeId: string) {
  await props.workflow?.deleteEdge(edgeId);
}
</script>

<style lang="scss" scoped>
.flow-editor-view {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
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
