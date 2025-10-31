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
      branchNodes: node.branchNodes,
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
  // 使用 workflow composable
  const workflow = useWorkflow({
    vueFlowId
  });

  // 状态管理
  const applications = ref<WorkflowApplicationResponse[]>([]);
  const currentApplication = ref<WorkflowApplicationResponse | null>(null);
  const loading = ref(false);
  const saving = ref(false);

  // Snapshot：保存加载时的节点和边状态，用于 diff
  const snapshot = ref<{
    nodes: Map<string, Node>;
    edges: Map<string, Edge>;
  }>({
    nodes: new Map(),
    edges: new Map()
  });

  // 计算属性
  const hasUnsavedChanges = computed(() => {
    // 简化版：可以通过比较当前图和加载时的图来判断
    // 这里暂时返回 false，实际使用时可以添加更精确的判断
    return false;
  });

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

      currentApplication.value = appResult.data;
      debugLog("应用加载", "✅ 应用信息加载成功", {
        应用名称: appResult.data.name,
        应用ID: appResult.data.id
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

      // 5. 导入数据到画布
      workflow.importData(
        {
          nodes,
          edges
        },
        true
      );

      // 6. 创建 snapshot，用于后续 diff
      snapshot.value.nodes = new Map(
        nodes.map(n => [n.id, JSON.parse(JSON.stringify(n))])
      );
      snapshot.value.edges = new Map(
        edges.map(e => [e.id, JSON.parse(JSON.stringify(e))])
      );
      debugLog(
        "应用加载",
        `✅ 创建 snapshot: ${snapshot.value.nodes.size} 个节点, ${snapshot.value.edges.size} 条边`
      );

      debugLog("应用加载", "✅ 数据导入完成");
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

      // 找出新增和修改的节点
      for (const node of currentNodes) {
        const snapshotNode = snapshot.value.nodes.get(node.id);
        if (!snapshotNode) {
          // 新增的节点
          nodesToCreate.push(node);
        } else {
          // 检查是否有修改（简单比较 JSON）
          if (JSON.stringify(node) !== JSON.stringify(snapshotNode)) {
            nodesToUpdate.push(node);
          }
        }
      }

      // 找出删除的节点
      for (const [id] of snapshot.value.nodes) {
        if (!currentNodeMap.has(id)) {
          nodeIdsToDelete.push(id);
        }
      }

      debugLog(
        "工作流保存",
        `节点 diff 结果: 新增 ${nodesToCreate.length}, 修改 ${nodesToUpdate.length}, 删除 ${nodeIdsToDelete.length}`
      );

      // 创建新节点
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
          branchNodes: node.data.branchNodes,
          async: node.data.async,
          timeout: node.data.timeout,
          retryCount: node.data.retryCount,
          color: node.data.color
        };

        const result = await createWorkflowNode(nodeData);
        if (result.success) {
          nodeIdMapping.set(node.id, result.data.id);
          debugLog(
            "工作流保存",
            `✅ 创建节点: ${node.id} -> ${result.data.id}`
          );
        }
      }

      // 更新修改的节点
      for (const node of nodesToUpdate) {
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
          branchNodes: node.data.branchNodes,
          async: node.data.async,
          timeout: node.data.timeout,
          retryCount: node.data.retryCount,
          color: node.data.color
        };

        await updateWorkflowNode(node.id, nodeData);
        debugLog("工作流保存", `✅ 更新节点: ${node.id}`);
      }

      // 删除节点
      for (const nodeId of nodeIdsToDelete) {
        await deleteWorkflowNode(nodeId);
        debugLog("工作流保存", `✅ 删除节点: ${nodeId}`);
      }

      debugLog("工作流保存", `✅ 节点保存完成`);

      // Diff 边：找出新增、修改、删除的边
      debugLog("工作流保存", "开始 diff 边...");
      const currentEdgeMap = new Map(currentEdges.map(e => [e.id, e]));
      const edgesToCreate: Edge[] = [];
      const edgesToUpdate: Edge[] = [];
      const edgeIdsToDelete: string[] = [];

      // 找出新增和修改的边
      for (const edge of currentEdges) {
        const snapshotEdge = snapshot.value.edges.get(edge.id);
        if (!snapshotEdge) {
          // 新增的边
          edgesToCreate.push(edge);
        } else {
          // 检查是否有修改（简单比较 JSON）
          if (JSON.stringify(edge) !== JSON.stringify(snapshotEdge)) {
            edgesToUpdate.push(edge);
          }
        }
      }

      // 找出删除的边
      for (const [id] of snapshot.value.edges) {
        if (!currentEdgeMap.has(id)) {
          edgeIdsToDelete.push(id);
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
          debugLog("工作流保存", `✅ 创建边: ${edge.id} -> ${result.data.id}`);
        }
      }

      // 更新修改的边
      for (const edge of edgesToUpdate) {
        let backendType: "default" | "branch" | "parallel" = "default";
        if (edge.data?.isParallelChild) {
          backendType = "parallel";
        } else if (edge.data?.branchName) {
          backendType = "branch";
        }

        const edgeData = {
          edgeKey: edge.id,
          applicationId,
          source: edge.source,
          target: edge.target,
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

        await updateWorkflowEdge(edge.id, edgeData);
        debugLog("工作流保存", `✅ 更新边: ${edge.id}`);
      }

      // 删除边
      for (const edgeId of edgeIdsToDelete) {
        await deleteWorkflowEdge(edgeId);
        debugLog("工作流保存", `✅ 删除边: ${edgeId}`);
      }

      debugLog("工作流保存", `✅ 边保存完成`);

      debugLog("工作流保存", "✅ 保存成功");

      // 清空画布，让用户重新打开应用
      // 这样可以避免 Vue Flow 内部状态混乱导致的渲染问题
      workflow.clearCanvas();
      currentApplication.value = null;

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

  return {
    // 状态
    applications,
    currentApplication,
    loading,
    saving,
    hasUnsavedChanges,

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

    // 暴露 workflow 实例
    workflow
  };
}
