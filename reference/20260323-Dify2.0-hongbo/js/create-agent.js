// create-agent.js - 创建智能体页面交互逻辑

// ==================== Mock数据 ====================
const knowledgeBaseData = {
    'product-docs': { name: '产品文档库', emoji: '📚', docs: 125, words: '85,000' },
    'tech-manual': { name: '技术手册', emoji: '📖', docs: 48, words: '120,000' },
    'faq': { name: '常见问题集', emoji: '❓', docs: 156, words: '45,000' },
    'training': { name: '培训资料', emoji: '📓', docs: 24, words: '68,000' },
    'api-docs': { name: 'API 文档', emoji: '🔌', docs: 89, words: '32,000' }
};

const initialKnowledgeBases = [
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

const defaultFileContents = {
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

const oaApprovalMockData = {
    pendingApprovals: [
        { id: 'PR20240315001', name: '采购申请', status: '待审批', statusColor: 'text-orange-500' },
        { id: 'LV20240314008', name: '请假申请', status: '待审批', statusColor: 'text-orange-500' },
        { id: 'EXP20240313005', name: '报销申请', status: '已通过', statusColor: 'text-green-500' },
        { id: 'TR20240312003', name: '出差申请', status: '审批中', statusColor: 'text-blue-500' }
    ]
};

function simulateOAApprovalChat(chat) {
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

// ==================== 状态管理 ====================
const selectedSkills = new Set();
const selectedPlugins = new Set();
const uploadedSkills = [];
const selectedKnowledgeBases = new Set();
let currentFile = '';
let autoOptimizeWorkspace = false;

// 模型参数配置
const modelParams = {
    temperature: 0.7,
    topP: 0.9,
    maxTokens: 4096,
    frequencyPenalty: 0,
    presencePenalty: 0
};

// 已绑定的知识库列表（从mock数据初始化）
let boundKnowledgeBases = [...initialKnowledgeBases];

// 初始化时把示例知识库添加到已选择集合
selectedKnowledgeBases.add('product-docs');

// 当前配置的知识库索引
let currentConfigKBIndex = null;

// ==================== UI 交互函数 ====================

// 折叠/展开功能
function toggleSection(sectionId) {
    const content = document.getElementById(sectionId + '-content');
    const section = content.parentElement;
    const chevron = section.querySelector('.section-chevron');

    if (content.classList.contains('collapsed')) {
        content.classList.remove('collapsed');
        chevron.classList.remove('collapsed');
    } else {
        content.classList.add('collapsed');
        chevron.classList.add('collapsed');
    }
}

// 打开文件编辑弹窗
function openFileEditor(fileKey) {
    currentFile = fileKey;
    const modal = document.getElementById('fileModal');
    const title = document.getElementById('modalTitle');
    const content = document.getElementById('modalContent');

    title.textContent = `编辑 ./${fileKey}.md`;
    content.value = defaultFileContents[fileKey] || '';
    modal.classList.remove('hidden');
}

// 关闭弹窗
function closeFileModal() {
    document.getElementById('fileModal').classList.add('hidden');
}

// 重置文件内容
function resetFileContent() {
    if (currentFile && defaultFileContents[currentFile]) {
        document.getElementById('modalContent').value = defaultFileContents[currentFile];
    }
}

// 保存文件内容
function saveFileContent() {
    const content = document.getElementById('modalContent').value;
    defaultFileContents[currentFile] = content;
    closeFileModal();
    alert(`./${currentFile}.md 已保存`);
}

// 处理文件上传
function handleSkillUpload(event) {
    const files = event.target.files;

    for (let file of files) {
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (ext !== '.zip') {
            alert(`不支持的文件类型: ${file.name}，仅支持 .zip 文件`);
            continue;
        }
        if (file.size > 10 * 1024 * 1024) {
            alert(`文件过大: ${file.name} (最大 10MB)`);
            continue;
        }
        uploadedSkills.push({ name: file.name, size: file.size, type: ext });
    }
    updateSkillsList();
    event.target.value = '';
}

// 更新上传列表 UI
function updateSkillsList() {
    const list = document.getElementById('uploaded-skills-list');
    const hint = document.getElementById('no-skills-hint');

    if (uploadedSkills.length === 0) {
        hint.style.display = 'block';
        list.innerHTML = '';
        return;
    }

    hint.style.display = 'none';
    list.innerHTML = uploadedSkills.map((skill, index) => `
        <div class="flex items-center justify-between p-2 dify-card bg-gray-50">
            <div class="flex items-center">
                <i class="fas fa-file-code text-blue-400 text-xs"></i>
                <div class="ml-2">
                    <div class="text-xs font-medium text-gray-800">${skill.name}</div>
                    <div class="text-[10px] text-gray-400">${formatFileSize(skill.size)} · ${skill.type}</div>
                </div>
            </div>
            <button onclick="removeSkill(${index})" class="text-red-500 hover:text-red-700 text-xs">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
}

// 移除上传的技能
function removeSkill(index) {
    uploadedSkills.splice(index, 1);
    updateSkillsList();
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// 模拟保存逻辑
function saveAndPreview() {
    const name = document.getElementById('agent-name').value || "未命名智能体";
    const modelSelect = document.getElementById('model-select');

    // 校验：必须选择模型
    if (!modelSelect || !modelSelect.value) {
        // 显示错误提示
        const chat = document.getElementById('chat-messages');

        // 移除空状态提示
        const emptyState = document.getElementById('chat-empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const tip = document.createElement('div');
        tip.className = "flex justify-center";
        tip.innerHTML = `<span class="bg-red-50 text-red-500 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">⚠ 请先选择模型</span>`;
        chat.appendChild(tip);
        chat.scrollTop = chat.scrollHeight;

        // 2秒后自动移除提示
        setTimeout(() => {
            tip.remove();
        }, 2000);

        return;
    }

    // 检查是否是编辑模式（通过URL参数判断）
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    // 收集所有配置
    const agentConfig = {
        name: name,
        icon: '🤖',
        model: modelSelect?.value,
        description: document.querySelector('textarea[placeholder*="简述"]')?.value || '',
        workspace: {
            autoOptimize: autoOptimizeWorkspace
        },
        modelParams: modelParams,
        skills: {
            fromCenter: Array.from(selectedSkills),
            uploaded: uploadedSkills
        },
        plugins: Array.from(selectedPlugins),
        knowledgeBases: boundKnowledgeBases,
        fileContents: defaultFileContents,
        status: 'active'
    };

    // 保存到 localStorage
    let agents = JSON.parse(localStorage.getItem('dify_agents') || '[]');

    if (editId) {
        // 编辑模式：根据ID更新
        const index = agents.findIndex(a => a.id === editId);
        if (index !== -1) {
            agents[index] = {
                ...agents[index],
                ...agentConfig,
                id: editId,
                createdAt: agents[index].createdAt,
                updatedAt: new Date().toISOString()
            };
        }
    } else {
        // 创建模式：根据名称查找是否已存在
        const existingAgent = agents.find(a => a.name === name);
        if (existingAgent) {
            // 已存在同名智能体：根据ID更新（保留原ID和创建时间）
            const index = agents.findIndex(a => a.id === existingAgent.id);
            if (index !== -1) {
                agents[index] = {
                    ...agents[index],
                    ...agentConfig,
                    id: existingAgent.id,
                    createdAt: existingAgent.createdAt,
                    updatedAt: new Date().toISOString()
                };
            }
        } else {
            // 不存在：创建新智能体
            agentConfig.id = 'agent-' + Date.now();
            agentConfig.createdAt = new Date().toISOString();
            agents.push(agentConfig);
        }
    }

    localStorage.setItem('dify_agents', JSON.stringify(agents));

    // 更新预览
    document.getElementById('preview-name').innerText = name;

    // 保存成功提示
    const chat = document.getElementById('chat-messages');
    const tip = document.createElement('div');
    tip.className = "flex justify-center";
    tip.innerHTML = `<span class="bg-green-50 text-green-600 text-[10px] px-3 py-1 rounded-full uppercase tracking-wider font-bold">✓ 保存成功 - ${name}</span>`;
    chat.appendChild(tip);
    chat.scrollTop = chat.scrollHeight;

    // 更新顶部状态
    const statusSpan = document.querySelector('header .text-sm.text-gray-400');
    if (statusSpan) {
        statusSpan.textContent = '已保存';
        statusSpan.classList.remove('text-gray-400', 'italic');
        statusSpan.classList.add('text-green-500');
    }
}

// 模拟发送消息 - OA 审批场景
function sendMessage() {
    const input = document.getElementById('user-input');
    const chat = document.getElementById('chat-messages');
    if (!input.value.trim()) return;

    // 移除空状态提示
    const emptyState = document.getElementById('chat-empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    // 用户消息
    const userMsg = `<div class="flex items-start space-x-3 justify-end">
        <div class="max-w-[80%] bg-blue-600 px-4 py-3 rounded-2xl rounded-tr-none text-sm text-white leading-relaxed">
            ${input.value}
        </div>
    </div>`;
    chat.innerHTML += userMsg;
    input.value = '';
    chat.scrollTop = chat.scrollHeight;

    // 调用模拟OA审批场景
    setTimeout(() => {
        simulateOAApprovalChat(chat);
    }, 500);
}

// 清空对话
function clearChat() {
    const chat = document.getElementById('chat-messages');
    chat.innerHTML = `
        <div id="chat-empty-state" class="flex flex-col items-center justify-center h-full text-gray-400">
            <i class="fas fa-comments text-4xl mb-3"></i>
            <p class="text-sm">开始对话以测试智能体</p>
        </div>
    `;
}

// ==================== 知识库弹窗函数 ====================

// 打开知识库选择弹窗
function openKnowledgeModal() {
    const modal = document.getElementById('knowledgeModal');
    // 重置已选择的复选框
    const checkboxes = modal.querySelectorAll('.knowledge-checkbox');
    checkboxes.forEach(cb => {
        cb.checked = selectedKnowledgeBases.has(cb.getAttribute('data-kb'));
    });
    updateSelectedKBCount();
    modal.classList.remove('hidden');
}

// 关闭知识库选择弹窗
function closeKnowledgeModal() {
    document.getElementById('knowledgeModal').classList.add('hidden');
}

// 更新已选择计数
function updateSelectedKBCount() {
    const checkboxes = document.querySelectorAll('.knowledge-checkbox:checked');
    document.getElementById('selected-kb-count').textContent = checkboxes.length;
}

// 保存知识库选择
function saveKnowledgeSelection() {
    const checkboxes = document.querySelectorAll('.knowledge-checkbox:checked');

    checkboxes.forEach(cb => {
        const kbId = cb.getAttribute('data-kb');
        const kbData = knowledgeBaseData[kbId];

        // 检查是否已经绑定
        if (!boundKnowledgeBases.find(kb => kb.id === kbId)) {
            boundKnowledgeBases.push({
                id: kbId,
                ...kbData
            });
            selectedKnowledgeBases.add(kbId);
        }
    });

    updateKnowledgeTable();
    closeKnowledgeModal();
}

// 更新知识库表格
function updateKnowledgeTable() {
    const tbody = document.querySelector('#knowledge-content tbody');

    if (boundKnowledgeBases.length === 0) {
        tbody.innerHTML = `
            <tr class="border-b border-gray-50">
                <td colspan="3" class="px-4 py-6 text-center text-gray-400">
                    <i class="fas fa-book-open text-2xl mb-2"></i>
                    <p class="text-xs">暂无绑定的知识库</p>
                </td>
            </tr>
        `;
        return;
    }

    // 检索模式标签映射
    const modeLabels = {
        'vector': '向量检索',
        'fulltext': '全文检索',
        'hybrid': '混合检索'
    };

    tbody.innerHTML = boundKnowledgeBases.map((kb, index) => {
        const config = kb.config || { retrievalMode: 'vector' };
        const modeLabel = modeLabels[config.retrievalMode] || '默认';

        return `
        <tr class="border-b border-gray-50">
            <td class="px-4 py-3 flex items-center">
                <span class="mr-2">${kb.emoji}</span> ${kb.name}
            </td>
            <td class="px-4 py-3"><span class="status-badge badge-blue">${modeLabel}</span></td>
            <td class="px-4 py-3 space-x-3">
                <span class="text-blue-600 cursor-pointer hover:underline" onclick="openKBConfig('${kb.name}')">配置</span>
                <span class="text-red-500 cursor-pointer hover:underline" onclick="unbindKnowledgeBase(${index})">解绑</span>
            </td>
        </tr>
    `}).join('');
}

// 解绑知识库
function unbindKnowledgeBase(index) {
    const kb = boundKnowledgeBases[index];
    selectedKnowledgeBases.delete(kb.id);
    boundKnowledgeBases.splice(index, 1);
    updateKnowledgeTable();
}

// 通过名称解绑知识库（用于静态HTML）
function unbindKnowledgeBaseByName(kbName) {
    const index = boundKnowledgeBases.findIndex(kb => kb.name === kbName);
    if (index !== -1) {
        unbindKnowledgeBase(index);
    }
}

// ==================== 知识库配置函数 ====================

// 打开知识库配置弹窗
function openKBConfig(kbName) {
    const index = boundKnowledgeBases.findIndex(kb => kb.name === kbName);
    if (index === -1) return;

    currentConfigKBIndex = index;
    const kb = boundKnowledgeBases[index];

    // 设置弹窗标题
    document.getElementById('kb-config-name').textContent = kb.name;

    // 加载现有配置或使用默认值
    const config = kb.config || {
        retrievalMode: 'vector',
        similarityThreshold: 0.5,
        topK: 5,
        searchTitle: true,
        searchContent: true,
        enableRerank: true
    };

    // 设置表单值
    document.querySelector(`input[name="retrieval-mode"][value="${config.retrievalMode}"]`).checked = true;
    document.getElementById('similarity-threshold').value = config.similarityThreshold;
    document.getElementById('similarity-value').textContent = config.similarityThreshold;
    document.getElementById('top-k').value = config.topK;
    document.getElementById('topk-value').textContent = config.topK;
    document.getElementById('search-title').checked = config.searchTitle;
    document.getElementById('search-content').checked = config.searchContent;
    document.getElementById('enable-rerank').checked = config.enableRerank;

    document.getElementById('kbConfigModal').classList.remove('hidden');
}

// 关闭知识库配置弹窗
function closeKBConfig() {
    document.getElementById('kbConfigModal').classList.add('hidden');
    currentConfigKBIndex = null;
}

// 保存知识库配置
function saveKBConfig() {
    if (currentConfigKBIndex === null) return;

    const config = {
        retrievalMode: document.querySelector('input[name="retrieval-mode"]:checked').value,
        similarityThreshold: parseFloat(document.getElementById('similarity-threshold').value),
        topK: parseInt(document.getElementById('top-k').value),
        searchTitle: document.getElementById('search-title').checked,
        searchContent: document.getElementById('search-content').checked,
        enableRerank: document.getElementById('enable-rerank').checked
    };

    boundKnowledgeBases[currentConfigKBIndex].config = config;
    updateKnowledgeTable();
    closeKBConfig();
}

// ==================== 模型参数函数 ====================

// 选择模型后显示参数配置
function toggleModelParams() {
    const select = document.getElementById('model-select');
    const paramsSection = document.getElementById('model-params');

    if (select.value) {
        paramsSection.classList.remove('hidden');
    } else {
        paramsSection.classList.add('hidden');
    }
}

// 展开/折叠参数区域
function toggleModelParamsVisibility() {
    const content = document.getElementById('model-params-content');
    const chevron = document.getElementById('model-params-chevron');

    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        chevron.classList.remove('fa-chevron-right');
        chevron.classList.add('fa-chevron-down');
    } else {
        content.classList.add('hidden');
        chevron.classList.remove('fa-chevron-down');
        chevron.classList.add('fa-chevron-right');
    }
}

// 更新参数显示值
function updateParamValue(paramId) {
    const input = document.getElementById(paramId);
    const display = document.getElementById(paramId + '-value');
    display.textContent = input.value;

    // 更新参数状态
    const paramKey = {
        'temperature': 'temperature',
        'top-p': 'topP',
        'max-tokens': 'maxTokens',
        'freq-penalty': 'frequencyPenalty',
        'presence-penalty': 'presencePenalty'
    }[paramId];

    if (paramKey) {
        modelParams[paramKey] = parseFloat(input.value);
    }
}

// 获取所有配置
function getAllConfig() {
    return {
        skills: {
            fromCenter: Array.from(selectedSkills),
            uploaded: uploadedSkills
        },
        plugins: Array.from(selectedPlugins),
        knowledgeBases: boundKnowledgeBases,
        workspace: {
            autoOptimize: autoOptimizeWorkspace
        },
        model: {
            id: document.getElementById('model-select')?.value || '',
            params: modelParams
        }
    };
}

// ==================== 编辑模式加载 ====================
function loadAgentForEdit(agentId) {
    const agents = JSON.parse(localStorage.getItem('dify_agents') || '[]');
    const agent = agents.find(a => a.id === agentId);

    if (!agent) return;

    // 更新页面标题
    document.querySelector('header h1').textContent = '编辑智能体';

    // 填充基本信息
    if (agent.name) document.getElementById('agent-name').value = agent.name;
    const descTextarea = document.querySelector('textarea[placeholder*="简述"]');
    if (descTextarea && agent.description) descTextarea.value = agent.description;

    // 填充模型选择
    const modelSelect = document.getElementById('model-select');
    if (modelSelect && agent.model) {
        modelSelect.value = agent.model;
        if (agent.model) {
            document.getElementById('model-params').classList.remove('hidden');
        }
    }

    // 恢复模型参数
    if (agent.modelParams) {
        Object.assign(modelParams, agent.modelParams);
        if (agent.modelParams.temperature !== undefined) {
            document.getElementById('temperature').value = agent.modelParams.temperature;
            document.getElementById('temperature-value').textContent = agent.modelParams.temperature;
        }
        if (agent.modelParams.topP !== undefined) {
            document.getElementById('top-p').value = agent.modelParams.topP;
            document.getElementById('top-p-value').textContent = agent.modelParams.topP;
        }
        if (agent.modelParams.maxTokens !== undefined) {
            document.getElementById('max-tokens').value = agent.modelParams.maxTokens;
            document.getElementById('max-tokens-value').textContent = agent.modelParams.maxTokens;
        }
        if (agent.modelParams.frequencyPenalty !== undefined) {
            document.getElementById('freq-penalty').value = agent.modelParams.frequencyPenalty;
            document.getElementById('freq-penalty-value').textContent = agent.modelParams.frequencyPenalty;
        }
        if (agent.modelParams.presencePenalty !== undefined) {
            document.getElementById('presence-penalty').value = agent.modelParams.presencePenalty;
            document.getElementById('presence-penalty-value').textContent = agent.modelParams.presencePenalty;
        }
    }

    // 恢复工作区配置
    if (agent.workspace?.autoOptimize) {
        autoOptimizeWorkspace = true;
        document.getElementById('auto-optimize-workspace').checked = true;
    }

    // 恢复技能选择
    if (agent.skills) {
        agent.skills.fromCenter.forEach(skill => {
            selectedSkills.add(skill);
            const checkbox = document.querySelector(`.skill-checkbox[data-skill="${skill}"]`);
            if (checkbox) checkbox.checked = true;
        });
        uploadedSkills.push(...(agent.skills.uploaded || []));
        updateSkillsList();
    }

    // 恢复插件选择
    if (agent.plugins) {
        agent.plugins.forEach(plugin => {
            selectedPlugins.add(plugin);
            const checkbox = document.querySelector(`.plugin-checkbox[data-plugin="${plugin}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }

    // 恢复知识库绑定
    if (agent.knowledgeBases) {
        boundKnowledgeBases.push(...agent.knowledgeBases);
        agent.knowledgeBases.forEach(kb => {
            selectedKnowledgeBases.add(kb.id);
        });
        updateKnowledgeTable();
    }

    // 恢复文件配置
    if (agent.fileContents) {
        Object.assign(defaultFileContents, agent.fileContents);
    }

    // 更新预览名称
    if (agent.name) {
        document.getElementById('preview-name').textContent = agent.name;
    }
}

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    // 检查是否为编辑模式
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');

    if (editId) {
        loadAgentForEdit(editId);
    }
    // 技能中心复选框
    const skillCheckboxes = document.querySelectorAll('.skill-checkbox');
    skillCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const skillName = e.target.getAttribute('data-skill');
            if (e.target.checked) {
                selectedSkills.add(skillName);
            } else {
                selectedSkills.delete(skillName);
            }
        });
    });

    // 插件复选框
    const pluginCheckboxes = document.querySelectorAll('.plugin-checkbox');
    pluginCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const pluginName = e.target.getAttribute('data-plugin');
            if (e.target.checked) {
                selectedPlugins.add(pluginName);
            } else {
                selectedPlugins.delete(pluginName);
            }
        });
    });

    // 拖拽上传
    const uploadArea = document.getElementById('skill-upload-area');
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-blue-400', 'bg-blue-50');
    });
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-blue-400', 'bg-blue-50');
    });
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-blue-400', 'bg-blue-50');
        const files = e.dataTransfer.files;
        handleSkillUpload({ target: { files: files } });
    });

    // 知识库弹窗复选框 - 更新计数
    const kbCheckboxes = document.querySelectorAll('.knowledge-checkbox');
    kbCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', updateSelectedKBCount);
    });

    // 自动优化工作区开关
    const autoOptimizeCheckbox = document.getElementById('auto-optimize-workspace');
    if (autoOptimizeCheckbox) {
        autoOptimizeCheckbox.addEventListener('change', (e) => {
            autoOptimizeWorkspace = e.target.checked;
        });
    }

    // 初始化知识库表格
    updateKnowledgeTable();
});

// ==================== 将函数暴露到全局作用域 ====================
// 由于使用了ES6模块，需要手动将函数挂载到window对象
// 这样HTML中的onclick才能找到这些函数
window.toggleSection = toggleSection;
window.openFileEditor = openFileEditor;
window.closeFileModal = closeFileModal;
window.resetFileContent = resetFileContent;
window.saveFileContent = saveFileContent;
window.removeSkill = removeSkill;
window.saveAndPreview = saveAndPreview;
window.sendMessage = sendMessage;
window.clearChat = clearChat;
window.openKnowledgeModal = openKnowledgeModal;
window.closeKnowledgeModal = closeKnowledgeModal;
window.updateSelectedKBCount = updateSelectedKBCount;
window.saveKnowledgeSelection = saveKnowledgeSelection;
window.unbindKnowledgeBase = unbindKnowledgeBase;
window.unbindKnowledgeBaseByName = unbindKnowledgeBaseByName;
window.openKBConfig = openKBConfig;
window.closeKBConfig = closeKBConfig;
window.saveKBConfig = saveKBConfig;
window.toggleModelParams = toggleModelParams;
window.toggleModelParamsVisibility = toggleModelParamsVisibility;
window.updateParamValue = updateParamValue;
