/**
 * 业务流节点接口定义
 */
export interface WorkflowNode {
  id: string;
  type: 'start' | 'model' | 'tool' | 'service' | 'skill' | 'end'; // 节点类型：开始、模型、工具、服务、技能、结束
  position: { x: number; y: number }; // 节点在画布上的坐标
  data: {
    label: string; // 节点名称
    description: string; // 节点描述
    config: {
      modelName?: string; // 关联的模型名称
      prompt?: string; // 提示词配置
      toolId?: string; // 关联的工具ID
      serviceId?: string; // 关联的服务ID
      skillId?: string; // 关联的技能ID
    };
  };
}

/**
 * 业务流连接线接口定义
 */
export interface WorkflowEdge {
  id: string;
  source: string; // 源节点 ID
  target: string; // 目标节点 ID
}

/**
 * 业务流完整模型定义
 */
export interface Workflow {
  id: string;
  name: string; // 业务流名称
  description: string; // 业务流描述
  nodes: WorkflowNode[]; // 包含的节点列表
  edges: WorkflowEdge[]; // 包含的连接线列表
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}
