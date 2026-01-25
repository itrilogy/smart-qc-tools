'use client';

import React, { useState, useEffect } from 'react';
import { FishboneNode, FishboneChartStyles, INITIAL_DSL_CONTENT } from './types';
import { Network, Sparkles, HelpCircle, X, Loader2 } from 'lucide-react';

interface FishboneDataPanelProps {
    onChange: (data: FishboneNode, styles: FishboneChartStyles) => void;
}

// Fishbone DSL 专用 System Prompt
const FISHBONE_SYSTEM_PROMPT = `# 角色：鱼骨图 DSL 生成专家

## 核心目标
你是一个精通鱼骨图因果分析的专家。你的任务是将用户的问题描述转化为**语法完美**、**逻辑清晰**的鱼骨图 DSL 代码。

## DSL 语法规范

### 1. 色彩配置
使用 'Color[键名]: #16进制代码'。支持键名:
- BoneLine(脊椎线) - CaseLine(鱼刺线) - Title(标题字) - Case(节点字) - Start(鱼头) - End(鱼尾)
配色建议：故障分析用红色系(#ef4444)，标准管理用蓝色系(#1d4ed8)，商务用灰色系(#475569)

### 2. 标题设定
使用 'Title: [文字]' 定义鱼头（最终要解决的问题/结果）

### 3. 层级逻辑
- '#' = 大骨类别 (Level 1)
- '##' = 一级原因 (Level 2)
- '###' = 二级详情 (Level 3)
- 最高支持 6 级嵌套

### 4. 经典分析维度
- 人机料法环（5M1E）：Man, Machine, Material, Method, Environment, Measurement
- 4P：Product, Price, Place, Promotion
- 系统分层：服务层、数据层、基础架构等

## Few-Shot 示例

**示例 1：工业制造场景**
用户输入：分析造成"注塑件表面缩水"的原因
输出：
\`\`\`
Color[Start]: #1e293b
Color[Case]: #1d4ed8
Title: 注塑件表面缩水故障

# 人 (Man) - 操作与技能
## 调机参数设置不当
### 保压压力过低
### 保压时间不足
## 巡检不及时

# 机 (Machine) - 设备状态
## 料筒加热温度偏移
## 模具冷却水道阻塞

# 料 (Material) - 配方与物性
## 材料缩水率不均匀
## 回料添加比例过高
\`\`\`

**示例 2：系统稳定性场景**
用户输入：分析"支付系统响应缓慢"的根因
输出：
\`\`\`
Color[BoneLine]: #ef4444
Title: 支付系统响应延迟

# 服务层
## 依赖接口超时
### 银行网关响应慢
## 内存泄露导致频繁GC

# 数据库层
## 慢SQL查询
### 缺少覆盖索引
## 数据库死锁
\`\`\`

## 输出要求
1. 仅输出纯DSL代码
2. 不要包含 markdown 的 \`\`\` 标记
3. 不要包含任何解释性文字
4. 确保层级逻辑清晰、因果关系合理`;

export function FishboneDataPanel({ onChange }: FishboneDataPanelProps) {
    const [dsl, setDsl] = useState(INITIAL_DSL_CONTENT);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'editor' | 'ai'>('editor');
    const [showGrammarGuide, setShowGrammarGuide] = useState(false);

    // AI 功能状态
    const [aiInput, setAiInput] = useState('');
    const [aiOutput, setAiOutput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiConfig, setAiConfig] = useState<any>(null);

    // 加载 AI 配置
    useEffect(() => {
        // 从 public 目录加载配置文件
        fetch('/chart_spec.json')
            .then(res => {
                if (!res.ok) throw new Error('配置文件加载失败');
                return res.json();
            })
            .then(data => setAiConfig(data.ai_config))
            .catch(err => console.error('加载配置失败:', err));
    }, []);

    useEffect(() => {
        parseDsl(dsl);
    }, [dsl]);

    const parseDsl = (content: string) => {
        try {
            const lines = content.split('\n');
            const styles: FishboneChartStyles = {};
            let title = '鱼骨图分析';
            const nodes: FishboneNode[] = [];
            const stack: { node: FishboneNode, level: number }[] = [];

            lines.forEach((line) => {
                const trimmed = line.trim();
                if (!trimmed) return;

                if (trimmed.startsWith('Color[')) {
                    const match = trimmed.match(/Color\[(BoneLine|CaseLine|Title|Case|Start|End|Background)\]:\s*(#[0-9a-fA-F]+)/);
                    if (match) {
                        let key = match[1].charAt(0).toLowerCase() + match[1].slice(1);
                        if (key === 'title') key = 'titleColor';
                        if (key === 'case') key = 'caseColor';
                        styles[key as keyof FishboneChartStyles] = match[2];
                    }
                    return;
                }

                if (trimmed.startsWith('Title:')) {
                    title = trimmed.replace('Title:', '').trim();
                    return;
                }

                const headerMatch = trimmed.match(/^(#+)\s+(.+)$/);
                if (headerMatch) {
                    const level = headerMatch[1].length;
                    const label = headerMatch[2].trim();
                    const newNode: FishboneNode = {
                        id: `node-${Math.random().toString(36).substr(2, 9)}`,
                        label: label,
                        type: level === 1 ? 'main' : 'sub',
                        children: []
                    };

                    if (level === 1) {
                        nodes.push(newNode);
                        stack.length = 0;
                        stack.push({ node: newNode, level });
                    } else {
                        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                            stack.pop();
                        }
                        if (stack.length > 0) {
                            const parent = stack[stack.length - 1].node;
                            if (!parent.children) parent.children = [];
                            parent.children.push(newNode);
                            stack.push({ node: newNode, level });
                        }
                    }
                }
            });

            const root: FishboneNode = { id: 'root', label: title, type: 'root', children: nodes };
            setError(null);
            onChange(root, styles);
        } catch (e) {
            setError('解析语法错误');
        }
    };

    // AI 生成函数
    const generateFishbone = async () => {
        if (!aiInput.trim()) {
            alert('请输入问题描述');
            return;
        }

        if (!aiConfig) {
            alert('AI 配置加载失败，请刷新页面');
            return;
        }

        const activeProfile = aiConfig.profiles[aiConfig.active_profile];
        if (!activeProfile) {
            alert('未找到有效的 AI 服务配置');
            return;
        }

        setIsGenerating(true);
        setAiOutput('');

        try {
            const response = await fetch(activeProfile.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeProfile.key || ''}`
                },
                body: JSON.stringify({
                    model: activeProfile.model,
                    messages: [
                        { role: 'system', content: FISHBONE_SYSTEM_PROMPT },
                        { role: 'user', content: aiInput }
                    ]
                })
            });

            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }

            const data = await response.json();
            const generatedCode = data.choices[0].message.content;
            setAiOutput(generatedCode);

            // 自动填充到编辑器
            setDsl(generatedCode);
            setActiveTab('editor');
        } catch (err: any) {
            alert(`生成失败: ${err.message}`);
            console.error('AI 生成错误:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const activeProfileName = aiConfig?.profiles[aiConfig?.active_profile]?.name || '加载中...';

    return (
        <div className="flex flex-col h-full bg-white text-slate-800">
            {/* DataPanel Header Tabs */}
            <div className="h-16 px-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setActiveTab('editor')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all active:scale-95"
                        style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            backgroundColor: activeTab === 'editor' ? '#f1f5f9' : 'transparent',
                            color: activeTab === 'editor' ? '#1d4ed8' : '#64748b',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                    >
                        <Network size={16} />
                        DSL 语法编辑器
                    </button>
                    <button
                        onClick={() => setActiveTab('ai')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all active:scale-95"
                        style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            backgroundColor: activeTab === 'ai' ? '#f1f5f9' : 'transparent',
                            color: activeTab === 'ai' ? '#1d4ed8' : '#64748b',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                        }}
                    >
                        <Sparkles size={16} />
                        <div className="flex items-center gap-2">
                            AI 推理生成
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.8)]"></div>
                        </div>
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    {activeTab === 'editor' && (
                        <button
                            onClick={() => setShowGrammarGuide(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                border: '1px solid #dbeafe'
                            }}
                        >
                            <HelpCircle size={16} />
                            语法说明
                        </button>
                    )}
                    {activeTab === 'ai' && (
                        <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span style={{ fontSize: '13px', color: '#065f46', fontWeight: '600' }}>
                                {activeProfileName} (在线)
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {activeTab === 'editor' ? (
                    <div className="flex-1 p-4 overflow-hidden flex flex-col">
                        <textarea
                            value={dsl}
                            onChange={(e) => setDsl(e.target.value)}
                            className="flex-1 w-full h-full bg-white text-slate-800 p-5 font-mono leading-7 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none custom-scrollbar"
                            style={{
                                fontSize: '14px',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                color: '#1e293b'
                            }}
                            spellCheck={false}
                            placeholder="输入 DSL 逻辑..."
                        />
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-slate-50/50">
                        <div className="flex flex-col gap-3 shrink-0">
                            <label className="font-bold flex items-center gap-2" style={{ fontSize: '16px', color: '#1e293b' }}>
                                <Sparkles size={18} className="text-blue-500" />
                                问题描述
                            </label>
                            <textarea
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                className="h-[320px] bg-white text-slate-800 p-5 leading-relaxed border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none custom-scrollbar shadow-sm"
                                style={{
                                    fontSize: '14px',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                }}
                                placeholder="描述造成异常的具体现象或潜在原因，AI 将自动推导鱼骨图逻辑..."
                                spellCheck={false}
                            />

                            <button
                                onClick={generateFishbone}
                                disabled={isGenerating}
                                className="w-full h-12 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                                style={{
                                    backgroundColor: isGenerating ? '#94a3b8' : '#1d4ed8',
                                    color: '#ffffff',
                                    border: 'none',
                                    outline: 'none',
                                    cursor: isGenerating ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>生成中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} style={{ color: '#ffffff' }} />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>生成鱼骨图</span>
                                    </>
                                )}
                            </button>
                        </div>

                        {/* AI 输出预览 */}
                        {aiOutput && (
                            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                                <label className="font-bold" style={{ fontSize: '14px', color: '#1e293b' }}>生成结果预览</label>
                                <div className="flex-1 bg-slate-900 text-slate-100 p-5 font-mono leading-relaxed rounded-xl overflow-auto custom-scrollbar" style={{ fontSize: '14px' }}>
                                    {aiOutput}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && activeTab === 'editor' && (
                <div className="px-5 py-2.5 flex items-center gap-2.5 bg-red-50" style={{ borderTop: '1px solid #fecaca' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse bg-red-500"></span>
                    <span className="font-semibold uppercase tracking-wide text-red-600" style={{ fontSize: '14px' }}>{error}</span>
                </div>
            )}

            {/* Grammar Guide Modal */}
            {showGrammarGuide && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setShowGrammarGuide(false)}
                >
                    <div
                        className="bg-white w-full max-w-2xl max-h-[85vh] rounded-lg flex flex-col overflow-hidden shadow-2xl"
                        style={{ backgroundColor: '#ffffff' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="px-6 py-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <HelpCircle size={20} className="text-blue-600" />
                                <h2 className="text-lg font-bold text-slate-900">DSL 语法规范</h2>
                            </div>
                            <button
                                onClick={() => setShowGrammarGuide(false)}
                                className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                            >
                                <X size={18} className="text-slate-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                            <section>
                                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-slate-500">核心规则</h3>
                                <div className="space-y-2">
                                    {[
                                        '1. 色彩配置: 使用 \'Color[键名]: #16进制代码\'。支持键名: BoneLine(脊椎线), CaseLine(鱼刺线), Title(标题字), Case(节点字), Start(鱼头), End(鱼尾)。',
                                        '2. 标题设定: 使用 \'Title: [文字]\' 定义鱼头（即最终要解决的问题/结果）。',
                                        '3. 层级逻辑: 使用 \'#\' 表示大骨类别 (Level 1), \'##\' 表示一级原因 (Level 2), \'###\' 表示二级详情 (Level 3), 最高支持 6 级嵌套。',
                                        '4. 生长规则: 系统会自动处理左右交错与上下镜像生长，AI 仅需负责输出清晰的因果逻辑树。',
                                        '5. 配色建议: 故障分析推荐红色系 (#ef4444)，标准管理推荐蓝色系 (#1d4ed8)，商务讨论推荐沉稳灰色系 (#475569)。'
                                    ].map((rule, i) => (
                                        <div key={i} className="p-3 bg-slate-50 rounded-md border border-slate-100">
                                            <p className="leading-relaxed text-slate-700" style={{ fontSize: '14px' }}>{rule}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-sm font-bold mb-3 uppercase tracking-wider text-slate-500">示例：工业分析</h3>
                                <div className="p-4 bg-slate-900 rounded-md font-mono text-xs leading-relaxed text-slate-300 overflow-x-auto">
                                    <div className="text-white font-semibold mb-2">Title: 注塑件表面缩水故障</div>
                                    <div className="text-emerald-500"># 人 (Man) - 操作与技能</div>
                                    <div className="text-slate-300 ml-2">## 调机参数设置不当</div>
                                    <div className="text-slate-400 ml-4">### 保压压力过低</div>
                                    <div className="text-slate-400 ml-4">### 保压时间不足</div>
                                </div>
                            </section>
                        </div>

                        <div className="px-6 py-6 text-center shrink-0 bg-slate-50 border-t border-slate-100">
                            <button
                                onClick={() => setShowGrammarGuide(false)}
                                className="px-10 py-3 font-bold transition-all hover:scale-105 active:scale-95 rounded-xl shadow-lg"
                                style={{
                                    fontSize: '16px',
                                    backgroundColor: '#1d4ed8',
                                    color: '#ffffff'
                                }}
                            >
                                知道了
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
