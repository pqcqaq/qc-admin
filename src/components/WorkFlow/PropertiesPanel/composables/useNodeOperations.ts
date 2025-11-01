import { computed, type Ref } from "vue";
import type { Node } from "@vue-flow/core";
import { useVueFlow } from "@vue-flow/core";
import type { BranchConfig, ParallelChildConfig, NodeData } from "../types";
import {
  ConditionHandles,
  ParallelHandles
} from "@/composables/workflowApplication/handleIdUtils";

/**
 * 节点操作 Hook
 * @param selectedNode - 当前选中的节点（响应式引用或普通值）
 * @param emit - 事件发射器
 */
export function useNodeOperations(
  selectedNode: Node | null | Ref<Node | null>,
  emit: {
    updateNode: (nodeId: string, updates: Partial<Node>) => void;
    deleteNode: (nodeId: string) => void;
  }
) {
  const { getNodes, getEdges } = useVueFlow({ id: "workflow-canvas" });

  // 确保 selectedNode 是响应式的
  const selectedNodeRef = computed(() => {
    if (
      selectedNode &&
      typeof selectedNode === "object" &&
      "value" in selectedNode
    ) {
      return (selectedNode as Ref<Node | null>).value;
    }
    return selectedNode as Node | null;
  });

  /**
   * 更新节点数据
   */
  const updateNodeData = (key: string, value: any) => {
    const node = selectedNodeRef.value;
    if (!node) return;

    emit.updateNode(node.id, {
      data: {
        ...node.data,
        [key]: value
      }
    });
  };

  /**
   * 批量更新节点数据
   */
  const updateNodeDataBatch = (updates: Partial<NodeData>) => {
    const node = selectedNodeRef.value;
    if (!node) return;

    emit.updateNode(node.id, {
      data: {
        ...node.data,
        ...updates
      }
    });
  };

  /**
   * 更新节点位置
   */
  const updateNodePosition = (axis: "x" | "y", value: number) => {
    const node = selectedNodeRef.value;
    if (!node) return;

    emit.updateNode(node.id, {
      position: {
        ...node.position,
        [axis]: value
      }
    });
  };

  /**
   * 更新节点可连接状态
   */
  const updateNodeConnectable = (value: boolean) => {
    const node = selectedNodeRef.value;
    if (!node) return;

    emit.updateNode(node.id, {
      connectable: value
    });
  };

  /**
   * 删除节点
   */
  const deleteNode = () => {
    const node = selectedNodeRef.value;
    if (!node) return;
    emit.deleteNode(node.id);
  };

  /**
   * 获取目标节点的标签
   */
  const getTargetNodeLabel = (nodeId: string): string => {
    const nodes = getNodes.value;
    const targetNode = nodes.find(n => n.id === nodeId);
    return targetNode?.data?.label || nodeId;
  };

  /**
   * 计算当前节点的分支配置（包含目标节点ID）
   * 从 node.data.branchNodes 和 edges 计算得出
   */
  const branches = computed<BranchConfig[]>(() => {
    const node = selectedNodeRef.value;
    if (!node) return [];

    // 从 node.data.branchNodes 读取分支配置
    const branchNodes = node.data.branchNodes || {};
    const edges = getEdges.value;

    return Object.values(branchNodes).map((branchConfig: any) => {
      // 使用新的 Handle ID 格式：nodeId:branch:branchName
      const expectedSourceHandle = ConditionHandles.branch(
        node.id,
        branchConfig.name
      );

      // 查找对应的 edge（精确匹配 sourceHandle）
      const edge = edges.find(
        e => e.source === node.id && e.sourceHandle === expectedSourceHandle
      );

      return {
        name: branchConfig.name,
        condition: branchConfig.condition || "",
        handlerId: branchConfig.handlerId,
        targetNodeId: edge?.target
      };
    });
  });

  /**
   * 计算当前节点的并行子节点配置（包含目标节点ID）
   * 从 parallelConfig.threads 和 edges 计算得出
   */
  const parallelChildren = computed<ParallelChildConfig[]>(() => {
    const node = selectedNodeRef.value;
    if (!node) return [];

    // 从 parallelConfig.threads 读取任务信息
    const threads = node.data.parallelConfig?.threads || [];
    const edges = getEdges.value;

    return threads.map((thread: any) => {
      // 使用新的 Handle ID 格式：nodeId:thread:threadId
      const expectedSourceHandle = ParallelHandles.thread(node.id, thread.id);

      // 查找对应的 edge（精确匹配 sourceHandle）
      const edge = edges.find(
        e => e.source === node.id && e.sourceHandle === expectedSourceHandle
      );

      return {
        id: thread.id,
        name: thread.name,
        handlerId: thread.handlerId,
        targetNodeId: edge?.target
      };
    });
  });

  return {
    updateNodeData,
    updateNodeDataBatch,
    updateNodePosition,
    updateNodeConnectable,
    deleteNode,
    getTargetNodeLabel,
    branches,
    parallelChildren
  };
}
