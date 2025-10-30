/**
 * 节点类型定义
 */
export enum NodeTypeEnum {
  START = "start",
  END = "end",
  PROCESS = "process",
  DECISION = "decision",
  PARALLEL = "parallel",
  CUSTOM = "custom"
}

/**
 * 节点模板配置
 */
export interface NodeTemplate {
  type: NodeTypeEnum;
  label: string;
  icon: string;
  description: string;
  defaultData: Record<string, any>;
}

/**
 * 节点数据接口
 */
export interface NodeData {
  label: string;
  description?: string;
  loading?: boolean;
  color?: string;
  [key: string]: any;
}

/**
 * 节点配置接口
 */
export interface FlowNode {
  id: string;
  type: string;
  data: NodeData;
  position: { x: number; y: number };
  class?: string;
  connectable?: boolean;
}

/**
 * 边配置接口
 */
export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  animated?: boolean;
  markerEnd?: any;
}

/**
 * 面板状态接口
 */
export interface PanelState {
  isCollapsed: boolean;
  width?: number;
  height?: number;
}
