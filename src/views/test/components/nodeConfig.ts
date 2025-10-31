import { NodeTypeEnum, type NodeTemplate } from "./types";

/**
 * 节点模板配置
 */
export const nodeTemplates: NodeTemplate[] = [
  {
    type: NodeTypeEnum.USER_INPUT,
    label: "用户输入",
    icon: "▶",
    description: "用户输入节点",
    defaultData: {
      label: "用户输入",
      color: "#67C23A"
    }
  },
  {
    type: NodeTypeEnum.END_NODE,
    label: "结束",
    icon: "■",
    description: "流程结束节点",
    defaultData: {
      label: "结束",
      color: "#F56C6C"
    }
  },
  {
    type: NodeTypeEnum.TODO_TASK_GENERATOR,
    label: "待办任务生成",
    icon: "▭",
    description: "待办任务生成器节点",
    defaultData: {
      label: "待办任务生成",
      description: "",
      color: "#409EFF"
    }
  },
  {
    type: NodeTypeEnum.CONDITION_CHECKER,
    label: "条件检查",
    icon: "◆",
    description: "条件检查节点",
    defaultData: {
      label: "条件检查",
      description: "",
      color: "#E6A23C",
      config: {},
      branches: [
        { name: "true", condition: "result === true" },
        { name: "false", condition: "result === false" }
      ]
    }
  },
  {
    type: NodeTypeEnum.PARALLEL_EXECUTOR,
    label: "并行执行",
    icon: "⫴",
    description: "并行执行节点",
    defaultData: {
      label: "并行执行",
      description: "",
      color: "#909399",
      config: {},
      parallelConfig: {
        mode: "all",
        timeout: 30000
      },
      parallelChildren: [{ name: "任务1" }, { name: "任务2" }]
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
