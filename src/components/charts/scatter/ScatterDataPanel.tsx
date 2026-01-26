'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Sparkles, Database, Code, HelpCircle, X, Loader2, ScatterChart as ScatterIcon, Axis3d } from 'lucide-react';
import { ScatterPoint, ScatterChartStyles, INITIAL_SCATTER_DSL, DEFAULT_SCATTER_STYLES } from './types';
import { SidebarSection } from '@/components/layout/Sidebar';

interface ScatterDataPanelProps {
    data: ScatterPoint[];
    onChange: (newData: ScatterPoint[], styles: ScatterChartStyles) => void;
    styles: ScatterChartStyles;
}

export function ScatterDataPanel({ data, onChange, styles }: ScatterDataPanelProps) {
    const [activeTab, setActiveTab] = useState<'manual' | 'dsl' | 'ai'>('manual');
    const [dsl, setDsl] = useState(INITIAL_SCATTER_DSL);
    const [showDocs, setShowDocs] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Manual input state
    const [manualDataInput, setManualDataInput] = useState('');
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiConfig, setAiConfig] = useState<any>(null);




    // 加载 AI 配置
    useEffect(() => {
        fetch('/chart_spec.json')
            .then(res => res.json())
            .then(data => setAiConfig(data))
            .catch(err => console.error('加载 AI 配置失败:', err));
    }, []);

    // Generate DSL from current state
    const generateDSL = (currentData: ScatterPoint[], currentStyles: ScatterChartStyles) => {
        let lines: string[] = [];
        if (currentStyles.title) lines.push(`Title: ${currentStyles.title}`);
        if (currentStyles.xAxisLabel) lines.push(`XAxis: ${currentStyles.xAxisLabel}`);
        if (currentStyles.yAxisLabel) lines.push(`YAxis: ${currentStyles.yAxisLabel}`);
        if (currentStyles.zAxisLabel) lines.push(`ZAxis: ${currentStyles.zAxisLabel}`);

        if (currentStyles.pointColor) lines.push(`Color[Point]: ${currentStyles.pointColor}`);
        if (currentStyles.trendColor) lines.push(`Color[Trend]: ${currentStyles.trendColor}`);
        if (currentStyles.baseSize) lines.push(`Size[Base]: ${currentStyles.baseSize}`);
        if (currentStyles.opacity) lines.push(`Opacity: ${currentStyles.opacity}`);
        if (currentStyles.showTrend !== undefined) lines.push(`ShowTrend: ${currentStyles.showTrend}`);
        if (currentStyles.titleFontSize) lines.push(`Font[Title]: ${currentStyles.titleFontSize}`);
        if (currentStyles.baseFontSize) lines.push(`Font[Base]: ${currentStyles.baseFontSize}`);

        lines.push('');
        lines.push('# 样本数据 (X, Y, [Size])');
        currentData.forEach(item => {
            lines.push(`- ${item.x}, ${item.y}${item.z ? `, ${item.z}` : ''}`);
        });

        return lines.join('\n');
    };

    // Parse DSL to state
    const parseDSL = (content: string) => {
        const lines = content.split('\n');
        const newItems: ScatterPoint[] = [];
        const newStyles: ScatterChartStyles = { ...DEFAULT_SCATTER_STYLES };

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            // Metadata parsing
            if (trimmed.includes(':') && !trimmed.startsWith('-')) {
                const [key, ...values] = trimmed.split(':');
                const value = values.join(':').trim();

                switch (key.trim()) {
                    case 'Title': newStyles.title = value; break;
                    case 'XAxis': newStyles.xAxisLabel = value; break;
                    case 'YAxis': newStyles.yAxisLabel = value; break;
                    case 'ZAxis': newStyles.zAxisLabel = value; break;
                    case 'Color[Point]': newStyles.pointColor = value; break;
                    case 'Color[Trend]': newStyles.trendColor = value; break;
                    case 'Size[Base]': newStyles.baseSize = parseFloat(value); break;
                    case 'Opacity': newStyles.opacity = parseFloat(value); break;

                    case 'ShowTrend': newStyles.showTrend = value.toLowerCase() === 'true'; break;
                    case 'Font[Title]': newStyles.titleFontSize = parseInt(value); break;
                    case 'Font[Base]': newStyles.baseFontSize = parseInt(value); break;
                }
                return;
            }

            // Data parsing
            if (trimmed.startsWith('-')) {
                const cleanLine = trimmed.substring(1).trim();
                const parts = cleanLine.split(',').map(s => s.trim());
                if (parts.length >= 2) {
                    const x = parseFloat(parts[0]);
                    const y = parseFloat(parts[1]);
                    const z = parts[2] ? parseFloat(parts[2]) : undefined;

                    if (!isNaN(x) && !isNaN(y)) {
                        newItems.push({
                            id: Math.random().toString(36).substr(2, 9),
                            x, y, z
                        });
                    }
                }
            }
        });

        onChange(newItems, newStyles);
        setManualDataInput(newItems.map(p => `${p.x}, ${p.y}${p.z ? `, ${p.z}` : ''}`).join('\n'));
    };

    useEffect(() => {
        setMounted(true);
        if (data.length === 0 && dsl) {
            parseDSL(dsl);
        } else if (data.length > 0) {
            setManualDataInput(data.map(p => `${p.x}, ${p.y}${p.z ? `, ${p.z}` : ''}`).join('\n'));
        }
    }, []);

    // Handle Manual Input Change
    const handleManualDataChange = (val: string) => {
        setManualDataInput(val);
        const lines = val.split('\n');
        const newItems: ScatterPoint[] = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            const parts = trimmed.split(',').map(s => s.trim());
            if (parts.length >= 2) {
                const x = parseFloat(parts[0]);
                const y = parseFloat(parts[1]);
                const z = parts[2] ? parseFloat(parts[2]) : undefined;
                if (!isNaN(x) && !isNaN(y)) {
                    newItems.push({
                        id: Math.random().toString(36).substr(2, 9),
                        x, y, z
                    });
                }
            }
        });
        onChange(newItems, styles);
    };

    const handleTabChange = (tab: 'manual' | 'dsl' | 'ai') => {
        if (tab === 'dsl') {
            setDsl(generateDSL(data, styles));
        } else if (tab === 'manual' && activeTab === 'dsl') {
            parseDSL(dsl);
        }
        setActiveTab(tab);
    };

    // Initialize defaults on mount if empty
    useEffect(() => {
        if (data.length === 0) {
            parseDSL(dsl);
        }
    }, [data.length]); // Check only once/stable

    const generateAiData = async () => {
        if (!aiInput.trim()) return alert('请输入统计场景描述');
        if (!aiConfig) return alert('AI 配置尚未就绪');

        setIsGenerating(true);
        try {
            const config = aiConfig.ai_config;
            const grammar = aiConfig.chart_grammars?.scatter;
            const activeProfile = config.profiles[config.active_profile];
            const rules = grammar?.dsl_specification?.rules || [];
            const examples = grammar?.dsl_specification?.few_shot_examples || [];

            const systemPrompt = `# 角色：散点图数据生成专家
## 核心目标
将用户的问题描述转化为符合 Smart QC Tools 规范的散点图 DSL 脚本。

## 语法规范
${rules.join('\n')}

## Few-Shot 示例
${examples.map((ex: any) => `Input: ${ex.input}\nOutput:\n${ex.output}`).join('\n\n')}

## 输出格式
1. 仅输出纯 DSL 代码。
2. 严禁包含 markdown 标记（如 \`\`\`scatter 或 \`\`\`）。
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

            const rawDSL = content.replace(/```scatter|```/g, '').trim();
            setDsl(rawDSL);
            parseDSL(rawDSL);
            setActiveTab('dsl');
        } catch (err) {
            console.error('AI 生成失败:', err);
            alert('生成失败，请检查 API 配置');
        } finally {
            setIsGenerating(false);
        }
    };

    const activeProfileName = aiConfig?.ai_config?.profiles[aiConfig?.ai_config?.active_profile]?.name || '加载中...';

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Top Bar - More compact */}
            <div className="h-12 px-3 flex items-center justify-between shrink-0 bg-white border-b border-slate-200">
                <div className="flex items-center gap-1">
                    {[
                        { id: 'manual', label: '手动录入', icon: <Database size={14} /> },
                        { id: 'dsl', label: 'DSL 编辑器', icon: <Code size={14} /> },
                        { id: 'ai', label: 'AI 推理', icon: <Sparkles size={14} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as any)}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all shrink-0 active:scale-95 text-[12px] font-semibold ${activeTab === tab.id ? 'bg-slate-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowDocs(true)}
                    className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-500 transition-colors"
                >
                    <HelpCircle size={16} />
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'manual' && (
                    <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
                        <SidebarSection title="图表基本配置">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-500">图表标题</label>
                                    <input
                                        type="text"
                                        value={styles.title}
                                        onChange={(e) => onChange(data, { ...styles, title: e.target.value })}
                                        className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold"
                                        placeholder="输入图表标题"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2.5">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500">X轴标签</label>
                                        <input
                                            type="text"
                                            value={styles.xAxisLabel}
                                            onChange={(e) => onChange(data, { ...styles, xAxisLabel: e.target.value })}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500">Y轴标签</label>
                                        <input
                                            type="text"
                                            value={styles.yAxisLabel}
                                            onChange={(e) => onChange(data, { ...styles, yAxisLabel: e.target.value })}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-500">Z轴标签</label>
                                        <input
                                            type="text"
                                            value={styles.zAxisLabel || ''}
                                            onChange={(e) => onChange(data, { ...styles, zAxisLabel: e.target.value })}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="原始数据录入">
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-xs font-bold text-slate-500">坐标数据 (x, y, [z])</span>
                                    <span className="text-[11px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                        N = {data.length}
                                    </span>
                                </div>
                                <textarea
                                    value={manualDataInput}
                                    onChange={(e) => handleManualDataChange(e.target.value)}
                                    className="w-full min-h-[160px] px-2.5 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-y shadow-sm"
                                    placeholder={"10, 20\n15, 25\n20, 30, 5\n..."}
                                    spellCheck={false}
                                />
                            </div>
                        </SidebarSection>

                        <SidebarSection title="样式与分析">
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">视觉配置</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">点颜色</span>
                                            <input
                                                type="color"
                                                value={styles.pointColor}
                                                onChange={(e) => onChange(data, { ...styles, pointColor: e.target.value })}
                                                className="w-5 h-5 rounded cursor-pointer border border-slate-200"
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">趋势线</span>
                                            <input
                                                type="color"
                                                value={styles.trendColor}
                                                onChange={(e) => onChange(data, { ...styles, trendColor: e.target.value })}
                                                className="w-5 h-5 rounded cursor-pointer border border-slate-200"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">参数微调</p>
                                        <div className="space-y-0.5">
                                            <div className="flex justify-between text-[11px] text-slate-500">
                                                <span>基准大小</span>
                                                <span className="text-blue-600 font-mono font-medium">{styles.baseSize}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="2" max="20"
                                                value={styles.baseSize}
                                                onChange={(e) => onChange(data, { ...styles, baseSize: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="flex justify-between text-[11px] text-slate-500">
                                                <span>透明度</span>
                                                <span className="text-blue-600 font-mono font-medium">{styles.opacity}</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0.1" max="1" step="0.1"
                                                value={styles.opacity}
                                                onChange={(e) => onChange(data, { ...styles, opacity: parseFloat(e.target.value) })}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                        <label className="text-xs font-semibold text-slate-600">显示回归趋势线</label>
                                        <input
                                            type="checkbox"
                                            checked={styles.showTrend}
                                            onChange={(e) => onChange(data, { ...styles, showTrend: e.target.checked })}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="字体排版">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            <span>主标题字号</span>
                                            <span className="text-blue-600 font-mono">{styles.titleFontSize || 20}px</span>
                                        </div>
                                        <input
                                            type="range" min="12" max="32" step="1"
                                            value={styles.titleFontSize || 20}
                                            onChange={(e) => onChange(data, { ...styles, titleFontSize: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                            <span>轴标签字号</span>
                                            <span className="text-blue-600 font-mono">{styles.baseFontSize || 12}px</span>
                                        </div>
                                        <input
                                            type="range" min="8" max="20" step="1"
                                            value={styles.baseFontSize || 12}
                                            onChange={(e) => onChange(data, { ...styles, baseFontSize: parseInt(e.target.value) })}
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SidebarSection>
                    </div>
                )}

                {activeTab === 'dsl' && (
                    <div className="flex-1 overflow-hidden relative group">
                        <textarea
                            value={dsl}
                            onChange={(e) => {
                                const newVal = e.target.value;
                                setDsl(newVal);
                            }}
                            onKeyUp={(e) => {
                                // Simple debounce
                                const target = e.currentTarget;
                                if ((target as any)._timeout) clearTimeout((target as any)._timeout);
                                (target as any)._timeout = setTimeout(() => {
                                    parseDSL(target.value);
                                }, 300);
                            }}
                            className="w-full h-full p-6 font-mono text-sm bg-slate-900 text-slate-300 focus:outline-none resize-none leading-relaxed"
                            spellCheck={false}
                        />
                        <div className="absolute top-4 right-4 px-3 py-1 bg-white/10 text-white/50 text-xs rounded-full backdrop-blur-sm pointer-events-none">
                            CMD + S to format
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="flex-1 flex flex-col p-6 gap-6 overflow-hidden bg-slate-50/30">
                        <div className="flex flex-col gap-3 shrink-0">
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
                                placeholder="例如：分析产品 X 与产品 Y 之间的相关性逻辑，模型将自动转化为 DSL 脚本并回填数据。"
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
                                    outline: 'none',
                                    cursor: isGenerating ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>AI 推理中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} style={{ color: '#ffffff' }} />
                                        <span style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>智能解析并回填</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>


            {/* Help Modal - Aligned with Histogram/Pareto style */}
            {
                mounted && showDocs && createPortal(
                    <div
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={() => setShowDocs(false)}
                    >
                        <div
                            className="bg-white w-[560px] max-h-[85vh] rounded-2xl flex flex-col overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200"
                            style={{ backgroundColor: '#ffffff' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-10 py-8 flex items-center justify-between border-b border-slate-100 bg-white shrink-0">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-amber-50 rounded-xl">
                                        <ScatterIcon size={24} className="text-amber-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Scatter DSL Specification</h2>
                                        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-2 uppercase tracking-widest font-sans">
                                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></span>
                                            XYZ Axis Logic v1.0
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

                            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-white">
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900 text-white rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-md">
                                        <Database size={14} />
                                        Property Manifest
                                    </div>
                                    <div className="p-6 bg-slate-50/50 rounded-2xl font-mono text-sm leading-relaxed text-slate-900 border border-slate-100">
                                        <div className="flex flex-col gap-2 border-b border-white pb-3 mb-3">
                                            <p className="text-blue-800 font-bold">Title: 图表标题</p>
                                            <p className="text-slate-600">XAxis: X轴标签</p>
                                            <p className="text-slate-600">YAxis: Y轴标签</p>
                                            <p className="text-slate-600">ZAxis: Z轴/大小标签 (可选)</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <p className="text-amber-600">Color[Point]: #HEX</p>
                                            <p className="text-amber-600">Color[Trend]: #HEX</p>
                                            <p className="text-purple-600">Size[Base]: 6 (基准大小)</p>
                                            <p className="text-purple-600">Opacity: 0.7 (透明度)</p>
                                            <p className="text-green-600">ShowTrend: true/false</p>
                                            <p className="text-indigo-600">Font[Title]: 20</p>
                                            <p className="text-indigo-600">Font[Base]: 12</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-600 text-white rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-md">
                                        <Code size={14} />
                                        数据格式 (CSV Style)
                                    </div>
                                    <div className="p-6 bg-slate-50/50 rounded-2xl font-mono text-sm leading-relaxed text-slate-800 border border-slate-100">
                                        <p className="text-slate-500 mb-2"># 格式: X, Y, [Z]</p>
                                        <p className="text-slate-800">- 10.5, 20.3</p>
                                        <p className="text-slate-800">- 15.2, 25.1, 10 <span className="text-slate-400">// 带气泡大小</span></p>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
}
