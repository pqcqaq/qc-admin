import { computed } from "vue";
import type { Node } from "@vue-flow/core";
import { useVueFlow } from "@vue-flow/core";
import type { BranchConfig, ParallelChildConfig, NodeData } from "../types";

/**
 * 节点操作 Hook
 * @param selectedNode - 当前选中的节点
 * @param emit - 事件发射器
 */
export function useNodeOperations(
  selectedNode: Node | null,
  emit: {
    updateNode: (nodeId: string, updates: Partial<Node>) => void;
    deleteNode: (nodeId: string) => void;
  }
) {
  const { getNodes, getEdges } = useVueFlow({ id: "workflow-canvas" });

  /**
   * 更新节点数据
   */
  const updateNodeData = (key: string, value: any) => {
    if (!selectedNode) return;

    emit.updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        [key]: value
      }
    });
  };

  /**
   * 批量更新节点数据
   */
  const updateNodeDataBatch = (updates: Partial<NodeData>) => {
    if (!selectedNode) return;

    emit.updateNode(selectedNode.id, {
      data: {
        ...selectedNode.data,
        ...updates
      }
    });
  };

  /**
   * 更新节点位置
   */
  const updateNodePosition = (axis: "x" | "y", value: number) => {
    if (!selectedNode) return;

    emit.updateNode(selectedNode.id, {
      position: {
        ...selectedNode.position,
        [axis]: value
      }
    });
  };

  /**
   * 更新节点可连接状态
   */
  const updateNodeConnectable = (value: boolean) => {
    if (!selectedNode) return;

    emit.updateNode(selectedNode.id, {
      connectable: value
    });
  };

  /**
   * 删除节点
   */
  const deleteNode = () => {
    if (!selectedNode) return;
    emit.deleteNode(selectedNode.id);
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
   */
  const branches = computed<BranchConfig[]>(() => {
    if (!selectedNode) return [];

    const nodeBranches = selectedNode.data.branches || [];
    const edges = getEdges.value;

    return nodeBranches.map((branch: BranchConfig) => {
      const edge = edges.find(
        e =>
          e.source === selectedNode.id &&
          e.sourceHandle?.includes(`branch-${branch.name}`)
      );

      return {
        ...branch,
        targetNodeId: edge?.target
      };
    });
  });

  /**
   * 计算当前节点的并行子节点配置（包含目标节点ID）
   */
  const parallelChildren = computed<ParallelChildConfig[]>(() => {
    if (!selectedNode) return [];

    const nodeChildren = selectedNode.data.parallelChildren || [];
    const edges = getEdges.value;

    return nodeChildren.map((child: ParallelChildConfig, index: number) => {
      const edge = edges.find(
        e =>
          e.source === selectedNode.id &&
          e.sourceHandle?.includes(`parallel-${index}`)
      );

      return {
        ...child,
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
