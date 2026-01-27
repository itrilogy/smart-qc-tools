'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Database, Code, HelpCircle, X, Loader2, RefreshCw } from 'lucide-react';
import { HistogramChartStyles, INITIAL_HISTOGRAM_DSL, DEFAULT_HISTOGRAM_STYLES } from './types';
import { SidebarSection } from '@/components/layout/Sidebar';

interface HistogramDataPanelProps {
    data: number[];
    onChange: (newData: number[], styles: HistogramChartStyles) => void;
    styles: HistogramChartStyles;
}



export function HistogramDataPanel({ data, onChange, styles }: HistogramDataPanelProps) {
    const [activeTab, setActiveTab] = useState<'manual' | 'dsl' | 'ai'>('manual');
    const [dsl, setDsl] = useState(INITIAL_HISTOGRAM_DSL);
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiConfig, setAiConfig] = useState<any>(null);
    const [showDocs, setShowDocs] = useState(false);
    const [mounted, setMounted] = useState(false);

    // 手动模式下的临时数据输入状态 (用于 textarea)
    const [rawDataInput, setRawDataInput] = useState(data.join('\n'));

    // 追踪数据是否来自内部输入
    const isInternalChange = React.useRef(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 只在外部数据变化时同步 (如DSL解析、AI生成)
    useEffect(() => {
        if (!isInternalChange.current) {
            setRawDataInput(data.join('\n'));
        }
        isInternalChange.current = false;
    }, [data]);

    // 加载 AI 配置
    useEffect(() => {
        fetch('/chart_spec.json')
            .then(res => res.json())
            .then(data => setAiConfig(data)) // Store full data
            .catch(err => console.error('加载 AI 配置失败:', err));
    }, []);

    // 生成 DSL
    const generateDSL = (currentData: number[], currentStyles: HistogramChartStyles) => {
        let lines: string[] = [];
        if (currentStyles.title) lines.push(`Title: ${currentStyles.title}`);
        if (currentStyles.titleColor) lines.push(`Color[Title]: ${currentStyles.titleColor}`);
        if (currentStyles.barColor) lines.push(`Color[Bar]: ${currentStyles.barColor}`);
        if (currentStyles.uslColor) lines.push(`Color[USL]: ${currentStyles.uslColor}`);
        if (currentStyles.lslColor) lines.push(`Color[LSL]: ${currentStyles.lslColor}`);
        if (currentStyles.targetColor) lines.push(`Color[Target]: ${currentStyles.targetColor}`);
        if (currentStyles.curveColor) lines.push(`Color[Curve]: ${currentStyles.curveColor}`);

        if (currentStyles.titleFontSize) lines.push(`Font[Title]: ${currentStyles.titleFontSize}`);
        if (currentStyles.baseFontSize) lines.push(`Font[Base]: ${currentStyles.baseFontSize}`);
        if (currentStyles.barFontSize) lines.push(`Font[Bar]: ${currentStyles.barFontSize}`);

        lines.push('');
        lines.push('# 规格限配置');
        if (currentStyles.usl !== undefined) lines.push(`USL: ${currentStyles.usl}`);
        if (currentStyles.lsl !== undefined) lines.push(`LSL: ${currentStyles.lsl}`);
        if (currentStyles.target !== undefined) lines.push(`Target: ${currentStyles.target}`);

        lines.push('');
        lines.push('# 分组配置');
        lines.push(`Bins: ${currentStyles.bins ?? 'auto'}`);
        lines.push(`ShowCurve: ${currentStyles.showCurve}`);

        lines.push('');
        lines.push('# 原始数据');
        currentData.forEach(val => {
            lines.push(`- ${val}`);
        });

        return lines.join('\n');
    };

    // 解析 DSL
    const parseDSL = (content: string) => {
        const lines = content.split('\n');
        const newData: number[] = [];
        const newStyles: HistogramChartStyles = { ...DEFAULT_HISTOGRAM_STYLES };

        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            // 基础样式
            const titleMatch = trimmed.match(/^Title:\s*(.+)/);
            if (titleMatch) { newStyles.title = titleMatch[1].trim(); return; }

            // 颜色
            const colorMatch = trimmed.match(/Color\[(Bar|USL|LSL|Target|Curve|Title)\]:\s*(#[0-9a-fA-F]+)/);
            if (colorMatch) {
                const key = colorMatch[1].charAt(0).toLowerCase() + colorMatch[1].slice(1) + 'Color';
                (newStyles as any)[key] = colorMatch[2];
                return;
            }

            // 字号
            const fontMatch = trimmed.match(/Font\[(Bar|Base|Title)\]:\s*(\d+)/);
            if (fontMatch) {
                const key = fontMatch[1].charAt(0).toLowerCase() + fontMatch[1].slice(1) + 'FontSize';
                (newStyles as any)[key] = parseInt(fontMatch[2]);
                return;
            }

            // 规格限
            const uslMatch = trimmed.match(/^USL:\s*([\d\.-]+)/);
            if (uslMatch) { newStyles.usl = parseFloat(uslMatch[1]); return; }
            const lslMatch = trimmed.match(/^LSL:\s*([\d\.-]+)/);
            if (lslMatch) { newStyles.lsl = parseFloat(lslMatch[1]); return; }
            const targetMatch = trimmed.match(/^Target:\s*([\d\.-]+)/);
            if (targetMatch) { newStyles.target = parseFloat(targetMatch[1]); return; }

            // 配置
            const binsMatch = trimmed.match(/^Bins:\s*(auto|\d+)/);
            if (binsMatch) {
                newStyles.bins = binsMatch[1] === 'auto' ? 'auto' : parseInt(binsMatch[1]);
                return;
            }
            const curveMatch = trimmed.match(/^ShowCurve:\s*(true|false)/i);
            if (curveMatch) { newStyles.showCurve = curveMatch[1].toLowerCase() === 'true'; return; }

            // 数据
            const dataMatch = trimmed.match(/^-?\s*([\d\.-]+)/);
            if (dataMatch) {
                const val = parseFloat(dataMatch[1]);
                if (!isNaN(val)) newData.push(val);
            }
        });

        if (newData.length > 0) onChange(newData, newStyles);
        else onChange(data, newStyles);
    };

    const handleTabChange = (tab: 'manual' | 'dsl' | 'ai') => {
        if (tab === 'dsl') {
            setDsl(generateDSL(data, styles));
        }
        setActiveTab(tab);
    };

    useEffect(() => {
        if (activeTab === 'dsl') {
            parseDSL(dsl);
        }
    }, [dsl, activeTab]);

    const handleRawDataChange = (val: string) => {
        setRawDataInput(val);
        const nums = val.split(/[\n,;\s]+/)
            .map(v => parseFloat(v.trim()))
            .filter(v => !isNaN(v));
        isInternalChange.current = true;
        onChange(nums, styles);
    };

    const generateAiData = async () => {
        if (!aiInput.trim()) return alert('请输入统计场景描述');
        if (!aiConfig) return alert('AI 配置尚未就绪');

        setIsGenerating(true);
        try {
            const config = aiConfig.ai_config;
            const grammar = aiConfig.chart_grammars?.histogram;
            const activeProfile = config.profiles[config.active_profile];
            const rules = grammar?.dsl_specification?.rules || [];
            const examples = grammar?.dsl_specification?.few_shot_examples || [];

            const systemPrompt = `# 角色：直方图数据生成专家
## 核心目标
将用户的数据描述转化为符合 Smart QC Tools 规范的直方图 DSL 脚本。

## 语法规范
${rules.join('\n')}

## Few-Shot 示例
${examples.map((ex: any) => `Input: ${ex.input}\nOutput:\n${ex.output}`).join('\n\n')}

## 输出格式
1. 仅输出纯 DSL 代码。
2. 严禁包含 markdown 标记（如 \`\`\`histogram 或 \`\`\`）。
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
            const rawDSL = content.replace(/```histogram|```/g, '').trim();

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
            {/* Top Bar */}
            <div className="h-16 px-4 flex items-center justify-between shrink-0 bg-white border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                    {[
                        { id: 'manual', label: '手动录入', icon: <Database size={15} /> },
                        { id: 'dsl', label: 'DSL 编辑器', icon: <Code size={15} /> },
                        { id: 'ai', label: 'AI 推理', icon: <Sparkles size={15} /> }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => handleTabChange(tab.id as any)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all shrink-0 active:scale-95 text-[13px] font-semibold ${activeTab === tab.id ? 'bg-slate-100 text-blue-700' : 'text-slate-500 hover:text-slate-700'
                                }`}
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

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'manual' && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                        <SidebarSection title="图表基本信息">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-500">图表标题</label>
                                    <input
                                        type="text"
                                        value={styles.title || ''}
                                        onChange={(e) => onChange(data, { ...styles, title: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold"
                                        placeholder="例如：产品直径分布图"
                                    />
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="原始数据录入">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-sm font-bold text-slate-500">样本数据 (每行一个或逗号分隔)</span>
                                    <span className="text-sm font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                        N = {data.length}
                                    </span>
                                </div>
                                <textarea
                                    value={rawDataInput}
                                    onChange={(e) => handleRawDataChange(e.target.value)}
                                    className="w-full min-h-[200px] px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all resize-y shadow-sm"
                                    placeholder={"输入数值，每行一个，例如：\n9.8\n10.2\n10.1\n..."}
                                    spellCheck={false}
                                />
                            </div>
                        </SidebarSection>

                        <SidebarSection title="规格与分组配置">
                            <div className="space-y-4">

                                {/* 规格限说明 - 精简设计 */}
                                <div className="px-1 text-[11px] text-slate-400 font-medium leading-relaxed">
                                    <p className="flex items-center gap-2">
                                        <span className="w-1 h-1 rounded-full bg-red-400"></span>
                                        <span><strong className="text-red-500">USL/LSL</strong>: 上下规格限 (超出视为不合格)</span>
                                    </p>
                                    <p className="flex items-center gap-2 mt-1">
                                        <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                        <span><strong className="text-emerald-600">Target</strong>: 生产理想中心值</span>
                                    </p>
                                </div>

                                {/* USL / LSL / Target 三列布局 */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-red-500">USL (上限)</label>
                                        <input
                                            type="number"
                                            value={styles.usl ?? ''}
                                            onChange={(e) => onChange(data, { ...styles, usl: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-red-600 font-mono font-medium focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                                            placeholder="--"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-red-500">LSL (下限)</label>
                                        <input
                                            type="number"
                                            value={styles.lsl ?? ''}
                                            onChange={(e) => onChange(data, { ...styles, lsl: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-red-600 font-mono font-medium focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none"
                                            placeholder="--"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-green-600">Target (目标)</label>
                                        <input
                                            type="number"
                                            value={styles.target ?? ''}
                                            onChange={(e) => onChange(data, { ...styles, target: e.target.value ? parseFloat(e.target.value) : undefined })}
                                            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg text-green-600 font-mono font-medium focus:ring-2 focus:ring-green-100 focus:border-green-400 outline-none"
                                            placeholder="--"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100"></div>

                                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <label htmlFor="showCurve" className="text-sm font-semibold text-slate-600">显示正态曲线</label>
                                    <input
                                        type="checkbox"
                                        id="showCurve"
                                        checked={!!styles.showCurve}
                                        onChange={(e) => onChange(data, { ...styles, showCurve: e.target.checked })}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <label className="text-sm font-semibold text-slate-600">分组数量 (Bins)</label>
                                        <span className="text-xs font-mono text-slate-400">
                                            {styles.bins === 'auto' ? '自动 (Sturges)' : styles.bins}
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">点击滑块切换至手动模式</p>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => onChange(data, { ...styles, bins: 'auto' })}
                                            className={`px-3 py-1 text-xs rounded-md border ${styles.bins === 'auto'
                                                ? 'bg-blue-50 border-blue-200 text-blue-700 font-bold'
                                                : 'bg-white border-slate-200 text-slate-500'
                                                }`}
                                        >
                                            Auto
                                        </button>
                                        <input
                                            type="range"
                                            min="5" max="50"
                                            value={typeof styles.bins === 'number' ? styles.bins : 10}
                                            onClick={() => { if (styles.bins === 'auto') onChange(data, { ...styles, bins: 10 }); }}
                                            onChange={(e) => onChange(data, { ...styles, bins: parseInt(e.target.value) })}
                                            className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </SidebarSection>

                        <SidebarSection title="样式与排版">
                            <div className="flex gap-4">
                                {/* 左侧：颜色配置 - 窄列 */}
                                <div className="w-24 shrink-0 space-y-2 pr-4 border-r border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 mb-2">颜色</p>
                                    {[
                                        { key: 'barColor', label: '柱形' },
                                        { key: 'curveColor', label: '曲线' },
                                        { key: 'uslColor', label: 'USL' },
                                        { key: 'lslColor', label: 'LSL' },
                                        { key: 'targetColor', label: '目标' }
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between">
                                            <span className="text-sm text-slate-600">{item.label}</span>
                                            <input
                                                type="color"
                                                value={(styles as any)[item.key] || '#000000'}
                                                onChange={(e) => onChange(data, { ...styles, [item.key]: e.target.value })}
                                                className="w-5 h-5 rounded cursor-pointer border border-slate-200"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {/* 右侧：字号配置 - 宽列 */}
                                <div className="flex-1 space-y-3">
                                    <p className="text-xs font-bold text-slate-500 mb-2">字号</p>
                                    {[
                                        { key: 'titleFontSize', label: '标题', min: 14, max: 28, default: 18 },
                                        { key: 'baseFontSize', label: '坐标轴', min: 10, max: 18, default: 12 },
                                        { key: 'barFontSize', label: '标签', min: 8, max: 16, default: 12 }
                                    ].map(item => (
                                        <div key={item.key} className="space-y-1">
                                            <div className="flex justify-between text-sm text-slate-600">
                                                <span>{item.label}</span>
                                                <span className="text-blue-600 font-mono font-medium">{(styles as any)[item.key] || item.default}px</span>
                                            </div>
                                            <input
                                                type="range"
                                                min={item.min}
                                                max={item.max}
                                                value={(styles as any)[item.key] || item.default}
                                                onChange={(e) => onChange(data, { ...styles, [item.key]: parseInt(e.target.value) })}
                                                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </SidebarSection>
                    </div>
                )}

                {activeTab === 'dsl' && (
                    <div className="flex-1 p-4 flex flex-col overflow-hidden">
                        <textarea
                            value={dsl}
                            onChange={(e) => setDsl(e.target.value)}
                            className="flex-1 w-full h-full bg-white text-slate-800 p-5 font-mono leading-7 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none custom-scrollbar shadow-sm text-sm"
                            spellCheck={false}
                            placeholder="输入 Histogram DSL..."
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
                                className="h-[320px] w-full bg-white text-slate-800 p-5 leading-relaxed border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all resize-none custom-scrollbar shadow-sm text-sm"
                                placeholder="例如：生成一组均值为10.0，标准差为0.2的正态分布数据，USL=10.5，LSL=9.5..."
                            />
                            <button
                                onClick={generateAiData}
                                disabled={isGenerating}
                                className="w-full h-12 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg disabled:opacity-50 bg-blue-700 text-white hover:bg-blue-600"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span className="font-bold">AI 推理中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={18} />
                                        <span className="font-bold">智能生成直方图</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Documentation Modal */}
            {mounted && showDocs && createPortal(
                <div
                    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
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
                                <div className="p-3 bg-indigo-50 rounded-xl">
                                    <Database size={24} className="text-indigo-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Histogram DSL Specification</h2>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-2 uppercase tracking-widest font-sans">
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]"></span>
                                        Full Logic Manifest v2.0
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
                            {/* Section: Property Manifest */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-900 text-white rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-md">
                                    <Database size={14} />
                                    Property Manifest
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="p-6 bg-slate-50/50 rounded-2xl font-mono text-sm leading-relaxed text-slate-900 border border-slate-100 shadow-sm transition-all hover:border-indigo-100">
                                        <div className="flex justify-between border-b border-white pb-3 mb-3">
                                            <span className="text-blue-800 font-black">Title:</span>
                                            <span className="text-slate-500 text-xs text-right font-sans">主标题文本内容</span>
                                        </div>
                                        <div className="flex flex-col gap-2 border-b border-white pb-3 mb-3">
                                            <div className="flex justify-between">
                                                <span className="text-red-600 font-black">USL:</span>
                                                <span className="text-slate-400 text-[10px] text-right font-sans">上规格限 (Upper Specification Limit)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-red-600 font-black">LSL:</span>
                                                <span className="text-slate-400 text-[10px] text-right font-sans">下规格限 (Lower Specification Limit)</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-green-600 font-black">Target:</span>
                                                <span className="text-slate-400 text-[10px] text-right font-sans">目标值 (生产理想中心值)</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 border-b border-white pb-3 mb-3">
                                            <div className="flex justify-between">
                                                <span className="text-indigo-800 font-black">Color[*]:</span>
                                                <span className="text-slate-400 text-[10px] text-right font-sans">#十六进制色码</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-500 font-sans pl-4 border-l-2 border-indigo-100 italic">
                                                <span>• Bar (柱形)</span>
                                                <span>• Curve (正态曲线)</span>
                                                <span>• USL (上限线)</span>
                                                <span>• LSL (下限线)</span>
                                                <span>• Target (目标线)</span>
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
                                            </div>
                                        </div>
                                        <div className="flex justify-between border-b border-white pb-3 mb-3">
                                            <span className="text-purple-800 font-black">Bins:</span>
                                            <span className="text-slate-400 text-[10px] text-right font-sans">auto | 数字 (5-50)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-amber-700 font-black">ShowCurve:</span>
                                            <span className="text-slate-400 text-[10px] text-right font-sans">true | false</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Section: Data Format */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-indigo-600 text-white rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-md">
                                    <Code size={14} />
                                    数据格式
                                </div>
                                <div className="p-6 bg-slate-50/50 rounded-2xl font-mono text-sm leading-relaxed text-slate-800 border border-slate-100">
                                    <p className="text-slate-400 mb-2"># 原始数据 (每行一个数值)</p>
                                    <p className="text-slate-800">- 9.8</p>
                                    <p className="text-slate-800">- 10.1</p>
                                    <p className="text-slate-800">- 10.3</p>
                                    <p className="text-slate-800">- 9.95</p>
                                    <p className="text-slate-400">...</p>
                                </div>
                            </section>

                            {/* Section: Complete Example */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-3 px-4 py-1.5 bg-emerald-600 text-white rounded-lg w-fit text-[11px] font-black uppercase tracking-[0.2em] shadow-md">
                                    <Sparkles size={14} />
                                    完整示例
                                </div>
                                <div className="p-6 bg-slate-50/50 rounded-2xl font-mono text-sm leading-relaxed border border-slate-100">
                                    <p className="text-blue-800 font-bold">Title: 产品外径分布分析</p>
                                    <p className="text-red-600 font-bold">USL: 10.5</p>
                                    <p className="text-red-600 font-bold">LSL: 9.5</p>
                                    <p className="text-green-600 font-bold">Target: 10.0</p>
                                    <p className="text-indigo-600">Color[Bar]: #3b82f6</p>
                                    <p className="text-indigo-600">Color[Curve]: #f97316</p>
                                    <p className="text-indigo-600">Color[USL]: #ef4444</p>
                                    <p className="text-indigo-600">Color[LSL]: #ef4444</p>
                                    <p className="text-indigo-600">Color[Target]: #22c55e</p>
                                    <p className="text-emerald-600">Font[Title]: 18</p>
                                    <p className="text-emerald-600">Font[Base]: 12</p>
                                    <p className="text-emerald-600">Font[Bar]: 10</p>
                                    <p className="text-purple-600">Bins: auto</p>
                                    <p className="text-amber-600">ShowCurve: true</p>
                                    <p className="text-slate-400 mt-3"># 样本数据</p>
                                    <p className="text-slate-800">- 9.8</p>
                                    <p className="text-slate-800">- 10.2</p>
                                    <p className="text-slate-800">- 10.1</p>
                                </div>
                            </section>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
