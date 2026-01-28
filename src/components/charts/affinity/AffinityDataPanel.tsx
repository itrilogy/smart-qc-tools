'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Trash2, Sparkles, Database, Code2, HelpCircle, X,
    Loader2, Edit3, Share2
} from 'lucide-react';
import {
    AffinityItem,
    AffinityChartStyles,
    parseAffinityDSL,
    INITIAL_AFFINITY_DSL,
    DEFAULT_AFFINITY_STYLES
} from './types';
import { SidebarSection } from '../../layout/Sidebar';

interface AffinityDataPanelProps {
    data: AffinityItem[];
    styles: AffinityChartStyles;
    onChange: (data: AffinityItem[], styles: AffinityChartStyles) => void;
    onExportPNG?: (transparent?: boolean) => void;
    onExportPDF?: () => void;
    onResetView?: () => void;
}

export const AffinityDataPanel: React.FC<AffinityDataPanelProps> = ({
    data,
    styles,
    onChange
}) => {
    const [activeTab, setActiveTab] = useState<'manual' | 'dsl' | 'ai'>('manual');
    const [dsl, setDsl] = useState(INITIAL_AFFINITY_DSL);
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiConfig, setAiConfig] = useState<any>(null);
    const [showDocs, setShowDocs] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetch('/chart_spec.json')
            .then(res => res.json())
            .then(config => setAiConfig(config))
            .catch(err => console.error('加载 AI 配置失败:', err));
    }, []);

    // 将当前数据与样式状态序列化为 DSL 脚本 (KJ Syntax)
    const generateDSL = useCallback((currentData: AffinityItem[], currentStyles: AffinityChartStyles) => {
        let lines: string[] = [];
        if (currentStyles.title) lines.push(`Title: ${currentStyles.title}`);
        if (currentStyles.type) lines.push(`Type: ${currentStyles.type}`);
        if (currentStyles.layout) lines.push(`Layout: ${currentStyles.layout}`);

        if (currentStyles.titleColor) lines.push(`Color[Title]: ${currentStyles.titleColor}`);
        if (currentStyles.headerColor) lines.push(`Color[Header]: ${currentStyles.headerColor}`);
        if (currentStyles.cardColor) lines.push(`Color[Card]: ${currentStyles.cardColor}`);
        if (currentStyles.itemColor) lines.push(`Color[Item]: ${currentStyles.itemColor}`);
        if (currentStyles.lineColor) lines.push(`Color[Line]: ${currentStyles.lineColor}`);
        if (currentStyles.borderColor) lines.push(`Color[Border]: ${currentStyles.borderColor}`);

        if (currentStyles.titleFontSize) lines.push(`Font[Title]: ${currentStyles.titleFontSize}`);
        if (currentStyles.headerFontSize) lines.push(`Font[Header]: ${currentStyles.headerFontSize}`);
        if (currentStyles.itemFontSize) lines.push(`Font[Item]: ${currentStyles.itemFontSize}`);

        lines.push('');

        const traverse = (items: AffinityItem[], parentId?: string) => {
            items.forEach(item => {
                const parentPart = parentId ? `, ${parentId}` : '';
                lines.push(`Item: ${item.id}, ${item.label}${parentPart}`);
                if (item.children && item.children.length > 0) {
                    traverse(item.children, item.id);
                }
            });
        };
        traverse(currentData);

        return lines.join('\n');
    }, []);

    const handleTabChange = (tab: 'manual' | 'dsl' | 'ai') => {
        if (tab === 'dsl') {
            setDsl(generateDSL(data, styles));
        }
        setActiveTab(tab);
    };

    const handleDslChange = (text: string) => {
        setDsl(text);
        try {
            const result = parseAffinityDSL(text);
            onChange(result.data, { ...styles, ...result.styles });
        } catch (e) { }
    };

    const updateItemLabel = (targetId: string, newLabel: string) => {
        const updateNode = (nodes: AffinityItem[]): AffinityItem[] => {
            return nodes.map(node => {
                if (node.id === targetId) return { ...node, label: newLabel };
                if (node.children) return { ...node, children: updateNode(node.children) };
                return node;
            });
        };
        onChange(updateNode(data), styles);
    };

    const addItem = (parentId?: string) => {
        const newId = `item_${Math.random().toString(36).substr(2, 5)}`;
        const newItem: AffinityItem = { id: newId, label: '新项目', children: [] };

        if (!parentId) {
            onChange([...data, newItem], styles);
        } else {
            const addToParent = (nodes: AffinityItem[]): AffinityItem[] => {
                return nodes.map(node => {
                    if (node.id === parentId) {
                        return { ...node, children: [...(node.children || []), newItem] };
                    }
                    if (node.children) return { ...node, children: addToParent(node.children) };
                    return node;
                });
            };
            onChange(addToParent(data), styles);
        }
    };

    const removeItem = (targetId: string) => {
        const removeFromNodes = (nodes: AffinityItem[]): AffinityItem[] => {
            return nodes
                .filter(node => node.id !== targetId)
                .map(node => ({
                    ...node,
                    children: node.children ? removeFromNodes(node.children) : []
                }));
        };
        onChange(removeFromNodes(data), styles);
    };

    const generateAiData = async () => {
        if (!aiInput.trim()) return alert('请输入统计场景描述');
        if (!aiConfig) return alert('AI 配置尚未就绪');

        setIsGenerating(true);
        try {
            const config = aiConfig.ai_config;
            const grammar = aiConfig.chart_grammars?.affinity;
            const activeProfile = config.profiles[config.active_profile];
            const rules = grammar?.dsl_specification?.rules || [];
            const examples = grammar?.dsl_specification?.few_shot_examples || [];

            const systemPrompt = `# 角色：系统图/亲和图数据生成专家
## 核心目标
将用户的问题描述转化为符合 Smart QC Tools 规范的系统图/亲和图 DSL 脚本。

## 语法规范
${rules.join('\n')}

## Few-Shot 示例
${examples.map((ex: any) => `Input: ${ex.input}\nOutput:\n${ex.output}`).join('\n\n')}

## 输出格式
1. 仅输出纯 DSL 代码。
2. 严禁包含 markdown 标记。
3. 严禁包含任何解释性文字或开场白。`;

            const response = await fetch(activeProfile.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${activeProfile.key || ''}`
                },
                body: JSON.stringify({
                    model: activeProfile.model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: aiInput }
                    ]
                })
            });

            if (!response.ok) throw new Error('API 调用失败');
            const result = await response.json();
            const content = result.choices[0].message.content;
            const rawDSL = content.replace(/```kj|```/g, '').trim();

            setDsl(rawDSL);
            const parsed = parseAffinityDSL(rawDSL);
            onChange(parsed.data, { ...styles, ...parsed.styles });
            setActiveTab('dsl');
        } catch (err) {
            console.error('AI 生成失败:', err);
            alert('生成失败，请检查 API 配置或输入内容');
        } finally {
            setIsGenerating(false);
        }
    };

    const renderNodeEditor = (item: AffinityItem) => {
        return (
            <div key={item.id} className="space-y-2">
                <div className="flex items-center gap-2 group">
                    <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 p-2 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                        <Edit3 size={14} className="text-slate-300" />
                        <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateItemLabel(item.id, e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-medium text-slate-700 w-full"
                        />
                    </div>
                    <button
                        onClick={() => addItem(item.id)}
                        className="p-1.5 bg-blue-50 text-blue-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-100"
                    >
                        <Plus size={12} />
                    </button>
                    <button
                        onClick={() => removeItem(item.id)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
                    >
                        <Trash2 size={12} />
                    </button>
                </div>
                {item.children && item.children.length > 0 && (
                    <div className="pl-6 border-l-2 border-slate-100 space-y-2 ml-2">
                        {item.children.map(child => renderNodeEditor(child))}
                    </div>
                )}
            </div>
        );
    };

    const activeProfileName = aiConfig?.ai_config?.profiles[aiConfig?.ai_config?.active_profile]?.name || '加载中...';

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* 顶栏控制 - Binary Matched with Pareto */}
            <div className="h-16 px-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-200">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'manual', label: '手动录入', icon: <Database size={15} /> },
                        { id: 'dsl', label: 'DSL 编辑器', icon: <Code2 size={15} /> },
                        { id: 'ai', label: 'AI 推理', icon: <Sparkles size={15} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as any)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 active:scale-95"
                            style={{
                                fontSize: '13px',
                                fontWeight: '600',
                                backgroundColor: activeTab === tab.id ? '#f1f5f9' : 'transparent',
                                color: activeTab === tab.id ? '#1d4ed8' : '#64748b'
                            }}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                <button
                    onClick={() => setShowDocs(true)}
                    className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                >
                    <HelpCircle size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'manual' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        <SidebarSection title="图表基本信息">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">图表标题</label>
                                    <input
                                        type="text"
                                        value={styles.title || ''}
                                        onChange={(e) => onChange(data, { ...styles, title: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold"
                                        placeholder="例如：故障原因关联分析"
                                        style={{ fontSize: '14px' }}
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">渲染方式</label>
                                        <select
                                            value={styles.type}
                                            onChange={(e) => onChange(data, { ...styles, type: e.target.value as any })}
                                            className="w-full h-9 px-2 text-sm font-semibold border border-slate-200 rounded-lg bg-white outline-none"
                                        >
                                            <option value="Card">卡片</option>
                                            <option value="Label">树状</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">布局方向</label>
                                        <select
                                            value={styles.layout}
                                            onChange={(e) => onChange(data, { ...styles, layout: e.target.value as any })}
                                            className="w-full h-9 px-2 text-sm font-semibold border border-slate-200 rounded-lg bg-white outline-none"
                                        >
                                            <option value="Horizontal">水平</option>
                                            <option value="Vertical">垂直</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider text-nowrap">视觉间距 (px)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="200"
                                            value={styles.itemGap}
                                            onChange={(e) => onChange(data, { ...styles, itemGap: parseInt(e.target.value) || 0 })}
                                            className="w-full h-9 px-3 text-sm font-semibold border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="层级项目录入">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">项目树结构</span>
                                    <button
                                        onClick={() => addItem()}
                                        className="p-1.5 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {data.map(item => renderNodeEditor(item))}
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="颜色方案配置">
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { key: 'titleColor', label: '标题颜色' },
                                    { key: 'headerColor', label: '分组头颜色' },
                                    { key: 'itemColor', label: '条目背景色' },
                                    { key: 'borderColor', label: '边框线条色' }
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                                        <span className="text-sm font-semibold text-slate-600" style={{ fontSize: '13px' }}>{item.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-mono text-slate-400">{(styles as any)[item.key]}</span>
                                            <input
                                                type="color"
                                                value={(styles as any)[item.key] || '#000000'}
                                                onChange={(e) => onChange(data, { ...styles, [item.key]: e.target.value })}
                                                className="w-8 h-8 rounded-lg cursor-pointer border-2 border-white shadow-sm ring-1 ring-slate-200"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SidebarSection>

                        <SidebarSection title="字号排标配置">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-5">
                                {[
                                    { key: 'titleFontSize', label: '主标题字号' },
                                    { key: 'headerFontSize', label: '分组/卡片字号' },
                                    { key: 'itemFontSize', label: '具体项字号' }
                                ].map(item => (
                                    <div key={item.key} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                            <span>{item.label}</span>
                                            <span className="text-blue-600">{(styles as any)[item.key]}px</span>
                                        </div>
                                        <input
                                            type="range" min="10" max="32" step="1"
                                            value={(styles as any)[item.key] || 12}
                                            onChange={(e) => onChange(data, { ...styles, [item.key]: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </SidebarSection>
                    </div>
                )}

                {activeTab === 'dsl' && (
                    <div className="flex-1 p-4 flex flex-col overflow-hidden">
                        <textarea
                            value={dsl}
                            onChange={(e) => handleDslChange(e.target.value)}
                            className="flex-1 w-full h-full bg-white text-slate-800 p-5 font-mono leading-7 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none custom-scrollbar shadow-sm"
                            style={{
                                fontSize: '14px',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                color: '#1e293b'
                            }}
                            spellCheck={false}
                            placeholder="输入 KJ-DSL 代码..."
                        />
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto bg-slate-50/30">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <label className="font-bold flex items-center gap-2" style={{ fontSize: '16px', color: '#1e293b' }}>
                                    <Sparkles size={18} className="text-blue-500" />
                                    统计场景描述
                                </label>
                                <div className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                    <span style={{ fontSize: '12px', color: '#065f46', fontWeight: '600' }}>{activeProfileName} (在线)</span>
                                </div>
                            </div>
                            <textarea
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                className="h-[320px] w-full bg-white text-slate-800 p-5 leading-relaxed border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none custom-scrollbar shadow-sm"
                                style={{
                                    fontSize: '14px',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                                }}
                                placeholder="例如：描述年度售后投诉的主要类别及其归因分析，模型将自动转化为 KJ-DSL 脚本..."
                                spellCheck={false}
                            />

                            <button
                                onClick={generateAiData}
                                disabled={isGenerating}
                                className="w-full h-12 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-50"
                                style={{
                                    backgroundColor: isGenerating ? '#94a3b8' : '#1d4ed8',
                                    color: '#ffffff',
                                    border: 'none',
                                    cursor: isGenerating ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span style={{ fontSize: '16px', fontWeight: '700' }}>AI 推理中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        <span style={{ fontSize: '16px', fontWeight: '700' }}>智能解析并回填</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Documentation Modal - Exact Matched with Pareto */}
            {mounted && showDocs && createPortal(
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                    onClick={() => setShowDocs(false)}
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
                                    <Database size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">System / Affinity DSL Spec</h2>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-2 uppercase tracking-widest font-sans">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                                        KJ Method Standard v1.2
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDocs(true)}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-slate-100"
                            >
                                <X size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-white">
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900 text-white rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-md">
                                    <Database size={14} />
                                    Property Manifest
                                </div>
                                <div className="p-6 bg-slate-50/50 rounded-2xl font-mono text-sm leading-relaxed text-slate-900 border border-slate-100 shadow-sm transition-all hover:border-blue-100">
                                    <div className="flex justify-between border-b border-white pb-3 mb-3">
                                        <span className="text-blue-800 font-black">Title:</span>
                                        <span className="text-slate-500 text-xs text-right font-sans">主标题文本</span>
                                    </div>
                                    <div className="flex justify-between border-b border-white pb-3 mb-3">
                                        <span className="text-indigo-800 font-black">Type:</span>
                                        <span className="text-slate-500 text-xs text-right font-sans">Card / Label</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <span className="text-emerald-800 font-black">Item:</span>
                                            <span className="text-slate-400 text-[10px] text-right font-sans">ID, 内容, 父ID</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-sm">
                                    <Sparkles size={14} />
                                    System / KJ Syntax Concept
                                </div>
                                <div className="p-6 bg-white rounded-2xl border-2 border-blue-50 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-3 bg-blue-50 text-blue-600 rounded-bl-xl font-black text-[10px]">HIERARCHY</div>
                                    <h4 className="font-black text-slate-900 mb-2">层级逻辑 (Hierarchy Logic)</h4>
                                    <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5 font-sans leading-relaxed">
                                        <li><strong>层级深度</strong>：支持 4 级以内的归纳与分组（KJ法核心）。</li>
                                        <li><strong>父子联动</strong>：通过 ParentID 建立精准的逻辑关联树。</li>
                                        <li><strong>卡片模式</strong>：自动根据深度 L1/L2 循环色彩背景。</li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex justify-center shrink-0">
                            <button
                                onClick={() => setShowDocs(false)}
                                className="px-16 py-4 bg-slate-900 text-white font-black rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all text-sm uppercase tracking-widest"
                            >
                                Specification Read
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
