'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Sparkles, Database, Code, HelpCircle, X, Loader2 } from 'lucide-react';
import { ParetoItem, ParetoChartStyles, INITIAL_PARETO_DSL, DEFAULT_PARETO_STYLES } from './types';
import { SidebarSection } from '@/components/layout/Sidebar';

interface ParetoDataPanelProps {
    data: ParetoItem[];
    onChange: (newData: ParetoItem[], styles: ParetoChartStyles) => void;
    styles: ParetoChartStyles;
    showLine: boolean;
    onShowLineChange: (val: boolean) => void;
}



export function ParetoDataPanel({ data, onChange, styles, showLine, onShowLineChange }: ParetoDataPanelProps) {
    const [activeTab, setActiveTab] = useState<'manual' | 'dsl' | 'ai'>('manual');
    const [dsl, setDsl] = useState(INITIAL_PARETO_DSL);
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiConfig, setAiConfig] = useState<any>(null);
    const [showDocs, setShowDocs] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 将当前数据与样式状态序列化为 DSL 脚本
    const generateDSL = (currentData: ParetoItem[], currentStyles: ParetoChartStyles) => {
        let lines: string[] = [];
        if (currentStyles.title) lines.push(`Title: ${currentStyles.title}`);
        if (currentStyles.titleColor) lines.push(`Color[Title]: ${currentStyles.titleColor}`);
        if (currentStyles.barColor) lines.push(`Color[Bar]: ${currentStyles.barColor}`);
        if (currentStyles.lineColor) lines.push(`Color[Line]: ${currentStyles.lineColor}`);
        if (currentStyles.markLineColor) lines.push(`Color[MarkLine]: ${currentStyles.markLineColor}`);
        if (currentStyles.titleFontSize) lines.push(`Font[Title]: ${currentStyles.titleFontSize}`);
        if (currentStyles.barFontSize) lines.push(`Font[Bar]: ${currentStyles.barFontSize}`);
        if (currentStyles.lineFontSize) lines.push(`Font[Line]: ${currentStyles.lineFontSize}`);
        if (currentStyles.baseFontSize) lines.push(`Font[Base]: ${currentStyles.baseFontSize}`);
        if (currentStyles.decimals !== undefined) lines.push(`Decimals: ${currentStyles.decimals}`);

        lines.push(''); // 空行分隔样式与数据项

        currentData.forEach(item => {
            lines.push(`- ${item.name}: ${item.value}`);
        });

        return lines.join('\n');
    };

    // 加载 AI 配置
    useEffect(() => {
        fetch('/chart_spec.json')
            .then(res => res.json())
            .then(data => setAiConfig(data)) // Store full config
            .catch(err => console.error('加载 AI 配置失败:', err));
    }, []);

    // DSL 解析引擎
    const parseDSL = (content: string) => {
        const lines = content.split('\n');
        const newItems: ParetoItem[] = [];
        const newStyles: ParetoChartStyles = { ...DEFAULT_PARETO_STYLES };

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;

            // 解析标题
            const titleMatch = trimmed.match(/^Title:\s*(.+)/);
            if (titleMatch) {
                newStyles.title = titleMatch[1].trim();
                return;
            }

            // 解析色彩样式
            const colorMatch = trimmed.match(/Color\[(Bar|Line|MarkLine|Title)\]:\s*(#[0-9a-fA-F]+)/);
            if (colorMatch) {
                const key = colorMatch[1].charAt(0).toLowerCase() + colorMatch[1].slice(1) + 'Color';
                (newStyles as any)[key] = colorMatch[2];
                return;
            }

            // 解析字号样式
            const fontMatch = trimmed.match(/Font\[(Bar|Line|Base|Title)\]:\s*(\d+)/);
            if (fontMatch) {
                const key = fontMatch[1].charAt(0).toLowerCase() + fontMatch[1].slice(1) + 'FontSize';
                (newStyles as any)[key] = parseInt(fontMatch[2]);
                return;
            }

            // 解析小数点位数
            const decimalMatch = trimmed.match(/Decimals:\s*(\d+)/);
            if (decimalMatch) {
                newStyles.decimals = parseInt(decimalMatch[1]);
                return;
            }

            // 解析数据项
            const itemMatch = trimmed.match(/^-\s*(.+):\s*(\d+)/);
            if (itemMatch) {
                newItems.push({
                    id: Math.random().toString(36).substr(2, 9),
                    name: itemMatch[1].trim(),
                    value: parseInt(itemMatch[2])
                });
            }
        });

        if (newItems.length > 0) {
            onChange(newItems, newStyles);
        } else {
            onChange(data, newStyles);
        }
    };

    // 联动处理：手动 -> DSL
    const handleTabChange = (tab: 'manual' | 'dsl' | 'ai') => {
        if (tab === 'dsl') {
            setDsl(generateDSL(data, styles));
        }
        setActiveTab(tab);
    };

    // 联动处理：DSL -> 全局状态
    useEffect(() => {
        if (activeTab === 'dsl') {
            parseDSL(dsl);
        }
    }, [dsl, activeTab]);

    const updateItem = (id: string, field: keyof ParetoItem, value: string | number) => {
        const newData = data.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        });
        onChange(newData, styles);
    };

    const addItem = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        onChange([...data, { id: newId, name: '新项目', value: 0 }], styles);
    };

    const removeItem = (id: string) => {
        onChange(data.filter(item => item.id !== id), styles);
    };

    const generateAiData = async () => {
        if (!aiInput.trim()) return alert('请输入统计场景描述');
        if (!aiConfig) return alert('AI 配置尚未就绪');

        setIsGenerating(true);
        try {
            const config = aiConfig.ai_config;
            const grammar = aiConfig.chart_grammars?.pareto;
            const activeProfile = config.profiles[config.active_profile];
            const rules = grammar?.dsl_specification?.rules || [];
            const examples = grammar?.dsl_specification?.few_shot_examples || [];

            const systemPrompt = `# 角色：排列图数据生成专家
## 核心目标
将用户的问题描述转化为符合 Smart QC Tools 规范的排列图 DSL 脚本。

## 语法规范
${rules.join('\n')}

## Few-Shot 示例
${examples.map((ex: any) => `Input: ${ex.input}\nOutput:\n${ex.output}`).join('\n\n')}

## 输出格式
1. 仅输出纯 DSL 代码。
2. 严禁包含 markdown 标记（如 \`\`\`pareto 或 \`\`\`）。
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

            const rawDSL = content.replace(/```pareto|```/g, '').trim();
            setDsl(rawDSL);
            parseDSL(rawDSL); // 核心：AI -> 手动录入的即时解析
            setActiveTab('dsl');
        } catch (err) {
            console.error('AI 生成失败:', err);
            alert('生成失败，请检查 API 配置或输入内容');
        } finally {
            setIsGenerating(false);
        }
    };

    const activeProfileName = aiConfig?.ai_config?.profiles[aiConfig?.ai_config?.active_profile]?.name || '加载中...';

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* 顶栏控制 */}
            <div className="h-16 px-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-200">
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'manual', label: '手动录入', icon: <Database size={15} /> },
                        { id: 'dsl', label: 'DSL 编辑器', icon: <Code size={15} /> },
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

            {/* 内容容器 */}
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
                                        placeholder="例如：故障频数排列图"
                                        style={{ fontSize: '14px' }}
                                    />
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="统计指标录入">
                            <div className="space-y-3">
                                <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
                                    <div className="col-span-7">项目名称</div>
                                    <div className="col-span-3">频数</div>
                                    <div className="col-span-2 text-center">-</div>
                                </div>
                                <div className="space-y-2">
                                    {data.map((item) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center group">
                                            <div className="col-span-7">
                                                <input
                                                    type="text"
                                                    value={item.name}
                                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                                                    style={{ fontSize: '14px' }}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="number"
                                                    value={item.value}
                                                    onChange={(e) => updateItem(item.id, 'value', Number(e.target.value))}
                                                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-blue-600"
                                                    style={{ fontSize: '14px' }}
                                                />
                                            </div>
                                            <div className="col-span-2 flex justify-center">
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addItem}
                                    className="w-full py-3 flex items-center justify-center gap-2 text-sm text-blue-600 font-bold bg-blue-50/50 border border-dashed border-blue-200 rounded-xl hover:bg-blue-50 transition-all"
                                    style={{ fontSize: '14px' }}
                                >
                                    <Plus size={18} />
                                    添加统计项
                                </button>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="颜色方案配置">
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { key: 'titleColor', label: '标题颜色' },
                                    { key: 'barColor', label: '柱形颜色' },
                                    { key: 'lineColor', label: '折线颜色' },
                                    { key: 'markLineColor', label: '关键线颜色' }
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

                        <SidebarSection title="图表高级配置">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <label htmlFor="showLine" className="text-sm font-semibold text-slate-600" style={{ fontSize: '14px' }}>80% 关键线</label>
                                    <input
                                        type="checkbox"
                                        id="showLine"
                                        checked={showLine}
                                        onChange={(e) => onShowLineChange(e.target.checked)}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-bold text-slate-600" style={{ fontSize: '13px' }}>小数点保留位数</label>
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold text-xs">
                                            {styles.decimals} 位
                                        </span>
                                    </div>
                                    <div className="px-1">
                                        <input
                                            type="range" min="0" max="4" step="1"
                                            value={styles.decimals ?? 1}
                                            onChange={(e) => onChange(data, { ...styles, decimals: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            style={{ margin: '0', display: 'block' }}
                                        />
                                        <div className="flex justify-between mt-2 px-0.5">
                                            {['0', '1', '2', '3', '4'].map(v => (
                                                <span key={v} className="text-[10px] font-bold text-slate-400">{v}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="字号排标配置">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-5">
                                {[
                                    { key: 'titleFontSize', label: '主标题字号' },
                                    { key: 'baseFontSize', label: '全局轴字号' },
                                    { key: 'barFontSize', label: '柱形成交字号' },
                                    { key: 'lineFontSize', label: '折线频率字号' }
                                ].map(item => (
                                    <div key={item.key} className="space-y-2">
                                        <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                                            <span>{item.label}</span>
                                            <span className="text-blue-600">{(styles as any)[item.key]}px</span>
                                        </div>
                                        <input
                                            type="range" min="8" max="24" step="1"
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
                            onChange={(e) => setDsl(e.target.value)}
                            className="flex-1 w-full h-full bg-white text-slate-800 p-5 font-mono leading-7 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none custom-scrollbar shadow-sm"
                            style={{
                                fontSize: '14px',
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                                color: '#1e293b'
                            }}
                            spellCheck={false}
                            placeholder="输入排列图 DSL..."
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
                                placeholder="例如：描述2023年客户投诉的主要类别及其频数，模型将自动转化为 DSL 脚本..."
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

            {/* Documentation Modal (Using Portal to escape Sidebar constraints) */}
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
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Pareto DSL Specification</h2>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-2 uppercase tracking-widest font-sans">
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span>
                                        Full Logic Manifest v2.1
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowDocs(false)}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-slate-100"
                            >
                                <X size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                            </button>
                        </div>

                        {/* Modal Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-white">
                            {/* Section: Configuration Mapping */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900 text-white rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-md">
                                    <Database size={14} />
                                    Property Manifest
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-6 bg-slate-50/50 rounded-2xl font-mono text-sm leading-relaxed text-slate-900 border border-slate-100 shadow-sm transition-all hover:border-blue-100">
                                        <div className="flex justify-between border-b border-white pb-3 mb-3">
                                            <span className="text-blue-800 font-black">Title:</span>
                                            <span className="text-slate-500 text-xs text-right font-sans">主标题文本内容</span>
                                        </div>
                                        <div className="flex flex-col gap-2 border-b border-white pb-3 mb-3">
                                            <div className="flex justify-between">
                                                <span className="text-indigo-800 font-black">Color[*]:</span>
                                                <span className="text-slate-400 text-[10px] text-right font-sans">#十六进制色码</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500 font-sans pl-4 border-l-2 border-indigo-100 italic">
                                                <span>• Bar (柱形)</span>
                                                <span>• Line (曲线)</span>
                                                <span>• Title (标题)</span>
                                                <span>• MarkLine (80%线)</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 border-b border-white pb-3 mb-3">
                                            <div className="flex justify-between">
                                                <span className="text-emerald-800 font-black">Font[*]:</span>
                                                <span className="text-slate-400 text-[10px] text-right font-sans">像素级字号 (px)</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500 font-sans pl-4 border-l-2 border-emerald-100 italic">
                                                <span>• Title (主标题)</span>
                                                <span>• Base (坐标轴)</span>
                                                <span>• Bar (数值标签)</span>
                                                <span>• Line (百分比)</span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-amber-800 font-black">Decimals:</span>
                                            <span className="text-slate-500 text-xs text-right font-sans">累计频率精度 (0-4)</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Logic Concepts */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-50 text-blue-700 rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-sm">
                                    <Sparkles size={14} />
                                    Logic & Calculation
                                </div>
                                <div className="space-y-4">
                                    <div className="p-6 bg-white rounded-2xl border-2 border-blue-50 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 bg-blue-50 text-blue-600 rounded-bl-xl font-black text-[10px]">80/20 RULE</div>
                                        <h4 className="font-black text-slate-900 mb-2">自动计算逻辑 (Smart Logic)</h4>
                                        <ul className="text-xs text-slate-600 space-y-2 list-disc pl-5 font-sans leading-relaxed">
                                            <li>系统自动按频数<strong>降序排列</strong>所有项目，重新计算权重。</li>
                                            <li><strong>80% 关键线</strong>：自动在累计百分比达 80% 的映射点标记 MarkLine。</li>
                                            <li><strong>ABC 分类</strong>：0-80% 为 A 类核心问题，80-90% 为 B 类，90-100% 为 C 类。</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Complex Enterprise Case */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-sm">
                                    <Sparkles size={14} />
                                    Full Enterprise Case (Complex)
                                </div>
                                <div className="p-8 bg-slate-900 rounded-2xl font-mono text-xs leading-relaxed text-slate-300 shadow-xl relative group">
                                    <div className="absolute top-6 right-8 text-[10px] text-slate-500 font-bold uppercase tracking-widest">Production DSL</div>
                                    <p className="text-slate-500 mb-4 italic text-[10px] font-sans"># 年度售后投诉全链路归因分析</p>
                                    <p className="text-blue-400 font-black">Title: 2024 年度核心业务质量痛点分析</p>
                                    <p className="text-indigo-400 font-bold">Color[Bar]: #3b82f6</p>
                                    <p className="text-amber-400 font-bold">Color[MarkLine]: #ef4444</p>
                                    <p className="text-slate-400 font-bold">Color[Title]: #1e293b</p>
                                    <p className="text-slate-400">Font[Title]: 24</p>
                                    <p className="text-slate-400">Font[Base]: 14</p>
                                    <p className="text-emerald-400">Decimals: 2</p>
                                    <br />
                                    <div className="space-y-1.5">
                                        <p className="text-white"><span className="text-slate-600 font-normal">-</span> 物流丢件/破损: 428</p>
                                        <p className="text-white"><span className="text-slate-600 font-normal">-</span> 系统高延迟/宕机: 215</p>
                                        <p className="text-white"><span className="text-slate-600 font-normal">-</span> 客服态度生硬: 89</p>
                                        <p className="text-white"><span className="text-slate-600 font-normal">-</span> 实物与图不符: 56</p>
                                        <p className="text-white"><span className="text-slate-600 font-normal">-</span> 退款流程冗长: 32</p>
                                        <p className="text-white"><span className="text-slate-600 font-normal">-</span> 包装不环保: 12</p>
                                        <p className="text-white"><span className="text-slate-600 font-normal">-</span> 其他细项: 8</p>
                                    </div>
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
}
