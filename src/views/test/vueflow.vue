<template>
  <div class="flow-container">
    <VueFlow
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
      @drop="onDrop"
      @dragover="onDragOver"
      @connect="onConnect"
    >
      <Background pattern-color="#aaa" :gap="16" />
      <MiniMap pannable zoomable />
    </VueFlow>
    <Controls class="controls" position="top-left">
      <ControlButton title="Reset Transform" @click="resetTransform">
        <Refresh />
      </ControlButton>

      <ControlButton
        title="Shuffle Node Positions"
        @click="shuffleNodePositions"
      >
        <Sort />
      </ControlButton>

      <ControlButton title="Toggle Dark Mode" @click="changeDarkMode">
        <Moon v-if="!darkMode" />
        <Sunny v-else />
      </ControlButton>

      <ControlButton title="Log `toObject`" @click="logToObject">
        <More />
      </ControlButton>
    </Controls>
  </div>
</template>
<script setup lang="ts">
import { ref, markRaw } from "vue";
import {
  VueFlow,
  useVueFlow,
  MarkerType,
  type DefaultEdgeOptions,
  EdgeChange,
  NodeTypesObject,
  Node,
  OnConnectStartParams,
  Connection
} from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { ControlButton, Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import CustomNode from "./CustomNode.vue";
import { Moon, Refresh, Sort, Sunny, More } from "@element-plus/icons-vue";

const darkMode = ref(false);

const changeDarkMode = () => {
  darkMode.value = !darkMode.value;
};

const {
  getNodes,
  addEdges,
  getEdges,
  setEdges,
  setNodes,
  screenToFlowCoordinate,
  onNodesInitialized,
  updateNode,
  addNodes,
  setViewport,
  fitView
} = useVueFlow();

const resetTransform = () => {
  fitView();
};

const shuffleNodePositions = () => {
  const nodes = getNodes.value;
  const shuffled = nodes.sort(() => Math.random() - 0.5);
  setNodes(shuffled);
};

const logToObject = () => {
  const nodes = getNodes.value;
  const edges = getEdges.value;
  console.log("Nodes:", nodes);
  console.log("Edges:", edges);
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "bezier",
  animated: true,
  markerEnd: { type: MarkerType.ArrowClosed, color: "black" }
};
const nodes = ref<Node[]>([
  {
    id: "1",
    type: "input",
    data: { label: "开始" },
    position: { x: 250, y: 100 },
    class: "round-start",
    connectable: true
  },
  {
    id: "2",
    type: "custom",
    data: { label: "流程1" },
    position: { x: 250, y: 200 },
    class: "light",
    connectable: true
  },
  {
    id: "3",
    type: "output",
    data: { label: "结束" },
    position: { x: 250, y: 300 },
    class: "round-stop",
    connectable: true
  },
  {
    id: "4",
    type: "custom",
    data: { label: "流程2" },
    position: { x: 400, y: 200 },
    connectable: true
  },
  // 普通块
  {
    id: "5",
    type: "custom",
    data: { label: "流程3", loading: true },
    position: { x: 400, y: 300 },
    connectable: true
  }
]);
const nodeTypes = ref<NodeTypesObject>({ custom: markRaw(CustomNode) });
const edges = ref([
  {
    id: "e1-2",
    type: "straight",
    source: "1",
    target: "2",
    label: "连接1",
    markerEnd: { type: MarkerType.ArrowClosed, color: "black" }
  },
  {
    id: "e2-3",
    type: "straight",
    source: "2",
    target: "3",
    label: "连接2",
    markerEnd: { type: MarkerType.ArrowClosed, color: "black" }
  }
]);
function onNodeClick({ node }) {
  console.log("Node clicked:", node);
}
function onEdgeClick({ edge }) {
  console.log("Edge clicked:", edge);
}
function onDrop(event) {
  const position = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY
  });
  const newNode = {
    id: `node-${Date.now()}`,
    data: { label: "新节点" },
    position,
    type: "custom"
  };
  addNodes(newNode);
}
function onDragOver(event) {
  event.preventDefault();
}

// 添加这个函数来处理节点连接
const onConnect: (params: Connection) => void = params => {
  addEdges([
    {
      ...params,
      markerEnd: { type: MarkerType.ArrowClosed, color: "black" },
      animated: true
    }
  ]);
};
</script>
<style lang="scss" scoped>
.flow-container {
  position: relative;
  width: calc(100% - 50px);
  height: calc(100% - 50px);
  margin: 25px;
  background-color: #f9f9f9;
}

.round-start,
.round-stop {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  color: white;
  border-radius: 50%;
}

.round-start {
  background-color: rgb(0 128 0 / 60%);
}

.round-stop {
  background-color: rgb(255 0 0 / 60%);
}

.light {
  background-color: #f0f0f0;
}

.vue-flow__minimap {
  transform: scale(75%);
  transform-origin: bottom right;
}

.basic-flow.dark {
  color: #fffffb;
  background: #2d3748;
}

.basic-flow.dark .vue-flow__node {
  color: #fffffb;
  background: #4a5568;
}

.basic-flow.dark .vue-flow__node.selected {
  background: #333;
  box-shadow: 0 0 0 2px #2563eb;
}

.basic-flow .vue-flow__controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.basic-flow.dark .vue-flow__controls {
  border: 1px solid #fffffb;
}

.basic-flow .vue-flow__controls .vue-flow__controls-button {
  border: none;
  border-right: 1px solid #eee;
}

.basic-flow .vue-flow__controls .vue-flow__controls-button svg {
  width: 100%;
  height: 100%;
}

.basic-flow.dark .vue-flow__controls .vue-flow__controls-button {
  background: #333;
  border: none;
  fill: #fffffb;
}

.basic-flow.dark .vue-flow__controls .vue-flow__controls-button:hover {
  background: #4d4d4d;
}

.basic-flow.dark .vue-flow__edge-textbg {
  fill: #292524;
}

.basic-flow.dark .vue-flow__edge-text {
  fill: #fffffb;
}

// 切换动画
.basic-flow {
  transition:
    background 0.3s ease,
    color 0.3s ease;
}
</style>
