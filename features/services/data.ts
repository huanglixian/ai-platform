import type { ServiceRecord } from "./types";

export const serviceRecords: ServiceRecord[] = [
  {
    id: "tower-head-planning",
    name: "塔头规划",
    description:
      "生成塔头布置方案，配置相位、挂点、间隙尺寸，并输出塔头参数结果。",
    invokeType: "API",
    calls: "486",
    featured: true,
    emoji: "🗼",
  },
  {
    id: "ampacity-calculation",
    name: "载流量计算",
    description:
      "输入导线与气象参数，计算持续载流量、温升与允许电流等结果。",
    invokeType: "API",
    calls: "352",
    featured: true,
    emoji: "⚡",
  },
  {
    id: "tower-weight-estimation",
    name: "塔重估测",
    description:
      "根据工况条件推荐杆塔型号，并计算在已有数据范围内，预测不同工况条件下的塔重。",
    invokeType: "API",
    calls: "318",
    featured: true,
    emoji: "🏗️",
  },
  {
    id: "thermal-stability",
    name: "热稳定计算",
    description:
      "输入短路电流与持续时间，计算导体、接头热稳定校核值与允许时间。",
    invokeType: "API",
    calls: "174",
    featured: false,
    emoji: "🔥",
  },
  {
    id: "intelligent-pricing",
    name: "智能组价",
    description:
      "按工程量与价格定额规则自动组价，输出概算汇总表与明细表结果。",
    invokeType: "API / SDK",
    calls: "268",
    featured: true,
    emoji: "💹",
  },
  {
    id: "intelligent-routing",
    name: "智能路径规划",
    description:
      "基于约束条件自动生成候选路径，输出走廊线位、里程与节点清单。",
    invokeType: "API",
    calls: "421",
    featured: true,
    emoji: "🧭",
  },
  {
    id: "route-comparison",
    name: "路径方案比较",
    description:
      "对多方案的长度、跨越、占地、敏感冲突与造价指标进行对比并排序。",
    invokeType: "API",
    calls: "203",
    featured: false,
    emoji: "📐",
  },
  {
    id: "equipment-selection",
    name: "设备选型",
    description:
      "根据电压等级与工况选择设备型号，输出选型清单、参数表与匹配校核。",
    invokeType: "API",
    calls: "129",
    featured: false,
    emoji: "🧰",
  },
  {
    id: "agreement-generation",
    name: "协议生成",
    description:
      "基于区域-部门映射表，按路径经过的省市区自动生成路径协议清单。",
    invokeType: "API",
    calls: "96",
    featured: false,
    emoji: "📝",
  },
  {
    id: "agreement-management",
    name: "协议管理",
    description:
      "对路径协议清单进行版本与流程管理，跟踪各部门批复状态与意见变更。",
    invokeType: "API / SDK",
    calls: "88",
    featured: false,
    emoji: "📂",
  },
  {
    id: "conductor-groundwire-properties",
    name: "导地线特性计算",
    description:
      "计算导地线弹性、线膨胀、应力应变与综合特性参数结果。",
    invokeType: "API",
    calls: "231",
    featured: false,
    emoji: "📏",
  },
  {
    id: "profile-ranking-service",
    name: "平断面排位服务",
    description:
      "自动生成平面、纵断面与排位成果，输出图表文件与排位参数清单。",
    invokeType: "API",
    calls: "157",
    featured: false,
    emoji: "📊",
  },
  {
    id: "electrical-parameter-calculation",
    name: "电气参数计算",
    description:
      "计算线路电阻、电抗、电容、阻抗等电气参数，并输出参数表结果。",
    invokeType: "API",
    calls: "244",
    featured: true,
    emoji: "🔌",
  },
  {
    id: "external-load-calculation",
    name: "外负荷计算",
    description:
      "计算风荷载、覆冰荷载、温度工况等外荷载组合与取值结果。",
    invokeType: "API",
    calls: "287",
    featured: false,
    emoji: "🌬️",
  },
  {
    id: "clip-adjustment-calculation",
    name: "连续上下山悬垂线夹调整计算",
    description:
      "计算连续上下山区段线夹调整量，输出调整位置、弧垂与间隙校核结果。",
    invokeType: "API",
    calls: "64",
    featured: false,
    emoji: "⛰️",
  },
  {
    id: "uneven-icing-calculation",
    name: "不均匀覆冰计算",
    description:
      "计算不均匀覆冰条件下的荷载偏心与扭矩，输出受力与校核结果。",
    invokeType: "API",
    calls: "72",
    featured: false,
    emoji: "❄️",
  },
  {
    id: "electrical-unbalance-calculation",
    name: "电气不平衡度计算",
    description:
      "计算三相不平衡度相关指标，输出不平衡度数值、限值对比与结论。",
    invokeType: "API",
    calls: "58",
    featured: false,
    emoji: "⚖️",
  },
  {
    id: "jumper-calculation",
    name: "跳线计算",
    description:
      "计算跳线长度、弧垂、摆幅与间隙，输出跳线布置参数与材料清单。",
    invokeType: "API",
    calls: "141",
    featured: false,
    emoji: "🪢",
  },
  {
    id: "electromagnetic-environment",
    name: "电磁环境计算",
    description:
      "计算工频电场、磁场、无线电干扰等指标，输出沿线点位计算结果表。",
    invokeType: "API",
    calls: "103",
    featured: false,
    emoji: "📡",
  },
  {
    id: "construction-road-planning",
    name: "智能施工道路规划",
    description:
      "自动生成施工道路方案，输出线路、坡度分段、里程统计与节点清单。",
    invokeType: "API / SDK",
    calls: "196",
    featured: false,
    emoji: "🛣️",
  },
  {
    id: "engineering-report-generation",
    name: "工程报告生成",
    description:
      "目前采用分章节生成，目前针对《初设说明书》的路径相关章节进行生成。",
    invokeType: "API / SDK",
    calls: "276",
    featured: true,
    emoji: "📘",
  },
  {
    id: "3d-stringing",
    name: "三维组串",
    description:
      "按杆塔与串型参数生成三维组串模型，输出模型文件与装配清单。",
    invokeType: "API",
    calls: "118",
    featured: false,
    emoji: "🧱",
  },
  {
    id: "digital-handover-package",
    name: "数字化移交数据生成",
    description:
      "按移交规范生成数据包，输出文件清单、元数据表与校验结果报告。",
    invokeType: "API / SDK",
    calls: "214",
    featured: true,
    emoji: "📦",
  },
  {
    id: "quick-3d-scene-build",
    name: "快速构建三维场景",
    description:
      "生成三维场景底座并加载杆塔线路模型，输出可浏览的三维场景成果。",
    invokeType: "API / SDK",
    calls: "183",
    featured: true,
    emoji: "🌐",
  },
];
