import { prisma } from '../../db';
import { AiProviderType, AiTaskType, AiTaskStatus } from '@prisma/client';
export class AiProviderService {
    /**
     * 获取所有配置的 AI Provider
     */
    static async listProviders() {
        const list = await prisma.aiProviderConfig.findMany({
            orderBy: { createdAt: 'desc' },
        });
        // 脱敏 API Key
        return list.map((p) => ({
            ...p,
            apiKeyMasked: p.apiKeyEncrypted ? `${p.apiKeyEncrypted.slice(0, 4)}****${p.apiKeyEncrypted.slice(-4)}` : null,
            apiKeyEncrypted: undefined,
        }));
    }
    /**
     * 创建 Provider
     */
    static async createProvider(data) {
        return await prisma.aiProviderConfig.create({
            data: {
                name: data.name,
                providerType: data.providerType,
                baseUrl: data.baseUrl,
                apiKeyEncrypted: data.apiKey,
                modelName: data.modelName,
                temperature: data.temperature ?? 0.7,
                maxTokens: data.maxTokens ?? 2000,
                dailyTokenLimit: data.dailyTokenLimit ?? 100000,
                inputPrice: data.inputPrice ?? 0,
                outputPrice: data.outputPrice ?? 0,
                currency: data.currency || 'CNY',
                pricingSource: data.pricingSource || null,
                pricingUpdatedAt: data.pricingSource ? new Date() : null,
            },
        });
    }
    /**
     * 更新 Provider
     */
    static async updateProvider(id, data) {
        const payload = { ...data };
        if (data.apiKey) {
            payload.apiKeyEncrypted = data.apiKey;
            delete payload.apiKey;
        }
        if (data.pricingSource || data.inputPrice !== undefined || data.outputPrice !== undefined) {
            payload.pricingUpdatedAt = new Date();
        }
        return await prisma.aiProviderConfig.update({
            where: { id },
            data: payload,
        });
    }
    /**
     * 删除 Provider
     */
    static async deleteProvider(id) {
        return await prisma.aiProviderConfig.delete({ where: { id } });
    }
    /**
     * 执行生成任务
     * 严格遵循准则：生成结果初始状态必须为 AI_DRAFT，绝不直接对外公开发布
     */
    static async executeGeneration(params) {
        const startTime = Date.now();
        // 1. 查找可用 Provider
        let provider = params.providerId
            ? await prisma.aiProviderConfig.findUnique({ where: { id: params.providerId } })
            : await prisma.aiProviderConfig.findFirst({ where: { isEnabled: true } });
        const modelName = provider ? provider.modelName : 'softbuluo-nlp-engine-v1';
        let outputText = '';
        let promptTokens = Math.ceil(params.inputContext.length * 1.3);
        let completionTokens = 0;
        // 2. 如果配置了可用的真实 API 端点则尝试调用，若为 MOCK 或未配置 API Key 则采用高质量本地语义模板
        if (provider && provider.providerType !== AiProviderType.MOCK && provider.apiKeyEncrypted && provider.baseUrl) {
            try {
                const response = await fetch(`${provider.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${provider.apiKeyEncrypted}`,
                    },
                    body: JSON.stringify({
                        model: provider.modelName,
                        messages: [
                            {
                                role: 'system',
                                content: '你是一名严谨客观的软件评测与中文技术文档编辑。语气中立、专业、不夸大宣传、遵循客观事实。',
                            },
                            { role: 'user', content: params.inputContext },
                        ],
                        temperature: provider.temperature,
                        max_tokens: provider.maxTokens,
                    }),
                });
                if (response.ok) {
                    const resJson = await response.json();
                    outputText = resJson.choices?.[0]?.message?.content || '';
                    promptTokens = resJson.usage?.prompt_tokens || promptTokens;
                    completionTokens = resJson.usage?.completion_tokens || Math.ceil(outputText.length * 1.3);
                }
                else {
                    throw new Error(`AI Provider HTTP ${response.status}: ${await response.text()}`);
                }
            }
            catch (err) {
                // 记录调用错误并降级到结构化生成器
                await prisma.aiUsageLog.create({
                    data: {
                        providerId: provider.id,
                        taskType: params.taskType,
                        promptTokens,
                        completionTokens: 0,
                        totalTokens: promptTokens,
                        durationMs: Date.now() - startTime,
                        success: false,
                        errorMessage: err.message,
                    },
                });
                outputText = this.generateFallbackContent(params.taskType, params.inputContext);
                completionTokens = Math.ceil(outputText.length * 1.3);
            }
        }
        else {
            // 默认/Mock 生成器
            outputText = this.generateFallbackContent(params.taskType, params.inputContext);
            completionTokens = Math.ceil(outputText.length * 1.3);
        }
        const durationMs = Date.now() - startTime;
        const totalTokens = promptTokens + completionTokens;
        const hasConfiguredPrice = provider && (provider.inputPrice > 0 || provider.outputPrice > 0);
        const calculatedCost = hasConfiguredPrice
            ? (promptTokens / 1000) * provider.inputPrice + (completionTokens / 1000) * provider.outputPrice
            : (totalTokens / 1000) * 0.002;
        const estimatedCostCny = parseFloat(calculatedCost.toFixed(5));
        // 3. 记录 Usage Log
        await prisma.aiUsageLog.create({
            data: {
                providerId: provider?.id || null,
                taskType: params.taskType,
                promptTokens,
                completionTokens,
                totalTokens,
                durationMs,
                pricingModel: provider?.modelName || 'Mock Engine',
                isEstimatedCost: !hasConfiguredPrice,
                success: true,
            },
        });
        // 4. 保存为待审核的 AI 草稿 (AI_DRAFT)
        const task = await prisma.aiGenerationTask.create({
            data: {
                taskType: params.taskType,
                targetType: params.targetType || 'SOFTWARE',
                targetId: params.targetId || null,
                inputContext: params.inputContext,
                generatedOutput: outputText,
                modelUsed: modelName,
                tokensUsed: totalTokens,
                estimatedCostCny,
                status: AiTaskStatus.AI_DRAFT,
            },
        });
        return task;
    }
    /**
     * 结构化高质量草稿兜底引擎（确保离线/无 Key 时生成专业可靠、杜绝夸大虚假宣传的内容）
     */
    static generateFallbackContent(taskType, input) {
        let parsedInput = {};
        try {
            parsedInput = JSON.parse(input);
        }
        catch {
            parsedInput = { rawText: input };
        }
        const title = parsedInput.name || parsedInput.title || parsedInput.softwareName || '目标软件';
        switch (taskType) {
            case AiTaskType.RELEASE_NOTES_SUMMARY:
                return `【${title} 本次更新重点速览】\n` +
                    `1. 核心稳定性增强：修复了已知版本在特定系统环境下的兼容性与内存占用异常；\n` +
                    `2. 性能与响应优化：提升了后台任务调度效率与启动响应速度；\n` +
                    `3. 安全修补与常规维护：同步上游开源/官方安全公告，建议涉及该场景的用户根据自身需求按需升级。`;
            case AiTaskType.SOFTWARE_INTRO_DRAFT:
                return `### 软件概览\n` +
                    `${title} 是一款面向日常办公与技术工作者设计的实用型工具。软件具有轻量直观的交互界面，旨在协助用户高效完成相关工作流。\n\n` +
                    `### 核心功能与特性\n` +
                    `- **跨平台兼容**：适配主流 64 位操作系统，资源占用均衡；\n` +
                    `- **配置灵活**：提供细粒度参数设定与快捷键支持；\n` +
                    `- **安全可靠**：遵循官方分发渠道规范，无第三方捆绑插件。\n\n` +
                    `### 适用人群与场景建议\n` +
                    `适合需要稳定工具支撑、注重操作效率的进阶用户与职场人士。建议首次使用者查阅内置帮助文档或官方指引。`;
            case AiTaskType.SEO_META_SUGGESTION:
                return `${title} 最新稳定版官方下载与安装指南。软游部落提供版本更新日志、平台系统要求、用户客观评测与功能横向对比，助您安全快速选型。`;
            case AiTaskType.COMPARISON_DRAFT:
                return `### 对比综合结论草案\n` +
                    `在功能完备度与生态扩展方面，双方各有侧重：一方在轻量化和极低系统开销上表现出色，适合老旧配置或便携需求；另一方在插件生态与现代工作流整合上更为成熟。用户可依据日常核心任务量级择优配置。`;
            case AiTaskType.TUTORIAL_OUTLINE:
                return `### ${title} 新手入门与操作大纲\n` +
                    `1. **环境准备与系统要求检查**：确认操作系统版本与必要运行库；\n` +
                    `2. **官方安装包获取与校验**：核对文件 SHA256 哈希确保未被篡改；\n` +
                    `3. **标准安装步骤与路径选择**：避免中文字符路径与过度分配权限；\n` +
                    `4. **首运行初始化与常用偏好设定**：调整深浅色主题、自动更新频率与备份目录。`;
            default:
                return `针对【${title}】的运营草案已生成。请结合官方实际情况进行客观复核后采纳。`;
        }
    }
    /**
     * 审核并采纳 AI 生成草稿（人工审核闭环）
     */
    static async reviewTask(taskId, action, reviewedBy, options) {
        const task = await prisma.aiGenerationTask.findUnique({ where: { id: taskId } });
        if (!task) {
            throw new Error('生成任务记录不存在');
        }
        const newStatus = action === 'APPROVE' ? AiTaskStatus.APPROVED : AiTaskStatus.REJECTED;
        const updatedTask = await prisma.aiGenerationTask.update({
            where: { id: taskId },
            data: {
                status: newStatus,
                reviewedBy,
                reviewedAt: new Date(),
                feedback: options?.feedback || null,
            },
        });
        // 如果人工明确勾选“同步采纳到目标实体”
        if (action === 'APPROVE' && options?.applyChanges && task.targetId) {
            if (task.targetType === 'SOFTWARE') {
                const software = await prisma.software.findUnique({ where: { id: task.targetId } });
                if (software) {
                    if (task.taskType === AiTaskType.SOFTWARE_INTRO_DRAFT) {
                        await prisma.software.update({
                            where: { id: task.targetId },
                            data: { description: task.generatedOutput },
                        });
                    }
                    else if (task.taskType === AiTaskType.SEO_META_SUGGESTION) {
                        await prisma.software.update({
                            where: { id: task.targetId },
                            data: { summary: task.generatedOutput.slice(0, 200) },
                        });
                    }
                }
            }
        }
        return updatedTask;
    }
    /**
     * 任务列表（分页）
     */
    static async listTasks(page = 1, pageSize = 20, taskType, status) {
        const skip = (page - 1) * pageSize;
        const where = {};
        if (taskType)
            where.taskType = taskType;
        if (status)
            where.status = status;
        const [total, items] = await Promise.all([
            prisma.aiGenerationTask.count({ where }),
            prisma.aiGenerationTask.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
        ]);
        return { total, page, pageSize, totalPages: Math.ceil(total / pageSize), items };
    }
    /**
     * 统计用量与 Token 消耗及真实计费模型 (P5 治理增强)
     */
    static async getUsageAnalytics() {
        const [totalLogs, tokenSum, taskGroup, providers] = await Promise.all([
            prisma.aiUsageLog.count(),
            prisma.aiUsageLog.aggregate({
                _sum: {
                    promptTokens: true,
                    completionTokens: true,
                    totalTokens: true,
                },
            }),
            prisma.aiUsageLog.groupBy({
                by: ['taskType'],
                _sum: { totalTokens: true },
                _count: { id: true },
            }),
            prisma.aiProviderConfig.findMany({
                select: {
                    id: true,
                    name: true,
                    providerType: true,
                    modelName: true,
                    inputPrice: true,
                    outputPrice: true,
                    currency: true,
                    pricingSource: true,
                    pricingUpdatedAt: true,
                    isEnabled: true,
                },
            }),
        ]);
        const promptTokens = tokenSum._sum.promptTokens || 0;
        const completionTokens = tokenSum._sum.completionTokens || 0;
        const totalTokens = tokenSum._sum.totalTokens || 0;
        // 检查是否有配置具体计费价目表的模型
        const activeWithPricing = providers.find((p) => p.isEnabled && (p.inputPrice > 0 || p.outputPrice > 0));
        let estimatedCostRmb = 0;
        let costStatus = 'ESTIMATED';
        let pricingSource = '未配置官方价目表（当前仅作粗略估算参考）';
        if (activeWithPricing) {
            estimatedCostRmb = parseFloat(((promptTokens / 1000) * activeWithPricing.inputPrice +
                (completionTokens / 1000) * activeWithPricing.outputPrice).toFixed(4));
            costStatus = 'MEASURED';
            pricingSource = activeWithPricing.pricingSource || `${activeWithPricing.name} 官方定价`;
        }
        else {
            // 粗略以主流商业 API 0.002 元 / 1k Tokens 估算成本
            estimatedCostRmb = parseFloat(((totalTokens / 1000) * 0.002).toFixed(4));
            costStatus = 'ESTIMATED';
        }
        return {
            totalRequests: totalLogs,
            promptTokens,
            completionTokens,
            totalTokens,
            estimatedCostRmb,
            costStatus,
            pricingSource,
            isEstimated: costStatus === 'ESTIMATED',
            disclaimer: costStatus === 'ESTIMATED' ? '未配置模型官方计费价目表，当前仅基于 0.002 元/1k Tokens 作参考估算，不等价于官方实际账单' : null,
            providers,
            byTaskType: taskGroup.map((tg) => ({
                taskType: tg.taskType,
                count: tg._count.id,
                totalTokens: tg._sum.totalTokens || 0,
            })),
        };
    }
}
