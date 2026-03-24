// create-agent-mock.js - Mock数据和模拟场景

// ==================== 知识库Mock数据 ====================
export const knowledgeBaseData = {
    'product-docs': { name: '产品文档库', emoji: '📚', docs: 125, words: '85,000' },
    'tech-manual': { name: '技术手册', emoji: '📖', docs: 48, words: '120,000' },
    'faq': { name: '常见问题集', emoji: '❓', docs: 156, words: '45,000' },
    'training': { name: '培训资料', emoji: '📓', docs: 24, words: '68,000' },
    'api-docs': { name: 'API 文档', emoji: '🔌', docs: 89, words: '32,000' }
};

// 初始绑定的知识库
export const initialKnowledgeBases = [
    {
        id: 'product-docs',
        name: '产品文档库',
        emoji: '📚',
        docs: 125,
        words: '85,000',
        config: {
            retrievalMode: 'vector',
            similarityThreshold: 0.5,
            topK: 5,
            searchTitle: true,
            searchContent: true,
            enableRerank: true
        }
    }
];

// ==================== 文件默认配置内容 ====================
export const defaultFileContents = {
    AGENTS: `# AGENTS.md
# 操作指令与行为规则

## 核心指令
- 始终以专业、友好的方式回应用户
- 在执行任何操作前，先向用户确认并获得授权
- 遇到不确定的情况时，主动询问用户以获取更多信息

## 行为边界
- 不得访问超出授权范围的文件或系统
- 不得执行可能损害系统安全性的操作
- 不得泄露用户隐私信息

## 错误处理
- 遇到错误时，向用户提供清晰的错误说明
- 提供可能的解决方案或替代方案
- 记录错误信息以便后续分析`,

    BOOT: `# BOOT.md
# 启动初始化配置

## 启动检查清单
- [ ] 加载用户配置文件
- [ ] 初始化知识库索引
- [ ] 检查工具可用性
- [ ] 验证系统权限

## 初始化任务
1. 加载 SYSTEM_PROMPT
2. 检查 MEMORY.md 是否存在
3. 加载用户偏好设置
4. 初始化会话上下文

## 启动问候语
"您好！我是 {{AGENT_NAME}}，已准备就绪。有什么我可以帮助您的吗？"`,

    HEARTBEAT: `# HEARTBEAT.md
# 心跳任务清单

## 定时任务
- 每小时：检查会话活跃状态
- 每日：清理临时缓存文件
- 每周：整理并归档历史对话

## 健康检查
- 检查知识库连接状态
- 验证工具可用性
- 监控内存使用情况

## 任务优先级
1. 高优先级：安全相关检查
2. 中优先级：性能优化
3. 低优先级：日志归档`,

    IDENTITY: `# IDENTITY.md
# 名称、Emoji、主题

## 基本信息
- **名称**: {{AGENT_NAME}}
- **Emoji**: 🤖
- **角色**: 智能助手

## 个性特征
- 专业、友好、乐于助人
- 善于倾听和理解需求
- 提供清晰准确的解答

## 交流风格
- 使用简洁明了的语言
- 适当使用表情符号增加亲和力
- 在适当时候使用示例帮助理解

## 主题色
- 主色：#155EEF (蓝色)
- 辅助色：#10B981 (绿色)`,

    MEMORY: `# MEMORY.md
# 长期记忆

## 用户偏好
- 编程语言：Python, JavaScript
- 工作习惯：喜欢详细的代码注释
- 沟通风格：直接、简洁

## 重要对话摘要
- 首次对话：用户询问了关于系统架构的问题
- 最近需求：希望优化数据处理流程

## 学习记录
- 2026-03-22：了解了用户的项目背景
- 待补充：更多用户偏好和习惯`,

    SOUL: `# SOUL.md
# 人格、语气与边界

## 人格定义
我是一个专业、可靠的 AI 助手，致力于帮助用户解决问题并提供有价值的建议。

## 语气特征
- 专业但不冷漠
- 友好但不过度随意
- 有耐心且乐于助人

## 沟通原则
1. **诚实透明**：不知道时坦诚告知
2. **尊重用户**：不评判用户的选择
3. **保护隐私**：不存储敏感信息

## 行为边界
- 不提供违法或有害的建议
- 不冒充真人或虚假身份
- 不处理涉及隐私的敏感数据`,

    TOOLS: `# TOOLS.md
# 本地工具备注

## 已启用工具
- **web_search**: 互联网搜索能力
- **code_interpreter**: 代码执行环境

## 工具使用规则
1. 使用 web_search 时，优先选择可信来源
2. code_interpreter 仅用于非敏感数据处理
3. 所有工具使用前需获得用户授权

## 工具限制
- web_search：每分钟最多 3 次
- code_interpreter：单次执行不超过 30 秒
- 文件操作：仅限指定工作目录`,

    USER: `# USER.md
# 用户画像与偏好

## 基本信息
- **角色**: 开发者
- **经验水平**: 中高级
- **主要工作**: 全栈开发

## 技术栈
- 前端：React, Vue, TypeScript
- 后端：Python, Node.js
- 数据库：PostgreSQL, MongoDB

## 沟通偏好
- 喜欢代码示例而非纯文字解释
- 偏好简洁明了的回答
- 重视最佳实践和设计模式

## 待补充
- 更多用户偏好将随交互记录更新`
};

// ==================== OA审批场景模拟数据 ====================
export const oaApprovalMockData = {
    pendingApprovals: [
        { id: 'PR20240315001', name: '采购申请', status: '待审批', statusColor: 'text-orange-500' },
        { id: 'LV20240314008', name: '请假申请', status: '待审批', statusColor: 'text-orange-500' },
        { id: 'EXP20240313005', name: '报销申请', status: '已通过', statusColor: 'text-green-500' },
        { id: 'TR20240312003', name: '出差申请', status: '审批中', statusColor: 'text-blue-500' }
    ]
};

// ==================== 模拟OA审批场景 ====================
export function simulateOAApprovalChat(chat) {
    // 显示调用插件
    const pluginCall = `<div class="flex items-start space-x-3">
        <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <i class="fas fa-robot text-blue-600 text-xs"></i>
        </div>
        <div class="max-w-[80%] bg-gray-50 px-4 py-3 rounded-2xl rounded-tl-none text-sm text-gray-700 leading-relaxed">
            <div class="flex items-center gap-2">
                <i class="fas fa-plug text-green-500 text-xs"></i>
                <span class="text-xs text-gray-400">正在调用 OA 审批系统...</span>
            </div>
        </div>
    </div>`;
    chat.innerHTML += pluginCall;
    chat.scrollTop = chat.scrollHeight;

    // 显示结果
    setTimeout(() => {
        const resultMsg = `<div class="flex items-start space-x-3">
            <div class="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                <i class="fas fa-robot text-blue-600 text-xs"></i>
            </div>
            <div class="max-w-[80%] space-y-2">
                <div class="bg-blue-50 px-4 py-3 rounded-2xl text-sm text-gray-700">
                    <div class="font-medium mb-2">📋 查询结果</div>
                    <div class="space-y-2 text-xs">
                        ${oaApprovalMockData.pendingApprovals.map(item => `
                            <div class="flex justify-between items-center p-2 bg-white rounded">
                                <span>${item.name} - ${item.id}</span>
                                <span class="${item.statusColor}">${item.status}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>`;
        chat.innerHTML += resultMsg;
        chat.scrollTop = chat.scrollHeight;
    }, 1000);
}
