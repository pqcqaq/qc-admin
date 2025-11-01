import { NodeTypeEnum } from "../components/types";
import type { Node, Edge } from "@vue-flow/core";

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
export const calculateBranchNodesFromNode = (
  edges: Edge[],
  node: Node,
  nodeIdMapping?: Map<string, string>
): Record<string, any> | undefined => {
  // 从 node.data.branchNodes 读取分支配置
  const branchNodes = node.data.branchNodes;
  if (!branchNodes || Object.keys(branchNodes).length === 0) return undefined;

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
export const getNodeHash = (edges: Edge[], node: Node): string => {
  // 对于条件节点，从 branches 和 edges 计算 branchNodes
  let branchNodes: Record<string, any> | undefined;
  if (node.type === NodeTypeEnum.CONDITION_CHECKER) {
    branchNodes = calculateBranchNodesFromNode(edges, node);
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
export const getEdgeHash = (edge: Edge): string => {
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
export const getNodeFieldChanges = (
  edges: Edge[],
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
    const currentBranchNodes = calculateBranchNodesFromNode(edges, currentNode);
    const snapshotBranchNodes = snapshotNode.data.branchNodes;

    if (
      JSON.stringify(currentBranchNodes) !== JSON.stringify(snapshotBranchNodes)
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
export const getEdgeFieldChanges = (
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
