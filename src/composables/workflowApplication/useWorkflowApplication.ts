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
  getWorkflowEdgesByApplicationId,
  batchSaveWorkflow,
  getWorkflowVersionsWithPagination
} from "qc-admin-api-common/workflow";
import type {
  WorkflowApplicationResponse,
  CreateWorkflowApplicationRequest,
  UpdateWorkflowApplicationRequest,
  WorkflowNodeResponse,
  WorkflowEdgeResponse,
  WorkflowVersionResponse
} from "qc-admin-api-common/workflow";
import {
  useWorkflow,
  type EdgeAddContext,
  type EdgeDeleteContext
} from "../workflow/useWorkflow";
import { NodeTypeEnum } from "@/components/WorkFlow/types";
import {
  calculateBranchNodesFromNode,
  calculateWorkflowDiff,
  getEdgeFieldChanges,
  getEdgeHash,
  getNodeHash,
  type Snapshot
} from "./diff";
import { validateEdgeConnection, validateEdgeDeletion } from "./edgeValidation";
import {
  mapNodeToCreateRequest,
  mapNodeToUpdateRequest
} from "./nodeFieldMapper";

const threshold = 0.1;

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
      prompt: node.prompt,
      processorLanguage: node.processorLanguage,
      processorCode: node.processorCode,
      apiConfig: node.apiConfig,
      parallelConfig: node.parallelConfig,
      branchNodes: node.branchNodes, // 直接使用 branchNodes
      llmConfig: node.llmConfig,
      loopConfig: node.loopConfig,
      workflowApplicationId: node.workflowApplicationId, // 直接使用 workflowApplicationId
      async: node.async,
      timeout: node.timeout,
      retryCount: node.retryCount,
      color: node.color
    },
    draggable: true,
    connectable: true,
    selectable: true
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

    // 边添加前的验证回调
    beforeAddEdge: async (context: EdgeAddContext) => {
      const result = validateEdgeConnection(
        context.connection,
        context.sourceNode,
        context.targetNode,
        context.allEdges
      );
      return result;
    },

    // 边删除前的验证回调
    beforeDeleteEdge: async (context: EdgeDeleteContext) => {
      // 获取要删除的边
      const edgesToDelete = context.edgesToDelete;

      // 对每条边进行验证
      for (const edge of edgesToDelete) {
        const sourceNode = workflow.getNodeById(edge.source);
        const targetNode = workflow.getNodeById(edge.target);

        const result = validateEdgeDeletion(edge, sourceNode, targetNode);
        if (!result.success) {
          return result;
        }
      }

      return { success: true };
    },

    // 节点加载完成后的回调
    onNodesLoaded: async () => {
      if (pendingViewportConfig) {
        debugLog(
          "应用加载",
          "节点加载完成，准备恢复视口配置...",
          pendingViewportConfig
        );

        // 保存配置到临时变量
        const targetViewport = { ...pendingViewportConfig };

        // 清除待恢复的配置
        pendingViewportConfig = null;

        // 使用 requestAnimationFrame 确保 DOM 已渲染
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            const beforeViewport = workflow.getViewport();
            debugLog("应用加载", "设置前的视口状态", beforeViewport);

            // 使用 setViewport 而不是已废弃的 setTransform
            workflow.setViewport(targetViewport);

            // 使用 nextTick 等待 Vue 更新
            nextTick(() => {
              const afterViewport = workflow.getViewport();
              debugLog("应用加载", "设置后的视口状态", afterViewport);
              debugLog("应用加载", "✅ 视口配置已恢复");

              // 保存初始视口状态
              snapshot.value.viewport = afterViewport;
              debugLog(
                "应用加载",
                "✅ 保存初始视口状态",
                snapshot.value.viewport
              );
            });
          });
        });
      } else {
        // 如果没有待恢复的视口配置，自动适应画布
        requestAnimationFrame(() => {
          workflow.fitView({ padding: 0.2, duration: 300 });
          debugLog("应用加载", "✅ 自动适应画布");

          // 保存初始视口状态
          nextTick(() => {
            snapshot.value.viewport = workflow.getViewport();
            debugLog(
              "应用加载",
              "✅ 保存初始视口状态",
              snapshot.value.viewport
            );
          });
        });
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

  // 版本管理状态
  const versionCache = ref<Map<string, WorkflowVersionResponse>>(new Map()); // 版本缓存：versionId -> version
  const currentVersionId = ref<string>(""); // 当前版本ID（空字符串表示最新的未保存状态）
  const latestVersionNumber = ref<number>(0); // 最新版本号
  const totalVersions = ref<number>(0); // 总版本数

  // Snapshot：保存加载时的节点和边状态，用于 diff
  const snapshot = ref<Snapshot>({
    nodes: new Map(),
    edges: new Map(),
    nodeHashes: new Map(),
    edgeHashes: new Map(),
    viewport: undefined
  });

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
      const currentHash = getNodeHash(currentEdges, node);
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

  // Undo/Redo 相关计算属性
  const canUndo = computed(() => {
    // 可以 Undo：当前在最新状态（未加载任何版本）或者当前版本号 > 1
    if (currentVersionId.value === "") {
      // 在最新状态，可以撤销到最新版本
      return totalVersions.value > 0;
    } else {
      // 在某个版本，可以撤销到更旧的版本
      const currentVersion = versionCache.value.get(currentVersionId.value);
      return currentVersion ? currentVersion.version > 1 : false;
    }
  });

  const canRedo = computed(() => {
    // 可以 Redo：当前在某个版本（不是最新状态）
    return currentVersionId.value !== "";
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
        actualNodes.map(n => [n.id, getNodeHash(actualEdges, n)])
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

      // 8. 加载版本元数据
      await loadVersionMetadata(applicationId);

      // 9. 重置当前版本ID（表示在最新状态）
      currentVersionId.value = "";

      // 10. 设置当前应用
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
   * 加载版本元数据（只加载第一页以获取总数和最新版本号）
   */
  const loadVersionMetadata = async (applicationId: string) => {
    try {
      const result = await getWorkflowVersionsWithPagination({
        applicationId,
        page: 1,
        pageSize: 1,
        order: "desc",
        orderBy: "version"
      });

      if (result.success && result.data && result.pagination) {
        totalVersions.value = result.pagination.total;
        if (result.data.length > 0) {
          latestVersionNumber.value = result.data[0].version;
          // 缓存最新版本
          versionCache.value.set(result.data[0].id, result.data[0]);
        }
        debugLog(
          "版本管理",
          `✅ 加载版本元数据: 总共 ${totalVersions.value} 个版本，最新版本号: ${latestVersionNumber.value}`
        );
      } else {
        totalVersions.value = 0;
        latestVersionNumber.value = 0;
      }
    } catch (error: any) {
      debugLog("版本管理", "❌ 加载版本元数据失败", error);
      totalVersions.value = 0;
      latestVersionNumber.value = 0;
    }
  };

  /**
   * 按需加载指定版本号的版本数据
   */
  const loadVersionByNumber = async (
    applicationId: string,
    versionNumber: number
  ): Promise<WorkflowVersionResponse | null> => {
    try {
      // 先检查缓存
      const cached = Array.from(versionCache.value.values()).find(
        v => v.version === versionNumber
      );
      if (cached) {
        debugLog("版本管理", `✅ 从缓存加载版本 ${versionNumber}`);
        return cached;
      }

      // 从服务器加载
      debugLog("版本管理", `开始从服务器加载版本 ${versionNumber}`);
      const result = await getWorkflowVersionsWithPagination({
        applicationId,
        version: versionNumber,
        page: 1,
        pageSize: 1
      });

      if (result.success && result.data && result.data.length > 0) {
        const version = result.data[0];
        // 缓存版本
        versionCache.value.set(version.id, version);
        debugLog("版本管理", `✅ 从服务器加载版本 ${versionNumber} 成功`);
        return version;
      } else {
        debugLog("版本管理", `❌ 版本 ${versionNumber} 不存在`);
        return null;
      }
    } catch (error: any) {
      debugLog("版本管理", `❌ 加载版本 ${versionNumber} 失败`, error);
      return null;
    }
  };

  /**
   * 从版本快照加载工作流
   * 注意：不更新 snapshot，这样用户可以保存修改
   */
  const loadFromVersion = async (version: WorkflowVersionResponse) => {
    if (!currentApplication.value) {
      ElMessage.error("请先选择或创建一个应用");
      return false;
    }

    try {
      loading.value = true;
      debugLog("版本管理", `开始加载版本 ${version.version}`);

      // 解析快照数据
      const snapshotData = version.snapshot;
      if (!snapshotData || !snapshotData.nodes || !snapshotData.edges) {
        throw new Error("版本快照数据无效");
      }

      // 清空画布
      workflow.clearCanvas(true);

      // 等待清空完成
      await nextTick();

      // 转换节点数据
      const nodes: Node[] = snapshotData.nodes.map(
        convertNodeResponseToVueFlowNode
      );
      const edges: Edge[] = snapshotData.edges.map(
        convertEdgeResponseToVueFlowEdge
      );

      debugLog(
        "版本管理",
        `加载版本数据: ${nodes.length} 个节点, ${edges.length} 条边`
      );

      // 导入数据到画布
      workflow.importData({ nodes, edges }, true);

      // 等待 Vue Flow 完成数据导入
      await new Promise(resolve => setTimeout(resolve, 100));

      // ✅ 不更新 snapshot！
      // snapshot 保持最初加载应用时的状态
      // 这样 hasUnsavedChanges 会正确显示为 true
      // 用户可以保存修改，创建新版本

      // 设置当前版本ID
      currentVersionId.value = version.id;

      debugLog(
        "版本管理",
        `✅ 版本 ${version.version} 加载完成（snapshot 未更新）`
      );
      ElMessage.success(`已加载版本 ${version.version}，可以编辑并保存`);
      return true;
    } catch (error: any) {
      debugLog("版本管理", "❌ 加载版本失败", error);
      ElMessage.error(error.message || "加载版本失败");
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Undo - 撤销到上一个版本
   */
  const undo = async () => {
    if (!canUndo.value || !currentApplication.value) {
      ElMessage.warning("没有可撤销的版本");
      return false;
    }

    // 如果有未保存的更改，提示用户
    if (hasUnsavedChanges.value) {
      try {
        await ElMessageBox.confirm(
          "当前有未保存的更改，撤销操作将丢失这些更改。是否继续？",
          "警告",
          {
            confirmButtonText: "继续",
            cancelButtonText: "取消",
            type: "warning"
          }
        );
      } catch {
        return false;
      }
    }

    // 确定要加载的版本号
    let targetVersionNumber: number;
    if (currentVersionId.value === "") {
      // 当前在最新状态，撤销到最新版本
      targetVersionNumber = latestVersionNumber.value;
    } else {
      // 当前在某个版本，撤销到上一个版本
      const currentVersion = versionCache.value.get(currentVersionId.value);
      if (!currentVersion || currentVersion.version <= 1) {
        ElMessage.warning("已经是最旧的版本");
        return false;
      }
      targetVersionNumber = currentVersion.version - 1;
    }

    // 加载目标版本
    const targetVersion = await loadVersionByNumber(
      currentApplication.value.id,
      targetVersionNumber
    );
    if (!targetVersion) {
      ElMessage.error("加载版本失败");
      return false;
    }

    const success = await loadFromVersion(targetVersion);
    if (success) {
      debugLog("版本管理", `✅ Undo 成功，当前版本: ${targetVersionNumber}`);
    }
    return success;
  };

  /**
   * Redo - 恢复到下一个版本或最新状态
   */
  const redo = async () => {
    if (!canRedo.value || !currentApplication.value) {
      ElMessage.warning("没有可恢复的版本");
      return false;
    }

    // 如果有未保存的更改，提示用户
    if (hasUnsavedChanges.value) {
      try {
        await ElMessageBox.confirm(
          "当前有未保存的更改，恢复操作将丢失这些更改。是否继续？",
          "警告",
          {
            confirmButtonText: "继续",
            cancelButtonText: "取消",
            type: "warning"
          }
        );
      } catch {
        return false;
      }
    }

    const currentVersion = versionCache.value.get(currentVersionId.value);
    if (!currentVersion) {
      return false;
    }

    // 如果当前版本是最新版本，恢复到最新状态（重新加载应用）
    if (currentVersion.version === latestVersionNumber.value) {
      debugLog("版本管理", "恢复到最新状态，重新加载应用");
      workflow.clearCanvas(true);
      await loadApplication(currentApplication.value.id);
      ElMessage.success("已恢复到最新状态");
      return true;
    }

    // 否则，恢复到下一个版本
    const targetVersionNumber = currentVersion.version + 1;
    const targetVersion = await loadVersionByNumber(
      currentApplication.value.id,
      targetVersionNumber
    );
    if (!targetVersion) {
      ElMessage.error("加载版本失败");
      return false;
    }

    const success = await loadFromVersion(targetVersion);
    if (success) {
      debugLog("版本管理", `✅ Redo 成功，当前版本: ${targetVersionNumber}`);
    }
    return success;
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
   * 保存当前工作流（核心方法 - 使用批量保存 API）
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
      // 获取当前所有节点和边
      const currentNodes = workflow.getAllNodes();
      const currentEdges = workflow.getAllEdges();

      debugLog(
        "工作流保存",
        `当前画布状态: ${currentNodes.length} 个节点, ${currentEdges.length} 条边`
      );

      // ========== 第一步：计算 Diff ==========
      debugLog("工作流保存", "开始计算 diff...");
      const diff = calculateWorkflowDiff(
        currentNodes,
        currentEdges,
        snapshot.value
      );

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

      // 输出 diff 日志
      for (const { tempId } of diff.nodes.created) {
        debugLog("工作流保存", `节点 ${tempId} 是新增节点`);
      }
      for (const { node, changedFields } of diff.nodes.updated) {
        debugLog(
          "工作流保存",
          `节点 ${node.id} 有变化，变更字段: ${changedFields.join(", ")}`
        );
        stats.totalFieldsChanged += changedFields.length;
      }
      for (const id of diff.nodes.deleted) {
        debugLog("工作流保存", `节点 ${id} 已被删除`);
      }

      for (const { tempId } of diff.edges.created) {
        debugLog("工作流保存", `边 ${tempId} 是新增边`);
      }
      for (const { edge, changedFields } of diff.edges.updated) {
        debugLog(
          "工作流保存",
          `边 ${edge.id} 有变化，变更字段: ${changedFields.join(", ")}`
        );
        stats.totalFieldsChanged += changedFields.length;
      }
      for (const id of diff.edges.deleted) {
        debugLog("工作流保存", `边 ${id} 已被删除`);
      }

      debugLog(
        "工作流保存",
        `Diff 结果: 节点(新增 ${diff.nodes.created.length}, 修改 ${diff.nodes.updated.length}, 删除 ${diff.nodes.deleted.length}), 边(新增 ${diff.edges.created.length}, 修改 ${diff.edges.updated.length}, 删除 ${diff.edges.deleted.length})`
      );

      // ========== 第二步：准备批量保存数据 ==========
      debugLog("工作流保存", "准备批量保存数据...");

      // 准备要创建的节点数据
      const nodesToCreateData = diff.nodes.created.map(({ node }) => {
        // 使用字段映射器自动转换
        const nodeData = mapNodeToCreateRequest(
          node,
          currentApplication.value.id
        );

        // 对于条件节点，计算并添加 branchNodes
        if (node.type === NodeTypeEnum.CONDITION_CHECKER) {
          const branchNodes = calculateBranchNodesFromNode(currentEdges, node);
          if (branchNodes && Object.keys(branchNodes).length > 0) {
            (nodeData as any).branchNodes = branchNodes;
          }
        }

        return nodeData;
      });

      // 准备要更新的节点数据
      const nodesToUpdateData = diff.nodes.updated.map(
        ({ node, changedFields }) => {
          // 使用字段映射器自动转换变更字段
          const nodeData = mapNodeToUpdateRequest(node, changedFields);

          // 对于条件节点，检查 branchNodes 是否变更
          if (node.type === NodeTypeEnum.CONDITION_CHECKER) {
            const branchNodes = calculateBranchNodesFromNode(
              currentEdges,
              node
            );
            if (branchNodes && Object.keys(branchNodes).length > 0) {
              if (
                changedFields.includes("data.branchNodes") ||
                changedFields.length > 0
              ) {
                (nodeData as any).branchNodes = branchNodes;
              }
            }
          }

          return { id: node.id, data: nodeData };
        }
      );

      // 准备要创建的边数据
      // 注意：边可以引用临时ID的节点，后端会在创建节点后自动映射ID
      const edgesToCreateData = diff.edges.created.map(({ edge }) => {
        // 将 Vue Flow 的边类型映射到后端业务类型
        let backendType: "default" | "branch" | "parallel" = "default";
        if (edge.data?.isParallelChild) {
          backendType = "parallel";
        } else if (edge.data?.branchName) {
          backendType = "branch";
        }

        return {
          applicationId: currentApplication.value.id,
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
      });

      // 准备要更新的边数据
      const edgesToUpdateData = diff.edges.updated.map(({ edge }) => {
        const snapshotEdge = snapshot.value.edges.get(edge.id);
        if (!snapshotEdge) {
          return { id: edge.id, data: {} };
        }

        const fieldChangesInfo = getEdgeFieldChanges(edge, snapshotEdge);
        if (!fieldChangesInfo) {
          return { id: edge.id, data: {} };
        }

        return { id: edge.id, data: fieldChangesInfo.changes };
      });

      debugLog("工作流保存", "批量保存数据准备完成");
      debugLog(
        "工作流保存",
        `准备创建 ${nodesToCreateData.length} 个节点, 更新 ${nodesToUpdateData.length} 个节点, 删除 ${diff.nodes.deleted.length} 个节点`
      );
      debugLog(
        "工作流保存",
        `准备创建 ${edgesToCreateData.length} 条边, 更新 ${edgesToUpdateData.length} 条边, 删除 ${diff.edges.deleted.length} 条边`
      );

      // 检查是否有任何变更
      const hasChanges =
        nodesToCreateData.length > 0 ||
        nodesToUpdateData.length > 0 ||
        diff.nodes.deleted.length > 0 ||
        edgesToCreateData.length > 0 ||
        edgesToUpdateData.length > 0 ||
        diff.edges.deleted.length > 0;

      if (!hasChanges) {
        debugLog("工作流保存", "⚠️ 没有任何变更，跳过保存");
        ElMessage.info("工作流没有变更");
        saving.value = false;
        return true;
      }

      // ========== 第三步：调用批量保存 API ==========
      debugLog("工作流保存", "调用批量保存 API...");

      const result = await batchSaveWorkflow({
        applicationId: currentApplication.value.id,
        nodeTempIds: diff.nodes.created.map(({ tempId }) => tempId), // 发送临时ID列表
        edgeTempIds: diff.edges.created.map(({ tempId }) => tempId), // 发送临时ID列表
        nodesToCreate: nodesToCreateData,
        nodesToUpdate: nodesToUpdateData,
        nodeIdsToDelete: diff.nodes.deleted,
        edgesToCreate: edgesToCreateData,
        edgesToUpdate: edgesToUpdateData,
        edgeIdsToDelete: diff.edges.deleted
      });

      if (!result.success) {
        throw new Error(result.message || "批量保存失败");
      }

      debugLog("工作流保存", "✅ 批量保存成功");
      debugLog("工作流保存", "后端返回统计:", result.data.stats);

      // ========== 第五步：使用ID映射更新前端节点和边的ID ==========
      debugLog("工作流保存", "使用ID映射更新前端节点和边的ID...");

      // 更新节点ID（使用后端返回的映射表）
      const nodeIdMapping = result.data.nodeIdMapping || {};
      for (const [tempId, dbId] of Object.entries(nodeIdMapping)) {
        workflow.updateNodeId(tempId, dbId as string);
        debugLog("工作流保存", `✅ 更新节点 ID: ${tempId} -> ${dbId}`);
      }

      // 等待节点ID更新完成
      await nextTick();

      // 更新边ID（使用后端返回的映射表）
      const edgeIdMapping = result.data.edgeIdMapping || {};
      for (const [tempId, dbId] of Object.entries(edgeIdMapping)) {
        workflow.updateEdgeId(tempId, dbId as string);
        debugLog("工作流保存", `✅ 更新边 ID: ${tempId} -> ${dbId}`);
      }

      // 更新统计信息
      stats.nodesCreated = result.data.stats.nodesCreated;
      stats.nodesUpdated = result.data.stats.nodesUpdated;
      stats.nodesDeleted = result.data.stats.nodesDeleted;
      stats.edgesCreated = result.data.stats.edgesCreated;
      stats.edgesUpdated = result.data.stats.edgesUpdated;
      stats.edgesDeleted = result.data.stats.edgesDeleted;

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
        actualNodes.map(n => [n.id, getNodeHash(actualEdges, n)])
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
   * 准备发送到 Socket 的 Diff 数据
   * 将 diff 结果转换为可以发送到后端的格式
   */
  const prepareDiffForSocket = (
    diff: ReturnType<typeof calculateWorkflowDiff>
  ) => {
    const currentEdges = workflow.getAllEdges();

    // 准备要创建的节点数据
    const nodesToCreate = diff.nodes.created.map(({ node }) => {
      const nodeData = mapNodeToCreateRequest(
        node,
        currentApplication.value!.id
      );

      // 对于条件节点，计算并添加 branchNodes
      if (node.type === NodeTypeEnum.CONDITION_CHECKER) {
        const branchNodes = calculateBranchNodesFromNode(currentEdges, node);
        if (branchNodes && Object.keys(branchNodes).length > 0) {
          (nodeData as any).branchNodes = branchNodes;
        }
      }

      return { tempId: node.id, data: nodeData };
    });

    // 准备要更新的节点数据
    const nodesToUpdate = diff.nodes.updated.map(({ node, changedFields }) => {
      const nodeData = mapNodeToUpdateRequest(node, changedFields);

      // 对于条件节点，检查 branchNodes 是否变更
      if (node.type === NodeTypeEnum.CONDITION_CHECKER) {
        const branchNodes = calculateBranchNodesFromNode(currentEdges, node);
        if (branchNodes && Object.keys(branchNodes).length > 0) {
          if (
            changedFields.includes("data.branchNodes") ||
            changedFields.length > 0
          ) {
            (nodeData as any).branchNodes = branchNodes;
          }
        }
      }

      return { id: node.id, data: nodeData, changedFields };
    });

    // 准备要创建的边数据
    const edgesToCreate = diff.edges.created.map(({ edge }) => {
      let backendType: "default" | "branch" | "parallel" = "default";
      if (edge.data?.isParallelChild) {
        backendType = "parallel";
      } else if (edge.data?.branchName) {
        backendType = "branch";
      }

      return {
        tempId: edge.id,
        data: {
          applicationId: currentApplication.value!.id,
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
        }
      };
    });

    // 准备要更新的边数据
    const edgesToUpdate = diff.edges.updated.map(({ edge, changedFields }) => {
      const snapshotEdge = snapshot.value.edges.get(edge.id);
      const fieldChangesInfo = snapshotEdge
        ? getEdgeFieldChanges(edge, snapshotEdge)
        : null;

      return {
        id: edge.id,
        data: fieldChangesInfo?.changes || {},
        changedFields
      };
    });

    return {
      applicationId: currentApplication.value?.id,
      nodes: {
        created: nodesToCreate,
        updated: nodesToUpdate,
        deleted: diff.nodes.deleted
      },
      edges: {
        created: edgesToCreate,
        updated: edgesToUpdate,
        deleted: diff.edges.deleted
      }
    };
  };

  /**
   * 启动实时模式
   * @param onDiffDetected 可选的回调函数，当检测到变更时调用，接收准备好的 diff 数据
   */
  const startRealtimeMode = (
    onDiffDetected?: (diffData: ReturnType<typeof prepareDiffForSocket>) => void
  ) => {
    if (realtimeTimer.value) {
      return; // 已经启动
    }

    debugLog("实时模式", "✅ 启动实时模式");
    realtimeMode.value = true;

    realtimeTimer.value = setInterval(() => {
      const currentNodes = workflow.getAllNodes();
      const currentEdges = workflow.getAllEdges();

      // 使用与 saveWorkflow 相同的 diff 方法
      const diff = calculateWorkflowDiff(
        currentNodes,
        currentEdges,
        snapshot.value
      );

      // 检查是否有变更
      const hasChanges =
        diff.nodes.created.length > 0 ||
        diff.nodes.updated.length > 0 ||
        diff.nodes.deleted.length > 0 ||
        diff.edges.created.length > 0 ||
        diff.edges.updated.length > 0 ||
        diff.edges.deleted.length > 0;

      if (hasChanges) {
        debugLog("实时模式", "检测到变更", {
          nodes: {
            created: diff.nodes.created.length,
            updated: diff.nodes.updated.length,
            deleted: diff.nodes.deleted.length
          },
          edges: {
            created: diff.edges.created.length,
            updated: diff.edges.updated.length,
            deleted: diff.edges.deleted.length
          }
        });

        // 准备发送到 socket 的数据
        const diffData = prepareDiffForSocket(diff);

        // 调用用户提供的回调函数
        if (onDiffDetected) {
          onDiffDetected(diffData);
        }
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
   * @param enabled 是否启用实时模式
   * @param onDiffDetected 可选的回调函数，当检测到变更时调用
   */
  const toggleRealtimeMode = (
    enabled: boolean,
    onDiffDetected?: (diffData: ReturnType<typeof prepareDiffForSocket>) => void
  ) => {
    if (enabled) {
      startRealtimeMode(onDiffDetected);
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
    prepareDiffForSocket,

    // 视口管理方法
    saveViewportIfChanged,

    // 版本管理方法
    canUndo,
    canRedo,
    undo,
    redo,

    // 暴露 workflow 实例
    workflow
  };
}
