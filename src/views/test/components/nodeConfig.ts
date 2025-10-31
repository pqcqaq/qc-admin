import { NodeTypeEnum, type NodeTemplate } from "./types";

/**
 * 节点模板配置
 */
export const nodeTemplates: NodeTemplate[] = [
  {
    type: NodeTypeEnum.START,
    label: "开始",
    icon: "▶",
    description: "流程开始节点",
    defaultData: {
      label: "开始",
      color: "#67C23A"
    }
  },
  {
    type: NodeTypeEnum.END,
    label: "结束",
    icon: "■",
    description: "流程结束节点",
    defaultData: {
      label: "结束",
      color: "#F56C6C"
    }
  },
  {
    type: NodeTypeEnum.PROCESS,
    label: "流程",
    icon: "▭",
    description: "普通流程节点",
    defaultData: {
      label: "流程节点",
      description: "",
      color: "#409EFF"
    }
  },
  {
    type: NodeTypeEnum.DECISION,
    label: "判断",
    icon: "◆",
    description: "条件判断节点",
    defaultData: {
      label: "条件判断",
      description: "",
      color: "#E6A23C"
    }
  },
  {
    type: NodeTypeEnum.PARALLEL,
    label: "并行",
    icon: "⫴",
    description: "并行处理节点",
    defaultData: {
      label: "并行处理",
      description: "",
      color: "#909399"
    }
  },
  {
    type: NodeTypeEnum.API_CALLER,
    label: "API调用",
    icon: "🌐",
    description: "API调用节点",
    defaultData: {
      label: "API调用",
      description: "",
      color: "#667eea",
      apiConfig: {
        url: "",
        method: "GET"
      }
    }
  },
  {
    type: NodeTypeEnum.DATA_PROCESSOR,
    label: "数据处理",
    icon: "⚙️",
    description: "数据处理节点",
    defaultData: {
      label: "数据处理",
      description: "",
      color: "#f093fb",
      processorLanguage: "javascript",
      processorCode: ""
    }
  },
  {
    type: NodeTypeEnum.WHILE_LOOP,
    label: "循环",
    icon: "🔄",
    description: "循环节点",
    defaultData: {
      label: "循环",
      description: "",
      color: "#fa709a",
      config: {
        condition: "",
        maxIterations: 100
      }
    }
  },
  {
    type: NodeTypeEnum.LLM_CALLER,
    label: "LLM调用",
    icon: "🤖",
    description: "LLM调用节点",
    defaultData: {
      label: "LLM调用",
      description: "",
      color: "#a8edea",
      prompt: "",
      config: {
        model: "gpt-3.5-turbo",
        temperature: 0.7
      }
    }
  }
];

/**
 * 根据类型获取节点模板
 */
export function getNodeTemplate(type: NodeTypeEnum): NodeTemplate | undefined {
  return nodeTemplates.find(template => template.type === type);
}

/**
 * 生成唯一节点ID
 */
export function generateNodeId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 创建新节点
 */
export function createNode(
  type: NodeTypeEnum,
  position: { x: number; y: number }
) {
  const template = getNodeTemplate(type);
  if (!template) {
    throw new Error(`Unknown node type: ${type}`);
  }

  return {
    id: generateNodeId(type),
    type,
    data: { ...template.defaultData },
    position,
    connectable: true
  };
}
