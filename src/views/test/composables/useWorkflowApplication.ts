/**
 * Workflow Application 业务逻辑 Composable (V3 - 最终架构)
 *
 * 最终架构：前端直接调用 Node 和 Edge 的 CRUD API
 *
 * 核心原则：
 * 1. 前端维护完整的图结构（nodes + edges）
 * 2. 后端分别存储 nodes 和 edges 到独立的表
 * 3. 前端直接调用 Node 和 Edge 的 CRUD API
 * 4. 加载时分别获取 nodes 和 edges
 * 5. 保存时分别同步 nodes 和 edges
 * 6. 后端可以基于 nodes 和 edges 表执行工作流
 */

import { ref, computed, nextTick, type Ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { Node, Edge } from "@vue-flow/core";
import {
  getWorkflowApplicationListWithPagination,
  getWorkflowApplication,
  createWorkflowApplication,
  updateWorkflowApplication,
  deleteWorkflowApplication,
  cloneWorkflowApplication,
  getWorkflowNodesByApplicationId,
  createWorkflowNode,
  updateWorkflowNode,
  deleteWorkflowNode,
  getWorkflowEdgesByApplicationId,
  createWorkflowEdge,
  updateWorkflowEdge,
  deleteWorkflowEdge
} from "qc-admin-api-common/workflow";
import type {
  WorkflowApplicationResponse,
  CreateWorkflowApplicationRequest,
  UpdateWorkflowApplicationRequest,
  WorkflowNodeResponse,
  WorkflowEdgeResponse
} from "qc-admin-api-common/workflow";
import { useWorkflow } from "./useWorkflow";
import { NodeTypeEnum } from "../components/types";

/**
 * 将 WorkflowNodeResponse 转换为 Vue Flow Node
 */
function convertNodeResponseToVueFlowNode(node: WorkflowNodeResponse): Node {
  return {
    id: node.id, // 直接使用后端数据库 ID
    type: node.type,
    position: {
      x: node.positionX || 0,
      y: node.positionY || 0
    },
    data: {
      label: node.name,
      description: node.description,
      config: node.config,
      prompt: node.prompt,
      processorLanguage: node.processorLanguage,
      processorCode: node.processorCode,
      apiConfig: node.apiConfig,
      parallelConfig: node.parallelConfig,
      branchNodes: node.branchNodes, // 直接使用 branchNodes
      async: node.async,
      timeout: node.timeout,
      retryCount: node.retryCount,
      color: node.color
    }
  };
}

/**
 * 将 WorkflowEdgeResponse 转换为 Vue Flow Edge
 */
function convertEdgeResponseToVueFlowEdge(edge: WorkflowEdgeResponse): Edge {
  // 从 data 中恢复 Vue Flow 的视觉类型，如果没有则使用默认值
  const vueFlowType = edge.data?.vueFlowType || "smoothstep";

  return {
    id: edge.id, // 直接使用后端数据库 ID
    source: edge.source, // 后端返回的是数据库 ID
    target: edge.target, // 后端返回的是数据库 ID
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: vueFlowType, // 使用 Vue Flow 的视觉类型
    label: edge.label,
    animated: edge.animated,
    style: edge.style,
    data: {
      branchName: edge.branchName,
      ...edge.data,
      // 保存后端业务类型
      backendType: edge.type
    }
  };
}

/**
 * Workflow Application Composable
 */
export function useWorkflowApplication(vueFlowId: string = "workflow-canvas") {
  // 临时存储待恢复的视口配置
  let pendingViewportConfig: { x: number; y: number; zoom: number } | null =
    null;

  // 使用 workflow composable
  const workflow = useWorkflow({
    vueFlowId,
    // 节点加载完成后的回调
    onNodesLoaded: async () => {
      if (pendingViewportConfig) {
        debugLog(
          "应用加载",
          "节点加载完成，恢复视口配置...",
          pendingViewportConfig
        );

        const beforeViewport = workflow.getViewport();
        debugLog("应用加载", "设置前的视口状态", beforeViewport);

        workflow.setTransform({
          x: pendingViewportConfig.x,
          y: pendingViewportConfig.y,
          zoom: pendingViewportConfig.zoom
        });

        // 等待一帧确保 setTransform 生效
        await nextTick();

        const afterViewport = workflow.getViewport();
        debugLog("应用加载", "设置后的视口状态", afterViewport);
        debugLog("应用加载", "✅ 视口配置已恢复");

        // 保存初始视口状态
        snapshot.value.viewport = workflow.getViewport();
        debugLog("应用加载", "✅ 保存初始视口状态", snapshot.value.viewport);

        // 清除待恢复的配置
        pendingViewportConfig = null;
      } else {
        // 如果没有待恢复的视口配置，自动适应画布
        workflow.fitView({ padding: 0.2, duration: 300 });
        debugLog("应用加载", "✅ 自动适应画布");

        // 保存初始视口状态
        await nextTick();
        snapshot.value.viewport = workflow.getViewport();
        debugLog("应用加载", "✅ 保存初始视口状态", snapshot.value.viewport);
      }
    }
  });

  // 状态管理
  const applications = ref<WorkflowApplicationResponse[]>([]);
  const currentApplication = ref<WorkflowApplicationResponse | null>(null);
  const loading = ref(false);
  const saving = ref(false);

  // 实时模式状态
  const realtimeMode = ref(false);
  const realtimeTimer: Ref<ReturnType<typeof setInterval> | null> = ref(null);

  // Snapshot：保存加载时的节点和边状态，用于 diff
  const snapshot = ref<{
    nodes: Map<string, Node>;
    edges: Map<string, Edge>;
    nodeHashes: Map<string, string>; // 节点业务数据的 hash
    edgeHashes: Map<string, string>; // 边业务数据的 hash
    viewport?: { x: number; y: number; zoom: number }; // 初始视口状态
  }>({
    nodes: new Map(),
    edges: new Map(),
    nodeHashes: new Map(),
    edgeHashes: new Map(),
    viewport: undefined
  });

  /**
   * 简单的字符串 hash 函数（使用 djb2 算法）
   */
  const hashString = (str: string): string => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
  };

  /**
   * 从 node.data.branchNodes 和 edges 计算完整的 branchNodes（包含 targetNodeId）
   * 用于条件节点（condition_checker）
   * @param node 节点对象
   * @param nodeIdMapping 节点ID映射表（临时ID -> 数据库ID）
   */
  const calculateBranchNodesFromNode = (
    node: Node,
    nodeIdMapping?: Map<string, string>
  ): Record<string, any> | undefined => {
    // 从 node.data.branchNodes 读取分支配置
    const branchNodes = node.data.branchNodes;
    if (!branchNodes || Object.keys(branchNodes).length === 0) return undefined;

    const edges = workflow.getAllEdges();
    const result: Record<string, any> = {};

    // 遍历每个分支配置
    Object.entries(branchNodes).forEach(
      ([branchName, branchConfig]: [string, any]) => {
        // 查找对应的 edge 获取 targetNodeId
        const expectedSourceHandle = `${node.id}-branch-${branchName}`;
        const edge = edges.find(
          e => e.source === node.id && e.sourceHandle === expectedSourceHandle
        );

        let targetNodeId: string | undefined;
        if (edge) {
          // 如果有映射表，使用映射后的ID；否则直接使用target
          let targetId = edge.target;
          if (nodeIdMapping && nodeIdMapping.has(edge.target)) {
            targetId = nodeIdMapping.get(edge.target)!;
          }
          // 后端返回的 ID 永远是 string，直接使用
          targetNodeId = targetId;
        }

        // 构建完整的分支配置（保留原有配置，更新 targetNodeId）
        result[branchName] = {
          name: branchConfig.name,
          condition: branchConfig.condition || "",
          handlerId: branchConfig.handlerId,
          targetNodeId
        };
      }
    );

    return Object.keys(result).length > 0 ? result : undefined;
  };

  /**
   * 计算节点业务数据的 hash
   * 只包含需要保存到后端的业务属性
   * 注意：
   * - branches 会被转换为 branchNodes 保存到后端
   * - parallelChildren 不保存（只用于 UI 显示）
   */
  const getNodeHash = (node: Node): string => {
    // 对于条件节点，从 branches 和 edges 计算 branchNodes
    let branchNodes: Record<string, any> | undefined;
    if (node.type === NodeTypeEnum.CONDITION_CHECKER) {
      branchNodes = calculateBranchNodesFromNode(node);
    }

    const businessData = {
      position: { x: node.position.x, y: node.position.y },
      type: node.type,
      data: {
        label: node.data.label,
        description: node.data.description,
        config: node.data.config,
        prompt: node.data.prompt,
        processorLanguage: node.data.processorLanguage,
        processorCode: node.data.processorCode,
        apiConfig: node.data.apiConfig,
        parallelConfig: node.data.parallelConfig,
        branchNodes, // 从 branches 和 edges 计算得出
        async: node.data.async,
        timeout: node.data.timeout,
        retryCount: node.data.retryCount,
        color: node.data.color
      }
    };
    return hashString(JSON.stringify(businessData));
  };

  /**
   * 计算边业务数据的 hash
   * 只包含需要保存到后端的业务属性
   */
  const getEdgeHash = (edge: Edge): string => {
    const businessData = {
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
      type: edge.type,
      label: edge.label,
      animated: edge.animated,
      style: edge.style,
      data: edge.data
    };
    return hashString(JSON.stringify(businessData));
  };

  /**
   * 计算节点字段级别的变化
   * 返回实际变更的字段（用于日志和优化）
   */
  const getNodeFieldChanges = (
    currentNode: Node,
    snapshotNode: Node
  ): {
    changedFields: string[];
    changes: Partial<Node>;
  } | null => {
    const changes: any = {};
    const changedFields: string[] = [];
    let hasChanges = false;

    // 比较位置
    if (
      currentNode.position.x !== snapshotNode.position.x ||
      currentNode.position.y !== snapshotNode.position.y
    ) {
      changes.position = currentNode.position;
      changedFields.push("position");
      hasChanges = true;
    }

    // 比较类型
    if (currentNode.type !== snapshotNode.type) {
      changes.type = currentNode.type;
      changedFields.push("type");
      hasChanges = true;
    }

    // 比较 data 中的各个字段
    const dataChanges: any = {};
    let hasDataChanges = false;

    const dataFields = [
      "label",
      "description",
      "config",
      "prompt",
      "processorLanguage",
      "processorCode",
      "apiConfig",
      "parallelConfig",
      "async",
      "timeout",
      "retryCount",
      "color"
    ];

    for (const field of dataFields) {
      const currentValue = currentNode.data[field];
      const snapshotValue = snapshotNode.data[field];

      // 使用 JSON 序列化比较复杂对象
      if (JSON.stringify(currentValue) !== JSON.stringify(snapshotValue)) {
        dataChanges[field] = currentValue;
        changedFields.push(`data.${field}`);
        hasDataChanges = true;
      }
    }

    // 特殊处理 branchNodes（从 branches 和 edges 计算）
    if (currentNode.type === NodeTypeEnum.CONDITION_CHECKER) {
      const currentBranchNodes = calculateBranchNodesFromNode(currentNode);
      const snapshotBranchNodes = snapshotNode.data.branchNodes;

      if (
        JSON.stringify(currentBranchNodes) !==
        JSON.stringify(snapshotBranchNodes)
      ) {
        dataChanges.branchNodes = currentBranchNodes;
        changedFields.push("data.branchNodes");
        hasDataChanges = true;
      }
    }

    if (hasDataChanges) {
      changes.data = dataChanges;
      hasChanges = true;
    }

    return hasChanges ? { changedFields, changes } : null;
  };

  /**
   * 计算边字段级别的变化
   * 返回实际变更的字段（用于 UpdateWorkflowEdgeRequest）
   */
  const getEdgeFieldChanges = (
    currentEdge: Edge,
    snapshotEdge: Edge
  ): {
    changedFields: string[];
    changes: Partial<{
      edgeKey: string;
      sourceHandle: string;
      targetHandle: string;
      type: "default" | "branch" | "parallel";
      label: string;
      branchName: string;
      animated: boolean;
      style: Record<string, any>;
      data: Record<string, any>;
    }>;
  } | null => {
    const changes: any = {};
    const changedFields: string[] = [];
    let hasChanges = false;

    // 比较各个字段
    if (currentEdge.id !== snapshotEdge.id) {
      changes.edgeKey = currentEdge.id;
      changedFields.push("edgeKey");
      hasChanges = true;
    }

    if (currentEdge.sourceHandle !== snapshotEdge.sourceHandle) {
      changes.sourceHandle = currentEdge.sourceHandle;
      changedFields.push("sourceHandle");
      hasChanges = true;
    }

    if (currentEdge.targetHandle !== snapshotEdge.targetHandle) {
      changes.targetHandle = currentEdge.targetHandle;
      changedFields.push("targetHandle");
      hasChanges = true;
    }

    // 计算后端类型
    let currentBackendType: "default" | "branch" | "parallel" = "default";
    if (currentEdge.data?.isParallelChild) {
      currentBackendType = "parallel";
    } else if (currentEdge.data?.branchName) {
      currentBackendType = "branch";
    }

    let snapshotBackendType: "default" | "branch" | "parallel" = "default";
    if (snapshotEdge.data?.isParallelChild) {
      snapshotBackendType = "parallel";
    } else if (snapshotEdge.data?.branchName) {
      snapshotBackendType = "branch";
    }

    if (currentBackendType !== snapshotBackendType) {
      changes.type = currentBackendType;
      changedFields.push("type");
      hasChanges = true;
    }

    if (currentEdge.label !== snapshotEdge.label) {
      changes.label = currentEdge.label as string;
      changedFields.push("label");
      hasChanges = true;
    }

    if (currentEdge.data?.branchName !== snapshotEdge.data?.branchName) {
      changes.branchName = currentEdge.data?.branchName;
      changedFields.push("branchName");
      hasChanges = true;
    }

    if (currentEdge.animated !== snapshotEdge.animated) {
      changes.animated = currentEdge.animated;
      changedFields.push("animated");
      hasChanges = true;
    }

    if (
      JSON.stringify(currentEdge.style) !== JSON.stringify(snapshotEdge.style)
    ) {
      changes.style = currentEdge.style;
      changedFields.push("style");
      hasChanges = true;
    }

    // 比较 Vue Flow 的边类型（存储在 data.vueFlowType 中）
    const currentVueFlowType = currentEdge.type;
    const snapshotVueFlowType = snapshotEdge.type;

    if (currentVueFlowType !== snapshotVueFlowType) {
      // Vue Flow 类型变化，需要更新 data
      changes.data = {
        ...currentEdge.data,
        vueFlowType: currentEdge.type
      };
      changedFields.push("data.vueFlowType");
      hasChanges = true;
    } else if (
      JSON.stringify(currentEdge.data) !== JSON.stringify(snapshotEdge.data)
    ) {
      // 其他 data 字段变化
      changes.data = {
        ...currentEdge.data,
        vueFlowType: currentEdge.type
      };
      changedFields.push("data");
      hasChanges = true;
    }

    return hasChanges ? { changedFields, changes } : null;
  };

  // 计算属性
  const hasUnsavedChanges = computed(() => {
    // 如果没有加载应用，则没有未保存的更改
    if (!currentApplication.value) {
      return false;
    }

    // 获取当前画布上的节点和边
    const currentNodes = workflow.getAllNodes();
    const currentEdges = workflow.getAllEdges();

    // 检查节点数量是否变化
    if (currentNodes.length !== snapshot.value.nodeHashes.size) {
      return true;
    }

    // 检查边数量是否变化
    if (currentEdges.length !== snapshot.value.edgeHashes.size) {
      return true;
    }

    // 检查每个节点是否有变化（使用 hash 比较）
    for (const node of currentNodes) {
      const snapshotHash = snapshot.value.nodeHashes.get(node.id);
      if (!snapshotHash) {
        // 新增的节点
        return true;
      }
      // 计算当前节点的 hash 并与 snapshot 比较
      const currentHash = getNodeHash(node);
      if (currentHash !== snapshotHash) {
        return true;
      }
    }

    // 检查是否有节点被删除
    for (const [id] of snapshot.value.nodeHashes) {
      if (!currentNodes.find(n => n.id === id)) {
        return true;
      }
    }

    // 检查每条边是否有变化（使用 hash 比较）
    for (const edge of currentEdges) {
      const snapshotHash = snapshot.value.edgeHashes.get(edge.id);
      if (!snapshotHash) {
        // 新增的边
        return true;
      }
      // 计算当前边的 hash 并与 snapshot 比较
      const currentHash = getEdgeHash(edge);
      if (currentHash !== snapshotHash) {
        return true;
      }
    }

    // 检查是否有边被删除
    for (const [id] of snapshot.value.edgeHashes) {
      if (!currentEdges.find(e => e.id === id)) {
        return true;
      }
    }

    // 所有检查都通过，没有未保存的更改
    return false;
  });

  /**
   * 判断 ID 是否为数据库 ID（纯数字字符串）
   */
  const isDatabaseId = (id: string): boolean => {
    return /^\d+$/.test(id);
  };

  /**
   * Debug 日志工具
   */
  const DEBUG_ENABLED = !!import.meta.env.DEV;

  function debugLog(category: string, message: string, data?: any) {
    if (!DEBUG_ENABLED) return;

    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${category}]`;

    if (data !== undefined) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  function debugGroup(category: string, title: string, fn: () => void) {
    if (!DEBUG_ENABLED) return fn();

    const timestamp = new Date().toLocaleTimeString();
    console.group(`[${timestamp}] [${category}] ${title}`);
    fn();
    console.groupEnd();
  }

  /**
   * 加载应用列表（支持分页）
   */
  const loadApplications = async (params?: {
    page?: number;
    pageSize?: number;
  }) => {
    try {
      loading.value = true;
      const result = await getWorkflowApplicationListWithPagination(params);
      if (result.success) {
        applications.value = result.data;
        return result.pagination;
      } else {
        ElMessage.error("加载应用列表失败");
        return null;
      }
    } catch (error: any) {
      ElMessage.error(error.message || "加载应用列表失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  /**
   * 加载指定应用及其工作流图
   */
  const loadApplication = async (applicationId: string) => {
    try {
      loading.value = true;
      debugGroup("应用加载", `加载应用 ${applicationId}`, () => {
        debugLog("应用加载", "开始加载应用信息...");
      });

      // 1. 加载应用信息
      const appResult = await getWorkflowApplication(applicationId);
      if (!appResult.success) {
        debugLog("应用加载", "❌ 加载应用失败");
        ElMessage.error("加载应用失败");
        return;
      }

      // 暂存应用数据，稍后再设置到 currentApplication
      const appData = appResult.data;
      debugLog("应用加载", "✅ 应用信息加载成功", {
        应用名称: appData.name,
        应用ID: appData.id
      });

      // 2. 加载节点
      debugLog("应用加载", "开始加载节点...");
      const nodesResult = await getWorkflowNodesByApplicationId(applicationId);
      if (!nodesResult.success) {
        debugLog("应用加载", "❌ 加载节点失败");
        ElMessage.error("加载节点失败");
        return;
      }

      const nodes: Node[] = nodesResult.data.map(
        convertNodeResponseToVueFlowNode
      );
      debugLog("应用加载", `✅ 加载了 ${nodes.length} 个节点`);

      // 3. 加载边
      debugLog("应用加载", "开始加载边...");
      const edgesResult = await getWorkflowEdgesByApplicationId(applicationId);
      if (!edgesResult.success) {
        debugLog("应用加载", "❌ 加载边失败");
        ElMessage.error("加载边失败");
        return;
      }

      const edges: Edge[] = edgesResult.data.map(
        convertEdgeResponseToVueFlowEdge
      );
      debugLog("应用加载", `✅ 加载了 ${edges.length} 条边`);

      // 4. 清空并重新加载画布
      workflow.clearCanvas(true);

      // 5. 设置待恢复的视口配置（在 onNodesLoaded 回调中恢复）
      if (appData.viewportConfig) {
        pendingViewportConfig = appData.viewportConfig;
        debugLog("应用加载", "设置待恢复的视口配置", pendingViewportConfig);
      }

      // 6. 导入数据到画布（会触发 onNodesLoaded 回调）
      workflow.importData(
        {
          nodes,
          edges
        },
        true
      );

      // 7. 等待 Vue Flow 完成数据导入和内部处理
      // 使用 nextTick 确保 DOM 更新完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 这样可以确保 snapshot 和画布上的数据完全一致
      const actualNodes = workflow.getAllNodes();
      const actualEdges = workflow.getAllEdges();

      // 保存节点数据和 hash
      snapshot.value.nodes = new Map(
        actualNodes.map(n => [n.id, JSON.parse(JSON.stringify(n))])
      );
      snapshot.value.nodeHashes = new Map(
        actualNodes.map(n => [n.id, getNodeHash(n)])
      );

      // 保存边数据和 hash
      snapshot.value.edges = new Map(
        actualEdges.map(e => [e.id, JSON.parse(JSON.stringify(e))])
      );
      snapshot.value.edgeHashes = new Map(
        actualEdges.map(e => [e.id, getEdgeHash(e)])
      );
      debugLog(
        "应用加载",
        `✅ 创建 snapshot: ${snapshot.value.nodes.size} 个节点, ${snapshot.value.edges.size} 条边`
      );

      debugLog("应用加载", "✅ 数据导入完成");

      // 8. 设置当前应用
      currentApplication.value = appData;

      debugLog("应用加载", "✅ 应用加载完成");
    } catch (error: any) {
      debugLog("应用加载", "❌ 加载过程出错", error);
      ElMessage.error(error.message || "加载应用失败");
    } finally {
      loading.value = false;
    }
  };

  /**
   * 创建新应用
   */
  const createApplication = async (data: CreateWorkflowApplicationRequest) => {
    try {
      saving.value = true;
      const result = await createWorkflowApplication(data);
      if (result.success) {
        await loadApplications();
        return result.data;
      } else {
        ElMessage.error("创建应用失败");
        return null;
      }
    } catch (error: any) {
      ElMessage.error(error.message || "创建应用失败");
      return null;
    } finally {
      saving.value = false;
    }
  };

  /**
   * 更新应用信息（不包括工作流图）
   */
  const updateApplicationInfo = async (
    applicationId: string,
    data: UpdateWorkflowApplicationRequest
  ) => {
    try {
      saving.value = true;
      const result = await updateWorkflowApplication(applicationId, data);
      if (result.success) {
        if (currentApplication.value?.id === applicationId) {
          currentApplication.value = result.data;
        }
        return result.data;
      } else {
        ElMessage.error("更新应用信息失败");
        return null;
      }
    } catch (error: any) {
      ElMessage.error(error.message || "更新应用信息失败");
      return null;
    } finally {
      saving.value = false;
    }
  };

  /**
   * 保存当前工作流（核心方法 - 使用 Node 和 Edge API）
   */
  const saveWorkflow = async () => {
    if (!currentApplication.value) {
      ElMessage.error("请先选择或创建一个应用");
      return false;
    }

    debugGroup("工作流保存", "开始保存工作流", () => {
      debugLog("工作流保存", `应用ID: ${currentApplication.value?.id}`);
      debugLog("工作流保存", `应用名称: ${currentApplication.value?.name}`);
    });

    try {
      saving.value = true;
      const applicationId = currentApplication.value.id;

      // 获取当前所有节点和边
      const currentNodes = workflow.getAllNodes();
      const currentEdges = workflow.getAllEdges();

      debugLog(
        "工作流保存",
        `当前画布状态: ${currentNodes.length} 个节点, ${currentEdges.length} 条边`
      );

      // Diff 节点：找出新增、修改、删除的节点
      debugLog("工作流保存", "开始 diff 节点...");
      const currentNodeMap = new Map(currentNodes.map(n => [n.id, n]));
      const nodesToCreate: Node[] = [];
      const nodesToUpdate: Node[] = [];
      const nodeIdsToDelete: string[] = [];

      // 统计信息
      const stats = {
        nodesCreated: 0,
        nodesUpdated: 0,
        nodesDeleted: 0,
        edgesCreated: 0,
        edgesUpdated: 0,
        edgesDeleted: 0,
        totalFieldsChanged: 0
      };

      // 找出新增和修改的节点（使用 hash 比较）
      for (const node of currentNodes) {
        // 首先检查 ID 格式：如果不是数据库 ID（纯数字），则一定是新节点
        if (!isDatabaseId(node.id)) {
          nodesToCreate.push(node);
          debugLog("工作流保存", `节点 ${node.id} 是新增节点（临时ID）`);
          continue;
        }

        // 对于数据库 ID，检查 snapshot
        const snapshotHash = snapshot.value.nodeHashes.get(node.id);
        if (!snapshotHash) {
          // 新增的节点（不在 snapshot 中）
          nodesToCreate.push(node);
          debugLog("工作流保存", `节点 ${node.id} 是新增节点`);
        } else {
          // 计算当前节点的 hash 并与 snapshot 比较
          const currentHash = getNodeHash(node);
          if (currentHash !== snapshotHash) {
            nodesToUpdate.push(node);
            debugLog(
              "工作流保存",
              `节点 ${node.id} 有变化 (hash: ${snapshotHash} -> ${currentHash})`
            );
          }
        }
      }

      // 找出删除的节点
      for (const [id] of snapshot.value.nodeHashes) {
        if (!currentNodeMap.has(id)) {
          nodeIdsToDelete.push(id);
          debugLog("工作流保存", `节点 ${id} 已被删除`);
        }
      }

      debugLog(
        "工作流保存",
        `节点 diff 结果: 新增 ${nodesToCreate.length}, 修改 ${nodesToUpdate.length}, 删除 ${nodeIdsToDelete.length}`
      );

      // 创建新节点（第一阶段：不包含 branchNodes）
      const nodeIdMapping = new Map<string, string>(); // 临时 ID -> 数据库 ID
      for (const node of nodesToCreate) {
        const nodeData = {
          name: node.data.label || node.id,
          nodeKey: node.id,
          type: node.type as any,
          description: node.data.description || "",
          config: node.data.config || {},
          applicationId,
          positionX: node.position.x,
          positionY: node.position.y,
          prompt: node.data.prompt,
          processorLanguage: node.data.processorLanguage,
          processorCode: node.data.processorCode,
          apiConfig: node.data.apiConfig,
          parallelConfig: node.data.parallelConfig,
          // 注意：branchNodes 将在所有节点创建完成后更新
          // 注意：不保存 parallelChildren，关系通过 parent_node_id 管理
          async: node.data.async,
          timeout: node.data.timeout,
          retryCount: node.data.retryCount,
          color: node.data.color
        };

        const result = await createWorkflowNode(nodeData);
        if (result.success) {
          nodeIdMapping.set(node.id, result.data.id);
          stats.nodesCreated++;
          debugLog(
            "工作流保存",
            `✅ 创建节点: ${node.id} -> ${result.data.id}`
          );
        }
      }

      // 更新修改的节点
      for (const node of nodesToUpdate) {
        const snapshotNode = snapshot.value.nodes.get(node.id);

        // 计算字段级别的变化（用于日志记录和优化）
        let changedFieldsList: string[] = [];
        if (snapshotNode) {
          const fieldChangesInfo = getNodeFieldChanges(node, snapshotNode);
          if (fieldChangesInfo) {
            changedFieldsList = fieldChangesInfo.changedFields;
            stats.totalFieldsChanged += changedFieldsList.length;
            debugLog(
              "工作流保存",
              `节点 ${node.id} 的变更字段: ${changedFieldsList.join(", ")}`
            );
          }
        }

        // 构建更新数据：只包含变更的字段
        const nodeData: any = {
          applicationId // 应用 ID（前端需要，但后端不需要）
        };

        // 只添加变更的字段
        if (changedFieldsList.includes("data.label")) {
          nodeData.name = node.data.label || node.id;
        }

        if (changedFieldsList.includes("position")) {
          nodeData.positionX = node.position.x;
          nodeData.positionY = node.position.y;
        }

        if (changedFieldsList.includes("data.description")) {
          nodeData.description = node.data.description || "";
        }

        if (changedFieldsList.includes("data.config")) {
          nodeData.config = node.data.config || {};
        }

        if (changedFieldsList.includes("data.prompt")) {
          nodeData.prompt = node.data.prompt;
        }

        if (changedFieldsList.includes("data.processorLanguage")) {
          nodeData.processorLanguage = node.data.processorLanguage;
        }

        if (changedFieldsList.includes("data.processorCode")) {
          nodeData.processorCode = node.data.processorCode;
        }

        if (changedFieldsList.includes("data.apiConfig")) {
          nodeData.apiConfig = node.data.apiConfig;
        }

        if (changedFieldsList.includes("data.parallelConfig")) {
          nodeData.parallelConfig = node.data.parallelConfig;
        }

        if (changedFieldsList.includes("data.async")) {
          nodeData.async = node.data.async;
        }

        if (changedFieldsList.includes("data.timeout")) {
          nodeData.timeout = node.data.timeout;
        }

        if (changedFieldsList.includes("data.retryCount")) {
          nodeData.retryCount = node.data.retryCount;
        }

        if (changedFieldsList.includes("data.color")) {
          nodeData.color = node.data.color;
        }

        // 对于条件节点，检查 branchNodes 是否变更
        if (node.type === NodeTypeEnum.CONDITION_CHECKER) {
          const branchNodes = calculateBranchNodesFromNode(node, nodeIdMapping);
          if (branchNodes && Object.keys(branchNodes).length > 0) {
            // 如果 branchNodes 有变化，或者是为了保持一致性，总是包含它
            if (
              changedFieldsList.includes("data.branchNodes") ||
              changedFieldsList.length > 0
            ) {
              nodeData.branchNodes = branchNodes;
            }
          }
        }

        await updateWorkflowNode(node.id, nodeData);
        stats.nodesUpdated++;
        debugLog("工作流保存", `✅ 更新节点: ${node.id}`);
      }

      // 删除节点
      for (const nodeId of nodeIdsToDelete) {
        await deleteWorkflowNode(nodeId);
        stats.nodesDeleted++;
        debugLog("工作流保存", `✅ 删除节点: ${nodeId}`);
      }

      debugLog("工作流保存", `✅ 节点保存完成`);

      // Diff 边：找出新增、修改、删除的边
      debugLog("工作流保存", "开始 diff 边...");
      const currentEdgeMap = new Map(currentEdges.map(e => [e.id, e]));
      const edgesToCreate: Edge[] = [];
      const edgesToUpdate: Edge[] = [];
      const edgeIdsToDelete: string[] = [];

      // 找出新增和修改的边（使用 hash 比较）
      for (const edge of currentEdges) {
        // 首先检查 ID 格式：如果不是数据库 ID（纯数字），则一定是新边
        if (!isDatabaseId(edge.id)) {
          edgesToCreate.push(edge);
          debugLog("工作流保存", `边 ${edge.id} 是新增边（临时ID）`);
          continue;
        }

        // 对于数据库 ID，检查 snapshot
        const snapshotHash = snapshot.value.edgeHashes.get(edge.id);
        if (!snapshotHash) {
          // 新增的边（不在 snapshot 中）
          edgesToCreate.push(edge);
          debugLog("工作流保存", `边 ${edge.id} 是新增边`);
        } else {
          // 计算当前边的 hash 并与 snapshot 比较
          const currentHash = getEdgeHash(edge);
          if (currentHash !== snapshotHash) {
            edgesToUpdate.push(edge);
            debugLog(
              "工作流保存",
              `边 ${edge.id} 有变化 (hash: ${snapshotHash} -> ${currentHash})`
            );
          }
        }
      }

      // 找出删除的边
      for (const [id] of snapshot.value.edgeHashes) {
        if (!currentEdgeMap.has(id)) {
          edgeIdsToDelete.push(id);
          debugLog("工作流保存", `边 ${id} 已被删除`);
        }
      }

      debugLog(
        "工作流保存",
        `边 diff 结果: 新增 ${edgesToCreate.length}, 修改 ${edgesToUpdate.length}, 删除 ${edgeIdsToDelete.length}`
      );

      // 创建新边
      for (const edge of edgesToCreate) {
        // 将 Vue Flow 的边类型映射到后端业务类型
        let backendType: "default" | "branch" | "parallel" = "default";
        if (edge.data?.isParallelChild) {
          backendType = "parallel";
        } else if (edge.data?.branchName) {
          backendType = "branch";
        }

        // 如果 source 或 target 是新创建的节点，需要映射到数据库 ID
        const sourceId = nodeIdMapping.get(edge.source) || edge.source;
        const targetId = nodeIdMapping.get(edge.target) || edge.target;

        const edgeData = {
          edgeKey: edge.id,
          applicationId,
          source: sourceId,
          target: targetId,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          type: backendType,
          label: edge.label as string,
          branchName: edge.data?.branchName,
          animated: edge.animated,
          style: edge.style,
          data: {
            ...edge.data,
            vueFlowType: edge.type
          }
        };

        const result = await createWorkflowEdge(edgeData);
        if (result.success) {
          stats.edgesCreated++;
          debugLog("工作流保存", `✅ 创建边: ${edge.id} -> ${result.data.id}`);

          // 更新边ID（将临时ID替换为数据库ID）
          workflow.updateEdgeId(edge.id, result.data.id);
          debugLog(
            "工作流保存",
            `✅ 更新边 ID: ${edge.id} -> ${result.data.id}`
          );
        }
      }

      // 更新修改的边（只提交变更的字段）
      for (const edge of edgesToUpdate) {
        const snapshotEdge = snapshot.value.edges.get(edge.id);
        if (!snapshotEdge) {
          debugLog(
            "工作流保存",
            `⚠️ 边 ${edge.id} 在 snapshot 中不存在，跳过更新`
          );
          continue;
        }

        // 计算字段级别的变化
        const fieldChangesInfo = getEdgeFieldChanges(edge, snapshotEdge);
        if (!fieldChangesInfo) {
          debugLog("工作流保存", `⚠️ 边 ${edge.id} 没有实际变化，跳过更新`);
          continue;
        }

        stats.totalFieldsChanged += fieldChangesInfo.changedFields.length;
        debugLog(
          "工作流保存",
          `边 ${edge.id} 的变更字段: ${fieldChangesInfo.changedFields.join(", ")}`
        );

        // 只提交变更的字段
        await updateWorkflowEdge(edge.id, fieldChangesInfo.changes);
        stats.edgesUpdated++;
        debugLog("工作流保存", `✅ 更新边: ${edge.id}`);
      }

      // 删除边
      for (const edgeId of edgeIdsToDelete) {
        await deleteWorkflowEdge(edgeId);
        stats.edgesDeleted++;
        debugLog("工作流保存", `✅ 删除边: ${edgeId}`);
      }

      debugLog("工作流保存", `✅ 边保存完成`);

      // 更新新创建的条件节点的 branchNodes（在所有节点和边都保存完成后）
      // 注意：已存在的条件节点在第一次更新时已经包含了 branchNodes，不需要再次更新
      debugLog("工作流保存", "开始更新新创建的条件节点的 branchNodes...");
      const newConditionNodes = nodesToCreate.filter(
        n => n.type === NodeTypeEnum.CONDITION_CHECKER
      );

      if (newConditionNodes.length > 0) {
        for (const node of newConditionNodes) {
          // 获取节点的数据库 ID（从映射表中获取）
          const actualNodeId = nodeIdMapping.get(node.id);
          if (!actualNodeId) {
            debugLog(
              "工作流保存",
              `⚠️ 节点 ${node.id} 没有找到数据库 ID，跳过 branchNodes 更新`
            );
            continue;
          }

          // 从 node.data.branches 和 edges 计算完整的 branchNodes 配置
          const branchNodes = calculateBranchNodesFromNode(node, nodeIdMapping);

          if (branchNodes && Object.keys(branchNodes).length > 0) {
            // 更新节点的 branchNodes 字段
            const nodeData = {
              name: node.data.label || node.id,
              nodeKey: node.id,
              type: node.type as any,
              description: node.data.description || "",
              config: node.data.config || {},
              applicationId,
              positionX: node.position.x,
              positionY: node.position.y,
              prompt: node.data.prompt,
              processorLanguage: node.data.processorLanguage,
              processorCode: node.data.processorCode,
              apiConfig: node.data.apiConfig,
              parallelConfig: node.data.parallelConfig,
              branchNodes, // 更新 branchNodes（完整配置）
              async: node.data.async,
              timeout: node.data.timeout,
              retryCount: node.data.retryCount,
              color: node.data.color
            };

            await updateWorkflowNode(actualNodeId, nodeData);
            debugLog(
              "工作流保存",
              `✅ 更新新创建的条件节点 ${node.id} (数据库ID: ${actualNodeId}) 的 branchNodes:`,
              branchNodes
            );
          }
        }
        debugLog("工作流保存", `✅ branchNodes 更新完成`);
      } else {
        debugLog("工作流保存", `没有新创建的条件节点需要更新 branchNodes`);
      }

      // 更新 Vue Flow 中的节点和边 ID（将临时 ID 替换为数据库 ID）
      if (nodeIdMapping.size > 0) {
        debugLog("工作流保存", "开始更新节点和边的 ID...");

        // 使用 updateNodeId 方法更新节点 ID（会自动更新相关的边）
        for (const [tempId, dbId] of nodeIdMapping) {
          workflow.updateNodeId(tempId, dbId);
          debugLog("工作流保存", `✅ 更新节点 ID: ${tempId} -> ${dbId}`);
        }

        debugLog("工作流保存", `✅ ID 更新完成`);
      }

      debugLog("工作流保存", "✅ 保存成功");

      // 保存成功后，更新 snapshot 为当前状态
      // 这样 hasUnsavedChanges 会变为 false
      const actualNodes = workflow.getAllNodes();
      const actualEdges = workflow.getAllEdges();

      // 保存节点数据和 hash
      snapshot.value.nodes = new Map(
        actualNodes.map(n => [n.id, JSON.parse(JSON.stringify(n))])
      );
      snapshot.value.nodeHashes = new Map(
        actualNodes.map(n => [n.id, getNodeHash(n)])
      );

      // 保存边数据和 hash
      snapshot.value.edges = new Map(
        actualEdges.map(e => [e.id, JSON.parse(JSON.stringify(e))])
      );
      snapshot.value.edgeHashes = new Map(
        actualEdges.map(e => [e.id, getEdgeHash(e)])
      );

      debugLog(
        "工作流保存",
        `✅ 更新 snapshot: ${snapshot.value.nodeHashes.size} 个节点, ${snapshot.value.edgeHashes.size} 条边`
      );

      // 显示详细的保存统计信息
      const statsMessage = [
        `节点: +${stats.nodesCreated} ~${stats.nodesUpdated} -${stats.nodesDeleted}`,
        `边: +${stats.edgesCreated} ~${stats.edgesUpdated} -${stats.edgesDeleted}`,
        `共更新 ${stats.totalFieldsChanged} 个字段`
      ].join(" | ");

      debugLog("工作流保存", `📊 保存统计: ${statsMessage}`);
      ElMessage.success(`保存成功 (${statsMessage})`);

      return true;
    } catch (error: any) {
      debugLog("工作流保存", "❌ 保存过程出错", error);
      ElMessage.error(error.message || "保存工作流失败");
      return false;
    } finally {
      saving.value = false;
    }
  };

  /**
   * 删除应用
   */
  const deleteApplication = async (applicationId: string) => {
    try {
      await ElMessageBox.confirm(
        "确定要删除这个应用吗？此操作不可恢复。",
        "警告",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      saving.value = true;
      const result = await deleteWorkflowApplication(applicationId);
      if (result.success) {
        if (currentApplication.value?.id === applicationId) {
          currentApplication.value = null;
          workflow.clearCanvas();
        }
        await loadApplications();
        return true;
      } else {
        ElMessage.error("删除应用失败");
        return false;
      }
    } catch (error: any) {
      if (error !== "cancel") {
        ElMessage.error(error.message || "删除应用失败");
      }
      return false;
    } finally {
      saving.value = false;
    }
  };

  /**
   * 克隆应用
   */
  const cloneApplication = async (applicationId: string) => {
    try {
      saving.value = true;
      const result = await cloneWorkflowApplication(applicationId);
      if (result.success) {
        await loadApplications();
        return result.data;
      } else {
        ElMessage.error("克隆应用失败");
        return null;
      }
    } catch (error: any) {
      ElMessage.error(error.message || "克隆应用失败");
      return null;
    } finally {
      saving.value = false;
    }
  };

  /**
   * 创建新应用并打开
   */
  const createAndOpenApplication = async (
    data: CreateWorkflowApplicationRequest
  ) => {
    const app = await createApplication(data);
    if (app) {
      await loadApplication(app.id);
    }
    return app;
  };

  /**
   * 计算当前工作流的 diff
   */
  const calculateWorkflowDiff = () => {
    const currentNodes = workflow.getAllNodes();
    const currentEdges = workflow.getAllEdges();

    const diff = {
      nodes: {
        created: [] as Node[],
        updated: [] as Node[],
        deleted: [] as string[]
      },
      edges: {
        created: [] as Edge[],
        updated: [] as Edge[],
        deleted: [] as string[]
      }
    };

    // 计算节点的 diff
    const currentNodeIds = new Set(currentNodes.map(n => n.id));
    const snapshotNodeIds = new Set(snapshot.value.nodes.keys());

    // 新增的节点
    for (const node of currentNodes) {
      if (!snapshot.value.nodes.has(node.id)) {
        diff.nodes.created.push(node);
      } else {
        // 检查是否更新
        const nodeHash = getNodeHash(node);
        const snapshotHash = snapshot.value.nodeHashes.get(node.id);
        if (nodeHash !== snapshotHash) {
          diff.nodes.updated.push(node);
        }
      }
    }

    // 删除的节点
    for (const nodeId of snapshotNodeIds) {
      if (!currentNodeIds.has(nodeId)) {
        diff.nodes.deleted.push(nodeId);
      }
    }

    // 计算边的 diff
    const currentEdgeIds = new Set(currentEdges.map(e => e.id));
    const snapshotEdgeIds = new Set(snapshot.value.edges.keys());

    // 新增的边
    for (const edge of currentEdges) {
      if (!snapshot.value.edges.has(edge.id)) {
        diff.edges.created.push(edge);
      } else {
        // 检查是否更新
        const edgeHash = getEdgeHash(edge);
        const snapshotHash = snapshot.value.edgeHashes.get(edge.id);
        if (edgeHash !== snapshotHash) {
          diff.edges.updated.push(edge);
        }
      }
    }

    // 删除的边
    for (const edgeId of snapshotEdgeIds) {
      if (!currentEdgeIds.has(edgeId)) {
        diff.edges.deleted.push(edgeId);
      }
    }

    return diff;
  };

  /**
   * 启动实时模式
   */
  const startRealtimeMode = () => {
    if (realtimeTimer.value) {
      return; // 已经启动
    }

    debugLog("实时模式", "✅ 启动实时模式");
    realtimeMode.value = true;

    realtimeTimer.value = setInterval(() => {
      const diff = calculateWorkflowDiff();

      // 检查是否有变更
      const hasChanges =
        diff.nodes.created.length > 0 ||
        diff.nodes.updated.length > 0 ||
        diff.nodes.deleted.length > 0 ||
        diff.edges.created.length > 0 ||
        diff.edges.updated.length > 0 ||
        diff.edges.deleted.length > 0;

      if (hasChanges) {
        debugLog("实时模式", "检测到变更", diff);

        // TODO: 将 diff 数据发送到 Socket.IO
        // Example:
        // socket.emit('workflow:update', {
        //   applicationId: currentApplication.value?.id,
        //   diff: diff
        // });
      }
    }, 500);
  };

  /**
   * 停止实时模式
   */
  const stopRealtimeMode = () => {
    if (realtimeTimer.value) {
      clearInterval(realtimeTimer.value);
      realtimeTimer.value = null;
      realtimeMode.value = false;
      debugLog("实时模式", "❌ 停止实时模式");
    }
  };

  /**
   * 切换实时模式
   */
  const toggleRealtimeMode = (enabled: boolean) => {
    if (enabled) {
      startRealtimeMode();
    } else {
      stopRealtimeMode();
    }
  };

  /**
   * 保存视口配置（如果发生变化）
   */
  const saveViewportIfChanged = async () => {
    if (!currentApplication.value) {
      return;
    }

    const currentViewport = workflow.getViewport();
    const initialViewport = snapshot.value.viewport;

    // 检查视口是否发生变化（使用阈值避免微小的浮点数差异）
    const threshold = 0.1;
    const hasChanged =
      !initialViewport ||
      Math.abs(currentViewport.x - initialViewport.x) > threshold ||
      Math.abs(currentViewport.y - initialViewport.y) > threshold ||
      Math.abs(currentViewport.zoom - initialViewport.zoom) > threshold;

    if (hasChanged) {
      debugLog("视口保存", "视口发生变化，保存到服务器", {
        初始视口: initialViewport,
        当前视口: currentViewport
      });

      try {
        await updateWorkflowApplication(currentApplication.value.id, {
          name: currentApplication.value.name,
          description: currentApplication.value.description,
          startNodeId: currentApplication.value.startNodeId,
          variables: currentApplication.value.variables,
          viewportConfig: currentViewport
        });
        debugLog("视口保存", "✅ 视口配置已保存");
      } catch (error: any) {
        debugLog("视口保存", "❌ 保存视口配置失败", error);
        // 不显示错误消息，因为这是后台操作
      }
    } else {
      debugLog("视口保存", "视口未发生变化，跳过保存");
    }
  };

  return {
    // 状态
    applications,
    currentApplication,
    loading,
    saving,
    hasUnsavedChanges,
    realtimeMode,

    // 应用管理方法
    loadApplications,
    loadApplication,
    createApplication,
    createAndOpenApplication,
    updateApplicationInfo,
    deleteApplication,
    cloneApplication,

    // 工作流保存方法
    saveWorkflow,

    // 实时模式方法
    toggleRealtimeMode,

    // 视口管理方法
    saveViewportIfChanged,

    // 暴露 workflow 实例
    workflow
  };
}
