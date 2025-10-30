<template>
  <div class="flow-container" @contextmenu="onContextMenu">
    <VueFlow
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
      @node-drag-start="onNodeDragStart"
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
import { ref, markRaw, computed } from "vue";
import {
  VueFlow,
  useVueFlow,
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
import StartNode from "./components/nodes/StartNode.vue";
import EndNode from "./components/nodes/EndNode.vue";
import ProcessNode from "./components/nodes/ProcessNode.vue";
import DecisionNode from "./components/nodes/DecisionNode.vue";
import ParallelNode from "./components/nodes/ParallelNode.vue";
import CustomNodeComponent from "./components/nodes/CustomNode.vue";

// 导入类型和配置
import {
  NodeTypeEnum,
  type FlowNode,
  type NodeTemplate
} from "./components/types";
import { createNode } from "./components/nodeConfig";

// Vue Flow 实例
const vueFlowRef = ref();
const {
  getNodes,
  addEdges,
  getEdges,
  setEdges,
  setNodes,
  screenToFlowCoordinate,
  updateNode,
  addNodes,
  removeNodes,
  fitView: vueFlowFitView,
  project
} = useVueFlow();

// 状态管理
const darkMode = ref(false);
const selectedNodeId = ref<string | null>(null);
const isDraggingFromPalette = ref(false);

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

// 节点类型注册
const nodeTypes = ref({
  [NodeTypeEnum.START]: markRaw(StartNode),
  [NodeTypeEnum.END]: markRaw(EndNode),
  [NodeTypeEnum.PROCESS]: markRaw(ProcessNode),
  [NodeTypeEnum.DECISION]: markRaw(DecisionNode),
  [NodeTypeEnum.PARALLEL]: markRaw(ParallelNode),
  [NodeTypeEnum.CUSTOM]: markRaw(CustomNodeComponent)
});

// 默认边配置
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed }
};

// 初始节点
const nodes = ref<Node[]>([
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
]);

// 初始边
const edges = ref([
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
]);

// 计算选中的节点
const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null;
  return getNodes.value.find(
    n => n.id === selectedNodeId.value
  ) as FlowNode | null;
});

/**
 * 控制按钮事件
 */
function resetTransform() {
  vueFlowFitView({ duration: 300 });
}

function fitView() {
  vueFlowFitView({ padding: 0.2, duration: 300 });
}

function changeDarkMode() {
  darkMode.value = !darkMode.value;
}

function logToObject() {
  const flowData = {
    nodes: getNodes.value,
    edges: getEdges.value
  };
  console.log("Flow Data:", flowData);
  ElMessage.success("数据已输出到控制台");
}

async function clearCanvas() {
  try {
    await ElMessageBox.confirm("确定要清空画布吗？此操作不可恢复。", "警告", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });
    setNodes([]);
    setEdges([]);
    selectedNodeId.value = null;
    ElMessage.success("画布已清空");
  } catch {
    // 用户取消
  }
}

/**
 * 节点事件处理
 */
function onNodeClick({ node }: { node: Node }) {
  selectedNodeId.value = node.id;
}

function onEdgeClick({ edge }: { edge: any }) {
  console.log("Edge clicked:", edge);
}

function onNodeDragStart({ node }: { node: Node }) {
  // 当从画布拖拽节点时，设置数据传输
  selectedNodeId.value = node.id;
}

/**
 * 连接事件处理
 */
function onConnect(params: Connection) {
  addEdges([
    {
      ...params,
      id: `e${params.source}-${params.target}-${Date.now()}`,
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed }
    }
  ]);
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

function onDrop(event: DragEvent) {
  event.preventDefault();

  if (!event.dataTransfer) return;

  const templateData = event.dataTransfer.getData("application/vueflow-node");
  if (!templateData) return;

  try {
    const template: NodeTemplate = JSON.parse(templateData);
    const position = screenToFlowCoordinate({
      x: event.clientX,
      y: event.clientY
    });

    const newNode = createNode(template.type, position);
    addNodes([newNode]);

    ElMessage.success(`已添加${template.label}节点`);
  } catch (error) {
    console.error("Failed to create node:", error);
    ElMessage.error("创建节点失败");
  }
}

function onPaletteDragStart(template: NodeTemplate) {
  isDraggingFromPalette.value = true;
}

/**
 * 节点更新和删除
 */
function handleUpdateNode(nodeId: string, updates: Partial<FlowNode>) {
  updateNode(nodeId, updates);
}

function handleDeleteNode(nodeId: string) {
  removeNodes([nodeId]);
  if (selectedNodeId.value === nodeId) {
    selectedNodeId.value = null;
  }
  ElMessage.success("节点已删除");
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

function handleSelectAll() {
  const allNodes = getNodes.value;
  allNodes.forEach(node => {
    node.selected = true;
  });
  setNodes(allNodes);
  ElMessage.success(`已选中 ${allNodes.length} 个节点`);
}

// 节点操作
function handleEditNodeFromMenu(node: Node) {
  selectedNodeId.value = node.id;
  ElMessage.info("请在右侧属性面板编辑节点");
}

function handleCopyNode(node: Node) {
  // 复制节点数据到剪贴板
  const nodeData = JSON.stringify(node);
  navigator.clipboard.writeText(nodeData).then(() => {
    ElMessage.success("节点已复制到剪贴板");
  });
}

function handleDuplicateNode(node: Node) {
  const newNode: Node = {
    ...node,
    id: `${node.type}-${Date.now()}`,
    position: {
      x: node.position.x + 50,
      y: node.position.y + 50
    }
  };
  addNodes([newNode]);
  ElMessage.success("节点已克隆");
}

function handleDeleteNodeFromMenu(node: Node) {
  handleDeleteNode(node.id);
}

function handleToggleConnectable(node: Node) {
  updateNode(node.id, {
    connectable: !node.connectable
  });
  ElMessage.success(node.connectable ? "已禁用节点连接" : "已启用节点连接");
}

// 连线操作
function handleEditEdge(edge: Edge) {
  ElMessageBox.prompt("请输入连接线标签", "编辑连接", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputValue: (edge.label as string) || ""
  })
    .then(({ value }) => {
      const edges = getEdges.value;
      const targetEdge = edges.find(e => e.id === edge.id);
      if (targetEdge) {
        targetEdge.label = value;
        setEdges(edges);
        ElMessage.success("连接标签已更新");
      }
    })
    .catch(() => {
      // 用户取消
    });
}

function handleDeleteEdgeFromMenu(edge: Edge) {
  const edges = getEdges.value.filter(e => e.id !== edge.id);
  setEdges(edges);
  ElMessage.success("连接已删除");
}

function handleToggleAnimation(edge: Edge) {
  const edges = getEdges.value;
  const targetEdge = edges.find(e => e.id === edge.id);
  if (targetEdge) {
    targetEdge.animated = !targetEdge.animated;
    setEdges(edges);
    ElMessage.success(targetEdge.animated ? "已开启动画" : "已关闭动画");
  }
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
