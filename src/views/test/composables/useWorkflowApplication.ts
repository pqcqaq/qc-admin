/**
 * Workflow Application 业务逻辑 Composable
 * 对接后端 API，管理工作流应用的完整生命周期
 */

import { ref, computed } from "vue";
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
  // deleteWorkflowNode,
  connectNodes,
  disconnectNodes,
  connectBranch,
  // disconnectBranch,
  addNodeToParallel,
  // removeNodeFromParallel,
  // getParallelChildren,
  // getNodeConnections,
  // updateNodePosition,
  batchUpdateNodePositions,
  batchDeleteNodes
} from "qc-admin-api-common/workflow";
import type {
  WorkflowApplicationResponse,
  WorkflowNodeResponse,
  CreateWorkflowApplicationRequest,
  UpdateWorkflowApplicationRequest,
  CreateWorkflowNodeRequest,
  UpdateWorkflowNodeRequest,
  WorkflowNodeType
} from "qc-admin-api-common/workflow";
import { useWorkflow } from "./useWorkflow";

/**
 * 节点类型映射：后端类型 -> 前端类型
 */
const NODE_TYPE_MAP: Record<WorkflowNodeType, string> = {
  user_input: "start",
  end_node: "end",
  todo_task_generator: "process",
  condition_checker: "decision",
  parallel_executor: "parallel",
  api_caller: "custom",
  data_processor: "custom",
  while_loop: "custom",
  llm_caller: "custom"
};

/**
 * 前端类型 -> 后端类型
 */
const REVERSE_NODE_TYPE_MAP: Record<string, WorkflowNodeType> = {
  start: "user_input",
  end: "end_node",
  process: "todo_task_generator",
  decision: "condition_checker",
  parallel: "parallel_executor",
  custom: "api_caller"
};

export function useWorkflowApplication() {
  const workflow = useWorkflow();

  // 状态
  const currentApplication = ref<WorkflowApplicationResponse | null>(null);
  const applications = ref<WorkflowApplicationResponse[]>([]);
  const loading = ref(false);
  const saving = ref(false);

  // 计算属性
  const hasUnsavedChanges = computed(() => {
    // TODO: 实现变更检测逻辑
    return false;
  });

  /**
   * 将后端节点转换为前端节点
   */
  const convertBackendNodeToFrontend = (
    backendNode: WorkflowNodeResponse
  ): Node => {
    return {
      id: backendNode.id,
      type: NODE_TYPE_MAP[backendNode.type] || "custom",
      position: {
        x: backendNode.positionX,
        y: backendNode.positionY
      },
      data: {
        label: backendNode.name,
        description: backendNode.description,
        nodeKey: backendNode.nodeKey,
        backendType: backendNode.type,
        prompt: backendNode.prompt,
        config: backendNode.config,
        processorLanguage: backendNode.processorLanguage,
        processorCode: backendNode.processorCode,
        apiConfig: backendNode.apiConfig,
        parallelConfig: backendNode.parallelConfig,
        async: backendNode.async,
        timeout: backendNode.timeout,
        retryCount: backendNode.retryCount
      }
    };
  };

  /**
   * 将前端节点转换为后端节点创建请求
   */
  const convertFrontendNodeToBackend = (
    node: Node,
    applicationId: string
  ): CreateWorkflowNodeRequest => {
    const backendType =
      (node.data.backendType as WorkflowNodeType) ||
      REVERSE_NODE_TYPE_MAP[node.type || "custom"] ||
      "api_caller";

    return {
      name: node.data.label || "未命名节点",
      nodeKey: node.data.nodeKey || node.id,
      type: backendType,
      description: node.data.description,
      prompt: node.data.prompt,
      config: node.data.config || {},
      applicationId,
      processorLanguage: node.data.processorLanguage,
      processorCode: node.data.processorCode,
      apiConfig: node.data.apiConfig,
      parallelConfig: node.data.parallelConfig,
      async: node.data.async || false,
      timeout: node.data.timeout || 30000,
      retryCount: node.data.retryCount || 0,
      positionX: node.position.x,
      positionY: node.position.y
    };
  };

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
   * 加载指定应用及其节点
   */
  const loadApplication = async (applicationId: string) => {
    try {
      loading.value = true;

      // 加载应用信息
      const appResult = await getWorkflowApplication(applicationId);
      if (!appResult.success) {
        ElMessage.error("加载应用失败");
        return;
      }
      currentApplication.value = appResult.data;

      // 加载节点
      const nodesResult = await getWorkflowNodesByApplicationId(applicationId);
      if (!nodesResult.success) {
        ElMessage.error("加载节点失败");
        return;
      }

      // 转换节点并加载到 workflow
      const frontendNodes = nodesResult.data.map(convertBackendNodeToFrontend);

      // 构建边（基于节点的连接信息）
      const edges: Edge[] = [];
      for (const backendNode of nodesResult.data) {
        // next_node_id 连接
        if (backendNode.nextNodeId) {
          edges.push({
            id: `${backendNode.id}-${backendNode.nextNodeId}`,
            source: backendNode.id,
            target: backendNode.nextNodeId,
            type: "default"
          });
        }

        // 分支连接
        if (backendNode.branchNodes) {
          Object.entries(backendNode.branchNodes).forEach(
            ([branchName, targetId]) => {
              edges.push({
                id: `${backendNode.id}-${targetId}-${branchName}`,
                source: backendNode.id,
                target: String(targetId),
                type: "default",
                label: branchName,
                data: { branchName }
              });
            }
          );
        }
      }

      // 清空并重新加载
      workflow.clearCanvas();

      // 导入数据
      workflow.importData({
        nodes: frontendNodes,
        edges: edges
      });

      ElMessage.success("应用加载成功");
    } catch (error: any) {
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
        currentApplication.value = result.data;
        ElMessage.success("应用创建成功");
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
   * 更新应用信息
   */
  const updateApplication = async (
    applicationId: string,
    data: UpdateWorkflowApplicationRequest
  ) => {
    try {
      saving.value = true;
      const result = await updateWorkflowApplication(applicationId, data);
      if (result.success) {
        currentApplication.value = result.data;
        ElMessage.success("应用更新成功");
        await loadApplications();
        return result.data;
      } else {
        ElMessage.error("更新应用失败");
        return null;
      }
    } catch (error: any) {
      ElMessage.error(error.message || "更新应用失败");
      return null;
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
        "确定要删除此应用吗？此操作不可恢复。",
        "警告",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning"
        }
      );

      const result = await deleteWorkflowApplication(applicationId);
      if (result.success) {
        ElMessage.success("应用删除成功");
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
        ElMessage.success("应用克隆成功");
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
   * 保存当前工作流（同步节点和边到后端）
   */
  const saveWorkflow = async () => {
    if (!currentApplication.value) {
      ElMessage.error("请先选择或创建一个应用");
      return false;
    }

    try {
      saving.value = true;
      const applicationId = currentApplication.value.id;

      // 获取当前所有节点和边
      const nodes = workflow.getAllNodes();
      const edges = workflow.getAllEdges();

      // 1. 同步节点
      const backendNodesResult =
        await getWorkflowNodesByApplicationId(applicationId);
      const existingNodes = backendNodesResult.success
        ? backendNodesResult.data
        : [];
      const existingNodeIds = new Set(existingNodes.map(n => n.id));
      const currentNodeIds = new Set(nodes.map(n => n.id));

      // 创建新节点
      for (const node of nodes) {
        if (!existingNodeIds.has(node.id)) {
          const createData = convertFrontendNodeToBackend(node, applicationId);
          await createWorkflowNode(createData);
        } else {
          // 更新现有节点
          const updateData: UpdateWorkflowNodeRequest = {
            name: node.data.label || "未命名节点",
            nodeKey: node.data.nodeKey || node.id,
            type:
              (node.data.backendType as WorkflowNodeType) ||
              REVERSE_NODE_TYPE_MAP[node.type || "custom"] ||
              "api_caller",
            description: node.data.description,
            prompt: node.data.prompt,
            config: node.data.config || {},
            processorLanguage: node.data.processorLanguage,
            processorCode: node.data.processorCode,
            apiConfig: node.data.apiConfig,
            parallelConfig: node.data.parallelConfig,
            async: node.data.async || false,
            timeout: node.data.timeout || 30000,
            retryCount: node.data.retryCount || 0,
            positionX: node.position.x,
            positionY: node.position.y
          };
          await updateWorkflowNode(node.id, updateData);
        }
      }

      // 删除已移除的节点
      const nodesToDelete = existingNodes
        .filter(n => !currentNodeIds.has(n.id))
        .map(n => n.id);
      if (nodesToDelete.length > 0) {
        await batchDeleteNodes({ nodeIds: nodesToDelete });
      }

      // 2. 同步边（连接关系）
      // 先清除所有连接
      for (const node of nodes) {
        await disconnectNodes({ fromNodeId: node.id });
      }

      // 重新建立连接
      for (const edge of edges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);

        if (!sourceNode || !targetNode) continue;

        // 判断连接类型
        if (edge.data?.branchName) {
          // 分支连接
          await connectBranch({
            fromNodeId: edge.source,
            toNodeId: edge.target,
            branchName: edge.data.branchName
          });
        } else if (sourceNode.type === "parallel") {
          // 并行连接
          await addNodeToParallel({
            parallelNodeId: edge.source,
            childNodeId: edge.target
          });
        } else {
          // 普通连接
          await connectNodes({
            fromNodeId: edge.source,
            toNodeId: edge.target
          });
        }
      }

      ElMessage.success("工作流保存成功");
      return true;
    } catch (error: any) {
      ElMessage.error(error.message || "保存工作流失败");
      return false;
    } finally {
      saving.value = false;
    }
  };

  /**
   * 同步节点位置到后端
   */
  const syncNodePositions = async () => {
    if (!currentApplication.value) return;

    try {
      const nodes = workflow.getAllNodes();
      const positions = nodes.map(node => ({
        nodeId: node.id,
        positionX: node.position.x,
        positionY: node.position.y
      }));

      await batchUpdateNodePositions({ positions });
    } catch (error: any) {
      console.error("同步节点位置失败:", error);
    }
  };

  return {
    // 状态
    currentApplication,
    applications,
    loading,
    saving,
    hasUnsavedChanges,

    // 方法
    loadApplications,
    loadApplication,
    createApplication,
    updateApplication,
    deleteApplication,
    cloneApplication,
    saveWorkflow,
    syncNodePositions,

    // 暴露 workflow 实例
    workflow
  };
}
