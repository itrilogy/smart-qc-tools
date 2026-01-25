'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FishboneNode, FishboneChartStyles, INITIAL_DSL_CONTENT } from './types';
import { Network, Sparkles, HelpCircle, X, Loader2, Database } from 'lucide-react';

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
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
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

            {/* Grammar Guide Modal (Using Portal to escape Sidebar constraints) */}
            {mounted && showGrammarGuide && createPortal(
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => setShowGrammarGuide(false)}
                >
                    <div
                        className="bg-white w-[560px] max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200"
                        style={{ backgroundColor: '#ffffff' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-10 py-8 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 rounded-xl">
                                    <HelpCircle size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Fishbone DSL Specification</h2>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-2 uppercase tracking-widest font-sans">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                                        Full Hierarchy Guide v2.1
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowGrammarGuide(false)}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-slate-100"
                            >
                                <X size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-white">
                            {/* Section: Core Syntax */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900 text-white rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-md">
                                    <Database size={14} />
                                    Property Manifest
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-6 bg-slate-50/50 rounded-2xl font-mono text-sm leading-relaxed text-slate-900 border border-slate-100 shadow-sm">
                                        <div className="flex justify-between border-b border-white pb-3 mb-3">
                                            <span className="text-blue-800 font-black">Title:</span>
                                            <span className="text-slate-500 text-xs text-right font-sans">鱼头核心待解问题</span>
                                        </div>
                                        <div className="flex flex-col gap-2 border-b border-white pb-3 mb-3">
                                            <div className="flex justify-between">
                                                <span className="text-indigo-800 font-black">Color[*]:</span>
                                                <span className="text-slate-400 text-[10px] text-right font-sans">#十六进制色码</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500 font-sans pl-4 border-l-2 border-indigo-100 italic">
                                                <span>• BoneLine (主干)</span>
                                                <span>• Title (鱼头文字)</span>
                                                <span>• Case (原因文字)</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-emerald-800 font-black"># 层级标记:</span>
                                            <span className="text-slate-400 text-[10px] text-right font-sans">深度 1-6 级递归</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Hierarchical Strategy */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-sm">
                                    <Sparkles size={14} />
                                    Logic & Growth
                                </div>
                                <div className="space-y-3">
                                    {[
                                        'L1 (#): 主要因 (5M1E - 人/机/料/法/环/测)',
                                        'L2 (##): 子要因 (对主因素的初步展开)',
                                        'L3 (###): 支撑因 (根因探寻层，系统化递归)',
                                        'Growth: 算法自动处理 Mirroring (镜像) 与 Alternating (交替) 逻辑，确保图形平衡。'
                                    ].map((rule, i) => (
                                        <div key={i} className="p-5 bg-white rounded-xl border-2 border-slate-50 shadow-sm">
                                            <p className="leading-relaxed text-slate-700 font-bold text-xs font-sans tracking-wide">{rule}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section: Industrial Case */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-sm">
                                    <Sparkles size={14} />
                                    Full Quality Case
                                </div>
                                <div className="p-8 bg-slate-900 rounded-2xl font-mono text-sm leading-relaxed text-slate-300 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="text-white font-black mb-4 border-b border-white/10 pb-2">Title: 某医疗器械注塑件表面缩水根因分析</div>
                                    <div className="text-emerald-400 font-black"># 机器因素 (Equipment)</div>
                                    <div className="text-slate-200 ml-4 font-bold">## 注塑压力不足</div>
                                    <div className="text-slate-400 ml-8 italic">### 比例阀线性度差</div>
                                    <div className="text-slate-500 ml-12">#### 阀口沉积油垢</div>
                                    <div className="text-blue-400 font-black mt-4"># 人员意识 (Manpower)</div>
                                    <div className="text-slate-200 ml-4 font-bold">## 调机参数擅改</div>
                                    <div className="text-slate-400 ml-8 italic">### 缺乏标准化操作规范 (SOP)</div>
                                </div>
                            </section>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex justify-center shrink-0">
                            <button
                                onClick={() => setShowGrammarGuide(false)}
                                className="px-16 py-4 bg-slate-900 text-white font-black rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all text-sm uppercase tracking-widest"
                            >
                                I UNDERSTAND
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
