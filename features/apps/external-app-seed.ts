import type { AppType } from "./types";

export type ExternalAppSeed = {
  id: string;
  externalId: string;
  name: string;
  description: string;
  appType: AppType;
  url: string;
  launchCommand: string;
};

const pythonTest = "/opt/miniconda3/envs/python_test/bin/python";
const ragServices = "/opt/miniconda3/envs/rag-services/bin/python";

export const EXTERNAL_APP_SEEDS: ExternalAppSeed[] = [
  {
    id: "app-external-customer-management",
    externalId: "desktop-customer-management",
    name: "智能客户关系管理",
    description: "集中管理客户、联系人、线索和销售项目，并提供个人与团队工作台、经营分析和智能辅助。",
    appType: "business",
    url: "http://localhost:19855",
    launchCommand: 'cd "/Users/huanglixian-m2/Documents/LienCode/AI-CRM" && npm run dev',
  },
  {
    id: "app-external-data-extraction",
    externalId: "desktop-data-extraction",
    name: "表格数据提取与知识图谱",
    description: "上传表格后完成结构化提取、数据分析和报告导出，并可构建多表语义图谱进行问答。",
    appType: "business",
    url: "http://127.0.0.1:6620",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/files_Extract" && ${pythonTest} "/Users/huanglixian-m2/Documents/LienCode/files_Extract/main.py"`,
  },
  {
    id: "app-external-zhi-lu",
    externalId: "desktop-zhi-lu",
    name: "智录",
    description: "将实时录音、上传音频或文字整理为可保存的记录，并按模板生成会议纪要、日记等内容。",
    appType: "general",
    url: "http://127.0.0.1:7618",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/FunASR-Service" && ${pythonTest} main.py`,
  },
  {
    id: "app-external-document-knowledge",
    externalId: "desktop-document-knowledge",
    name: "文档知识库问答",
    description: "上传文档后进行文字识别、知识检索和问答，支持多种识别引擎及识别结果导出。",
    appType: "general",
    url: "http://127.0.0.1:6624",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/RAG-demo" && ${ragServices} "/Users/huanglixian-m2/Documents/LienCode/RAG-demo/main.py"`,
  },
  {
    id: "app-external-document-review",
    externalId: "desktop-document-review",
    name: "智能文档评审",
    description: "上传待评审文档和评审规则，解析章节结构并生成专业评审报告，支持查看任务进度和导出成果。",
    appType: "business",
    url: "http://localhost:8430",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/AI-Review" && ${pythonTest} "/Users/huanglixian-m2/Documents/LienCode/AI-Review/run.py"`,
  },
  {
    id: "app-external-power-engineering",
    externalId: "desktop-power-engineering",
    name: "数智输变电业务智能体平台",
    description: "汇聚电力工程业务流、技能、组件和数据资源，支持可研设计流程的协同编排与成果交付。",
    appType: "business",
    url: "http://127.0.0.1:8418",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/digital-shudian" && ${pythonTest} "/Users/huanglixian-m2/Documents/LienCode/digital-shudian/start.py"`,
  },
  {
    id: "app-external-investment-reference",
    externalId: "desktop-investment-reference",
    name: "投资参考知识库",
    description: "处理金融课程资料，提取投资建议和可复用知识，并生成可检索、可发布的投资情报。",
    appType: "general",
    url: "http://127.0.0.1:6625",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/finance-knowledge" && ${ragServices} "/Users/huanglixian-m2/Documents/LienCode/finance-knowledge/main.py"`,
  },
  {
    id: "app-external-zhongda-service",
    externalId: "desktop-zhongda-service",
    name: "中大产业服务平台",
    description: "展示中大产业服务、会员管理和资源推荐等业务场景，提供产业服务的演示入口。",
    appType: "business",
    url: "http://127.0.0.1:7606/service-platform/home",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/zhongda-marketing-demo" && ${pythonTest} main.py`,
  },
  {
    id: "app-external-document-chunking",
    externalId: "desktop-document-chunking",
    name: "文档切片实验室",
    description: "管理文档切片策略，完成多格式文档的切片实验、结果预览和批量知识库处理。",
    appType: "general",
    url: "http://localhost:8410",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/ChunkSpace" && ${pythonTest} "/Users/huanglixian-m2/Documents/LienCode/ChunkSpace/run.py"`,
  },
  {
    id: "app-external-data-resource",
    externalId: "desktop-data-resource",
    name: "广东院数据资源管理平台",
    description: "统一管理数据资源及其服务，提供面向业务的数据查询、维护和展示能力。",
    appType: "business",
    url: "http://localhost:8417",
    launchCommand: 'cd "/Users/huanglixian-m2/Documents/LienCode/GDY-DataResourse" && npm run start',
  },
  {
    id: "app-external-data-preprocessing",
    externalId: "desktop-data-preprocessing",
    name: "数据预处理工具集",
    description: "提供表格、文字和文档文件的格式转换、清洗、脱敏与内容提取等常用处理工具。",
    appType: "general",
    url: "http://localhost:8501",
    launchCommand: `cd "/Users/huanglixian-m2/Documents/LienCode/DataSpace" && ${pythonTest} -m streamlit run "/Users/huanglixian-m2/Documents/LienCode/DataSpace/app.py"`,
  },
  {
    id: "app-external-tower-match",
    externalId: "desktop-tower-match",
    name: "输电杆塔智能匹配",
    description: "根据输电线路设计条件匹配候选杆塔，并展示匹配度和关键设计参数。",
    appType: "business",
    url: "http://127.0.0.1:8420/platform/ui",
    launchCommand: 'cd "/Users/huanglixian-m2/Documents/LienCode/ShuDianTower" && /opt/miniconda3/envs/machine-learning/bin/python "/Users/huanglixian-m2/Documents/LienCode/ShuDianTower/app.py"',
  },
];
