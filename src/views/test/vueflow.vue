<template>
  <div class="flow-container">
    <VueFlow
      :nodes="nodes"
      :edges="edges"
      :default-viewport="{ zoom: 1 }"
      :min-zoom="0.2"
      :max-zoom="4"
      :node-types="nodeTypes"
      :default-edge-options="defaultEdgeOptions"
      :connect-on-click="true"
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @drop="onDrop"
      @dragover="onDragOver"
    >
      <Background pattern-color="#aaa" :gap="16" />
      <MiniMap />
    </VueFlow>
    <Controls class="controls" />
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
  Node
} from "@vue-flow/core";
import { Background } from "@vue-flow/background";
import { Controls } from "@vue-flow/controls";
import { MiniMap } from "@vue-flow/minimap";
import CustomNode from "./CustomNode.vue";
const {
  addEdges,
  getNodes,
  getEdges,
  setEdges,
  setNodes,
  screenToFlowCoordinate,
  onNodesInitialized,
  updateNode,
  addNodes
} = useVueFlow();
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
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
</script>
<style lang="scss" scoped>
.flow-container {
  position: relative;
  width: 100%;
  height: 100%;
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

.controls {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 40px;
  height: 40px;
}
</style>
