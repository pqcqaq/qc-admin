/**
 * Workflow 数据管理 Composable
 * 提供所有节点和连线的增删改查操作
 */

import { ref, computed, markRaw } from "vue";
import { useVueFlow } from "@vue-flow/core";
import type { Node, Edge, Connection } from "@vue-flow/core";
import { ElMessage } from "element-plus";

// 导入节点组件
import StartNode from "../components/nodes/StartNode.vue";
import EndNode from "../components/nodes/EndNode.vue";
import ProcessNode from "../components/nodes/ProcessNode.vue";
import DecisionNode from "../components/nodes/DecisionNode.vue";
import ParallelNode from "../components/nodes/ParallelNode.vue";
import ApiCallerNode from "../components/nodes/ApiCallerNode.vue";
import DataProcessorNode from "../components/nodes/DataProcessorNode.vue";
import WhileLoopNode from "../components/nodes/WhileLoopNode.vue";
import LlmCallerNode from "../components/nodes/LlmCallerNode.vue";

// 导入类型和配置
import { NodeTypeEnum } from "../components/types";
import { createNode } from "../components/nodeConfig";

/**
 * 操作结果类型
 */
export interface OperationResult<T = any> {
  success: boolean;
  error?: string;
  data?: T;
}

/**
 * 节点操作上下文
 */
export interface NodeOperationContext {
  nodeType: NodeTypeEnum;
  position: { x: number; y: number };
  allNodes: Node[];
  allEdges: Edge[];
}

/**
 * 节点更新上下文
 */
export interface NodeUpdateContext {
  nodeId: string;
  currentNode: Node | undefined;
  updates: Partial<Node>;
  allNodes: Node[];
  allEdges: Edge[];
}

/**
 * 节点删除上下文
 */
export interface NodeDeleteContext {
  nodeId: string | string[];
  nodesToDelete: Node[];
  relatedEdges: Edge[];
  allNodes: Node[];
  allEdges: Edge[];
}

/**
 * 节点克隆上下文
 */
export interface NodeCloneContext {
  sourceNode: Node;
  newPosition: { x: number; y: number };
  allNodes: Node[];
  allEdges: Edge[];
}

/**
 * 连线添加上下文
 */
export interface EdgeAddContext {
  connection: Connection;
  sourceNode: Node | undefined;
  targetNode: Node | undefined;
  allNodes: Node[];
  allEdges: Edge[];
}

/**
 * 连线更新上下文
 */
export interface EdgeUpdateContext {
  edgeId: string;
  currentEdge: Edge | undefined;
  updates: Partial<Edge>;
  allNodes: Node[];
  allEdges: Edge[];
}

/**
 * 连线删除上下文
 */
export interface EdgeDeleteContext {
  edgeId: string | string[];
  edgesToDelete: Edge[];
  allNodes: Node[];
  allEdges: Edge[];
}

/**
 * 全选上下文
 */
export interface SelectAllContext {
  allNodes: Node[];
  selectedNodes: Node[];
}

/**
 * 清空画布上下文
 */
export interface ClearCanvasContext {
  allNodes: Node[];
  allEdges: Edge[];
  nodeCount: number;
  edgeCount: number;
}

/**
 * 导入数据上下文
 */
export interface ImportDataContext {
  newNodes: Node[];
  newEdges: Edge[];
  currentNodes: Node[];
  currentEdges: Edge[];
}

/**
 * 导出数据上下文
 */
export interface ExportDataContext {
  nodes: Node[];
  edges: Edge[];
  nodeCount: number;
  edgeCount: number;
}

/**
 * Workflow 配置选项
 */
export interface WorkflowOptions {
  // VueFlow 实例 ID（可选，用于多实例场景）
  vueFlowId?: string;

  // 生命周期回调
  onNodesLoaded?: () => void | Promise<void>;

  // 节点操作回调
  beforeAddNode?: (
    context: NodeOperationContext
  ) => Promise<OperationResult> | OperationResult;
  beforeUpdateNode?: (
    context: NodeUpdateContext
  ) => Promise<OperationResult> | OperationResult;
  beforeDeleteNode?: (
    context: NodeDeleteContext
  ) => Promise<OperationResult> | OperationResult;
  beforeCloneNode?: (
    context: NodeCloneContext
  ) => Promise<OperationResult> | OperationResult;

  // 连线操作回调
  beforeAddEdge?: (
    context: EdgeAddContext
  ) => Promise<OperationResult> | OperationResult;
  beforeUpdateEdge?: (
    context: EdgeUpdateContext
  ) => Promise<OperationResult> | OperationResult;
  beforeDeleteEdge?: (
    context: EdgeDeleteContext
  ) => Promise<OperationResult> | OperationResult;

  // 批量操作回调
  beforeSelectAll?: (
    context: SelectAllContext
  ) => Promise<OperationResult> | OperationResult;
  beforeClearCanvas?: (
    context: ClearCanvasContext
  ) => Promise<OperationResult> | OperationResult;
  beforeImportData?: (
    context: ImportDataContext
  ) => Promise<OperationResult> | OperationResult;
  beforeExportData?: (
    context: ExportDataContext
  ) => Promise<OperationResult> | OperationResult;
}

/**
 * useWorkflow Composable
 */
export function useWorkflow(options: WorkflowOptions = {}) {
  // Vue Flow 实例
  const vueFlowInstance = useVueFlow(options.vueFlowId);

  const {
    getNodes,
    addEdges,
    getEdges,
    setEdges,
    setNodes,
    updateNode,
    addNodes,
    removeNodes,
    removeEdges,
    findNode,
    findEdge,
    fitView,
    zoomIn,
    zoomOut,
    zoomTo,
    setTransform,
    getViewport,
    screenToFlowCoordinate,
    project
  } = vueFlowInstance;

  // 状态管理
  const selectedNodeId = ref<string | null>(null);
  const selectedEdgeId = ref<string | null>(null);

  const setSelectedNodeId = (nodeId: string | null) => {
    selectedNodeId.value = nodeId;
    // 清除边的选中状态
    selectedEdgeId.value = null;

    // 更新所有节点的选中状态
    const allNodes = getNodes.value;
    const updatedNodes = allNodes.map(node => ({
      ...node,
      selected: node.id === nodeId
    }));
    setNodes(updatedNodes);

    // 清除所有边的选中状态
    const allEdges = getEdges.value;
    const updatedEdges = allEdges.map(edge => ({
      ...edge,
      selected: false
    }));
    setEdges(updatedEdges);
  };

  const setSelectedEdgeId = (edgeId: string | null) => {
    selectedEdgeId.value = edgeId;
    // 清除节点的选中状态
    selectedNodeId.value = null;

    // 清除所有节点的选中状态
    const allNodes = getNodes.value;
    const updatedNodes = allNodes.map(node => ({
      ...node,
      selected: false
    }));
    setNodes(updatedNodes);

    // 更新所有边的选中状态
    const allEdges = getEdges.value;
    const updatedEdges = allEdges.map(edge => ({
      ...edge,
      selected: edge.id === edgeId
    }));
    setEdges(updatedEdges);
  };

  // 节点类型注册
  const nodeTypes = ref({
    [NodeTypeEnum.USER_INPUT]: markRaw(StartNode),
    [NodeTypeEnum.END_NODE]: markRaw(EndNode),
    [NodeTypeEnum.TODO_TASK_GENERATOR]: markRaw(ProcessNode),
    [NodeTypeEnum.CONDITION_CHECKER]: markRaw(DecisionNode),
    [NodeTypeEnum.PARALLEL_EXECUTOR]: markRaw(ParallelNode),
    [NodeTypeEnum.API_CALLER]: markRaw(ApiCallerNode),
    [NodeTypeEnum.DATA_PROCESSOR]: markRaw(DataProcessorNode),
    [NodeTypeEnum.WHILE_LOOP]: markRaw(WhileLoopNode),
    [NodeTypeEnum.LLM_CALLER]: markRaw(LlmCallerNode)
  });

  // 计算属性：当前选中的节点
  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null;
    return findNode(selectedNodeId.value);
  });

  // 计算属性：当前选中的边
  const selectedEdge = computed(() => {
    if (!selectedEdgeId.value) return null;
    return findEdge(selectedEdgeId.value);
  });

  // ==================== 节点操作 ====================

  /**
   * 添加节点
   */
  async function addNodeWithCallback(
    nodeType: NodeTypeEnum,
    position: { x: number; y: number }
  ): Promise<OperationResult> {
    try {
      // 执行业务逻辑
      if (options.beforeAddNode) {
        const context: NodeOperationContext = {
          nodeType,
          position,
          allNodes: getNodes.value,
          allEdges: getEdges.value
        };
        const result = await options.beforeAddNode(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      // 创建节点，并设置为选中状态
      const newNode = createNode(nodeType, position);

      // 取消所有现有节点的选中状态
      const allNodes = getNodes.value;
      const updatedNodes = allNodes.map(node => ({
        ...node,
        selected: false
      }));
      setNodes(updatedNodes);

      // 添加新节点，并设置为选中状态
      addNodes([{ ...newNode, selected: true } as Node]);

      // 更新选中节点 ID
      selectedNodeId.value = newNode.id;

      // 静默添加，不显示成功消息（避免拖拽时消息过多）
      // 返回新节点的 ID，以便调用者可以选中它
      return { success: true, data: newNode.id };
    } catch (error: any) {
      const errorMsg = error?.message || "添加节点失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 更新节点ID（用于将前端临时ID替换为后端返回的ID）
   */
  function updateNodeIdInternal(oldId: string, newId: string): void {
    const nodes = getNodes.value;
    const edges = getEdges.value;

    // 更新节点ID
    const updatedNodes = nodes.map(node =>
      node.id === oldId ? { ...node, id: newId } : node
    );

    // 更新所有引用该节点的边
    const updatedEdges = edges.map(edge => ({
      ...edge,
      source: edge.source === oldId ? newId : edge.source,
      target: edge.target === oldId ? newId : edge.target,
      // 如果边的ID包含节点ID，也需要更新
      id: edge.id.includes(oldId) ? edge.id.replace(oldId, newId) : edge.id
    }));

    // 应用更新
    setNodes(updatedNodes);
    setEdges(updatedEdges);

    // 如果选中的节点是被更新的节点，也需要更新选中状态
    if (selectedNodeId.value === oldId) {
      selectedNodeId.value = newId;
    }
  }

  /**
   * 更新边ID（用于将前端临时ID替换为后端返回的ID）
   */
  function updateEdgeIdInternal(oldId: string, newId: string): void {
    const edges = getEdges.value;

    // 更新边ID
    const updatedEdges = edges.map(edge =>
      edge.id === oldId ? { ...edge, id: newId } : edge
    );

    // 应用更新
    setEdges(updatedEdges);

    // 如果选中的边是被更新的边，也需要更新选中状态
    if (selectedEdgeId.value === oldId) {
      selectedEdgeId.value = newId;
    }
  }

  /**
   * 更新节点
   */
  async function updateNodeWithCallback(
    nodeId: string,
    updates: Partial<Node>
  ): Promise<OperationResult> {
    try {
      // 执行业务逻辑
      if (options.beforeUpdateNode) {
        const context: NodeUpdateContext = {
          nodeId,
          currentNode: findNode(nodeId),
          updates,
          allNodes: getNodes.value,
          allEdges: getEdges.value
        };
        const result = await options.beforeUpdateNode(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      // 更新节点
      updateNode(nodeId, updates);

      // 静默更新，不显示成功消息（避免频繁修改属性时消息过多）
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "更新节点失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 删除节点
   */
  async function deleteNodeWithCallback(
    nodeId: string | string[]
  ): Promise<OperationResult> {
    try {
      const nodeIds = Array.isArray(nodeId) ? nodeId : [nodeId];
      const nodesToDelete = getNodes.value.filter(n => nodeIds.includes(n.id));
      const relatedEdges = getEdges.value.filter(
        e => nodeIds.includes(e.source) || nodeIds.includes(e.target)
      );

      // 执行业务逻辑
      if (options.beforeDeleteNode) {
        const context: NodeDeleteContext = {
          nodeId,
          nodesToDelete,
          relatedEdges,
          allNodes: getNodes.value,
          allEdges: getEdges.value
        };
        const result = await options.beforeDeleteNode(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      // 删除节点
      removeNodes(nodeIds);

      // 清除选中状态
      if (selectedNodeId.value && nodeIds.includes(selectedNodeId.value)) {
        selectedNodeId.value = null;
      }

      ElMessage.success(`成功删除 ${nodeIds.length} 个节点`);
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "删除节点失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 批量删除节点
   */
  async function batchDeleteNodesWithCallback(
    nodeIds: string[]
  ): Promise<OperationResult> {
    return deleteNodeWithCallback(nodeIds);
  }

  /**
   * 克隆节点
   */
  async function cloneNodeWithCallback(node: Node): Promise<OperationResult> {
    try {
      const newPosition = {
        x: node.position.x + 50,
        y: node.position.y + 50
      };

      // 执行业务逻辑
      if (options.beforeCloneNode) {
        const context: NodeCloneContext = {
          sourceNode: node,
          newPosition,
          allNodes: getNodes.value,
          allEdges: getEdges.value
        };
        const result = await options.beforeCloneNode(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      // 克隆节点
      const newNode: Node = {
        ...node,
        id: `${node.type}-${Date.now()}`,
        position: newPosition
      };
      addNodes([newNode]);

      ElMessage.success("节点克隆成功");
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "克隆节点失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // ==================== 连线操作 ====================

  /**
   * 添加连线
   */
  async function addEdgeWithCallback(
    connection: Connection
  ): Promise<OperationResult> {
    try {
      const sourceNode = findNode(connection.source);
      const targetNode = findNode(connection.target);

      // 执行业务逻辑
      if (options.beforeAddEdge) {
        const context: EdgeAddContext = {
          connection,
          sourceNode,
          targetNode,
          allNodes: getNodes.value,
          allEdges: getEdges.value
        };
        const result = await options.beforeAddEdge(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      // 添加连线
      addEdges([connection]);

      ElMessage.success("连接创建成功");
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "创建连接失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 更新连线
   */
  async function updateEdgeWithCallback(
    edgeId: string,
    updates: Partial<Edge>
  ): Promise<OperationResult> {
    try {
      const currentEdge = findEdge(edgeId);

      // 执行业务逻辑
      if (options.beforeUpdateEdge) {
        const context: EdgeUpdateContext = {
          edgeId,
          currentEdge,
          updates,
          allNodes: getNodes.value,
          allEdges: getEdges.value
        };
        const result = await options.beforeUpdateEdge(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      // 更新连线
      const edges = getEdges.value;
      const targetEdge = edges.find(e => e.id === edgeId);
      if (!targetEdge) {
        throw new Error("连接不存在");
      }

      Object.assign(targetEdge, updates);
      setEdges(edges);

      // 静默更新，不显示成功消息
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "更新连接失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 删除连线
   */
  async function deleteEdgeWithCallback(
    edgeId: string | string[]
  ): Promise<OperationResult> {
    try {
      const edgeIds = Array.isArray(edgeId) ? edgeId : [edgeId];
      const edgesToDelete = getEdges.value.filter(e => edgeIds.includes(e.id));

      // 执行业务逻辑
      if (options.beforeDeleteEdge) {
        const context: EdgeDeleteContext = {
          edgeId,
          edgesToDelete,
          allNodes: getNodes.value,
          allEdges: getEdges.value
        };
        const result = await options.beforeDeleteEdge(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      // 删除连线
      removeEdges(edgeIds);

      ElMessage.success(`成功删除 ${edgeIds.length} 条连接`);
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "删除连接失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // ==================== 批量操作 ====================

  /**
   * 全选节点
   */
  async function selectAllNodesWithCallback(): Promise<OperationResult> {
    try {
      const allNodes = getNodes.value;
      const selectedNodes = allNodes.filter(n => n.selected);

      // 执行业务逻辑
      if (options.beforeSelectAll) {
        const context: SelectAllContext = {
          allNodes,
          selectedNodes
        };
        const result = await options.beforeSelectAll(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      // 全选所有节点
      const updatedNodes = allNodes.map(node => ({
        ...node,
        selected: true
      }));
      setNodes(updatedNodes);

      ElMessage.success(`已选中 ${allNodes.length} 个节点`);
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "全选失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 清空画布
   */
  async function clearCanvasWithCallback(
    silent: boolean = false
  ): Promise<OperationResult> {
    try {
      const allNodes = getNodes.value;
      const allEdges = getEdges.value;

      // 执行业务逻辑
      if (options.beforeClearCanvas) {
        const context: ClearCanvasContext = {
          allNodes,
          allEdges,
          nodeCount: allNodes.length,
          edgeCount: allEdges.length
        };
        const result = await options.beforeClearCanvas(context);
        if (!result.success) {
          if (!silent) {
            ElMessage.error(result.error || "操作被取消");
          }
          return result;
        }
      }

      // 清空所有节点和连线
      setNodes([]);
      setEdges([]);
      selectedNodeId.value = null;

      if (!silent) {
        ElMessage.success("画布已清空");
      }
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "清空画布失败";
      if (!silent) {
        ElMessage.error(errorMsg);
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 导入数据
   */
  async function importDataWithCallback(
    data: { nodes: Node[]; edges: Edge[] },
    silent: boolean = false
  ): Promise<OperationResult> {
    try {
      const currentNodes = getNodes.value;
      const currentEdges = getEdges.value;

      // 执行业务逻辑
      if (options.beforeImportData) {
        const context: ImportDataContext = {
          newNodes: data.nodes,
          newEdges: data.edges,
          currentNodes,
          currentEdges
        };
        const result = await options.beforeImportData(context);
        if (!result.success) {
          if (!silent) {
            ElMessage.error(result.error || "操作被取消");
          }
          return result;
        }
      }

      // 导入数据
      setNodes(data.nodes);
      setEdges(data.edges);

      // 调用节点加载完成回调
      if (options.onNodesLoaded) {
        await options.onNodesLoaded();
      }

      if (!silent) {
        ElMessage.success(
          `成功导入 ${data.nodes.length} 个节点和 ${data.edges.length} 条连接`
        );
      }
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "导入数据失败";
      if (!silent) {
        ElMessage.error(errorMsg);
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * 导出数据
   */
  async function exportDataWithCallback(): Promise<OperationResult> {
    try {
      const nodes = getNodes.value;
      const edges = getEdges.value;

      // 执行业务逻辑
      if (options.beforeExportData) {
        const context: ExportDataContext = {
          nodes,
          edges,
          nodeCount: nodes.length,
          edgeCount: edges.length
        };
        const result = await options.beforeExportData(context);
        if (!result.success) {
          ElMessage.error(result.error || "操作被取消");
          return result;
        }
      }

      ElMessage.success("数据导出成功");
      return { success: true };
    } catch (error: any) {
      const errorMsg = error?.message || "导出数据失败";
      ElMessage.error(errorMsg);
      return { success: false, error: errorMsg };
    }
  }

  // ==================== 查询方法 ====================

  /**
   * 获取所有节点
   */
  function getAllNodes(): Node[] {
    return getNodes.value;
  }

  /**
   * 获取所有连线
   */
  function getAllEdges(): Edge[] {
    return getEdges.value;
  }

  /**
   * 根据类型获取节点
   */
  function getNodesByType(type: NodeTypeEnum): Node[] {
    return getNodes.value.filter(node => node.type === type);
  }

  /**
   * 根据ID查找节点
   */
  function getNodeById(nodeId: string): Node | undefined {
    return findNode(nodeId);
  }

  /**
   * 根据ID查找连线
   */
  function getEdgeById(edgeId: string): Edge | undefined {
    return findEdge(edgeId);
  }

  /**
   * 获取节点的所有连线
   */
  function getNodeEdges(nodeId: string): {
    incoming: Edge[];
    outgoing: Edge[];
  } {
    const edges = getEdges.value;
    return {
      incoming: edges.filter(e => e.target === nodeId),
      outgoing: edges.filter(e => e.source === nodeId)
    };
  }

  /**
   * 选中节点
   */
  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId;
  }

  // ==================== 返回值 ====================

  return {
    // 状态
    selectedNodeId,
    selectedNode,
    selectedEdgeId,
    selectedEdge,
    nodeTypes,
    nodes: getNodes,
    edges: getEdges,

    // 节点操作
    addNode: addNodeWithCallback,
    updateNode: updateNodeWithCallback,
    updateNodeId: updateNodeIdInternal,
    deleteNode: deleteNodeWithCallback,
    batchDeleteNodes: batchDeleteNodesWithCallback,
    cloneNode: cloneNodeWithCallback,

    // 连线操作
    addEdge: addEdgeWithCallback,
    updateEdge: updateEdgeWithCallback,
    updateEdgeId: updateEdgeIdInternal,
    deleteEdge: deleteEdgeWithCallback,

    // 批量操作
    selectAllNodes: selectAllNodesWithCallback,
    clearCanvas: clearCanvasWithCallback,
    importData: importDataWithCallback,
    exportData: exportDataWithCallback,

    // 查询方法
    getAllNodes,
    getAllEdges,
    getNodesByType,
    getNodeById,
    getEdgeById,
    getNodeEdges,
    selectNode,

    // VueFlow 方法
    fitView,
    zoomIn,
    zoomOut,
    zoomTo,
    setTransform,
    getViewport,
    screenToFlowCoordinate,
    project,
    setSelectedNodeId,
    setSelectedEdgeId
  };
}
