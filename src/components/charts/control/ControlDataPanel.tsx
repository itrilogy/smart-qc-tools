'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Trash2, Sparkles, Database, Code2, HelpCircle, X,
    Loader2, Edit3, LineChart, Settings2, Palette
} from 'lucide-react';
import {
    ControlSeries,
    ControlChartStyles,
    ControlChartType,
    ControlRule,
    parseControlDSL,
    DEFAULT_CONTROL_STYLES,
    INITIAL_CONTROL_DSL
} from './types';
import { SidebarSection } from '../../layout/Sidebar';

interface ControlDataPanelProps {
    series: ControlSeries[];
    styles: ControlChartStyles;
    onChange: (series: ControlSeries[], styles: ControlChartStyles) => void;
    onExportPNG?: (transparent?: boolean) => void;
    onExportPDF?: () => void;
}

export const ControlDataPanel: React.FC<ControlDataPanelProps> = ({
    series,
    styles,
    onChange
}) => {
    const [activeTab, setActiveTab] = useState<'manual' | 'dsl' | 'ai'>('manual');
    const [dsl, setDsl] = useState(INITIAL_CONTROL_DSL);
    const [aiInput, setAiInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showDocs, setShowDocs] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const generateDSL = useCallback((currentSeries: ControlSeries[], currentStyles: ControlChartStyles) => {
        let lines: string[] = [];
        if (currentStyles.title) lines.push(`Title: ${currentStyles.title}`);
        if (currentStyles.type) lines.push(`Type: ${currentStyles.type}`);
        if (currentStyles.subgroupSize) lines.push(`Size: ${currentStyles.subgroupSize}`);
        if (currentStyles.rules?.length) lines.push(`Rules: ${currentStyles.rules.join(',')}`);

        if (currentStyles.ucl) lines.push(`UCL: ${currentStyles.ucl}`);
        if (currentStyles.cl) lines.push(`CL: ${currentStyles.cl}`);
        if (currentStyles.lcl) lines.push(`LCL: ${currentStyles.lcl}`);

        if (currentStyles.decimals !== undefined) lines.push(`Decimals: ${currentStyles.decimals}`);

        if (currentStyles.titleColor) lines.push(`Color[Title]: ${currentStyles.titleColor}`);
        if (currentStyles.lineColor) lines.push(`Color[Line]: ${currentStyles.lineColor}`);
        if (currentStyles.uclColor) lines.push(`Color[UCL]: ${currentStyles.uclColor}`);
        if (currentStyles.clColor) lines.push(`Color[CL]: ${currentStyles.clColor}`);
        if (currentStyles.pointColor) lines.push(`Color[Point]: ${currentStyles.pointColor}`);

        lines.push('');

        currentSeries.forEach(s => {
            lines.push(`[series]: ${s.name}`);
            s.data.forEach(val => lines.push(val.toString()));
            lines.push(`[/series]`);
            lines.push('');
        });

        return lines.join('\n');
    }, []);

    const handleTabChange = (tab: 'manual' | 'dsl' | 'ai') => {
        if (tab === 'dsl') {
            setDsl(generateDSL(series, styles));
        }
        setActiveTab(tab);
    };

    const handleDslChange = (text: string) => {
        setDsl(text);
        try {
            const result = parseControlDSL(text);
            onChange(result.series, { ...styles, ...result.styles });
        } catch (e) { }
    };

    const addSeries = () => {
        const newSeries: ControlSeries = { name: `序列 ${series.length + 1}`, data: [] };
        onChange([...series, newSeries], styles);
    };

    const updateSeriesName = (index: number, name: string) => {
        const newSeries = [...series];
        newSeries[index] = { ...newSeries[index], name };
        onChange(newSeries, styles);
    };

    const removeSeries = (index: number) => {
        const newSeries = series.filter((_, i) => i !== index);
        onChange(newSeries, styles);
    };

    const updateSeriesData = (index: number, dataText: string) => {
        const newSeries = [...series];
        const data = dataText.split(/[\n,;\s]+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
        newSeries[index] = { ...newSeries[index], data };
        onChange(newSeries, styles);
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
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
                                fontSize: '14px',
                                fontWeight: '700',
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
                    className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all active:scale-95"
                >
                    <HelpCircle size={20} />
                </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'manual' && (
                    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 bg-white" style={{ height: 'calc(100vh - 128px)' }}>
                        <div className="p-4 space-y-8">
                            <SidebarSection title="图表基本信息">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">图表标题</label>
                                        <input
                                            type="text"
                                            value={styles.title}
                                            onChange={(e) => onChange(series, { ...styles, title: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold"
                                            placeholder="例如：活塞销外径监控"
                                            style={{ fontSize: '14px' }}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">控制图类型</label>
                                        <select
                                            value={styles.type}
                                            onChange={(e) => onChange(series, { ...styles, type: e.target.value as any })}
                                            className="w-full h-10 px-3 text-sm font-semibold border border-slate-200 rounded-lg bg-white outline-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
                                            style={{ fontSize: '14px' }}
                                        >
                                            <option value="I-MR (仅限单维)">I-MR (仅限单维)</option>
                                            <option value="X-bar-R (仅限单维)">X-bar-R (仅限单维)</option>
                                            <option value="X-bar-S (仅限单维)">X-bar-S (仅限单维)</option>
                                            <option value="P / NP (仅限单维)">P / NP (仅限单维)</option>
                                            <option value="C / U (仅限单维)">C / U (仅限单维)</option>
                                            <option value="T2 (仅限多维)">T2 (仅限多维)</option>
                                            <option value="Parallel (可用于多维)">Parallel (可用于多维)</option>
                                        </select>
                                    </div>
                                </div>
                            </SidebarSection>

                            <SidebarSection title="统计计算配置">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">子组大小 (n)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                value={styles.subgroupSize}
                                                onChange={(e) => onChange(series, { ...styles, subgroupSize: parseInt(e.target.value) || 1 })}
                                                className="w-full h-10 px-3 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                                                style={{ fontSize: '14px' }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">限制线精度</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="6"
                                                value={styles.decimals}
                                                onChange={(e) => onChange(series, { ...styles, decimals: parseInt(e.target.value) || 0 })}
                                                className="w-full h-10 px-3 text-sm font-bold border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                                                style={{ fontSize: '14px' }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">判异规则 (可多选)</label>
                                        <div className="flex flex-wrap gap-4">
                                            {['Basic', 'Western-Electric', 'Nelson'].map(rule => {
                                                const isActive = styles.rules.includes(rule as any);
                                                return (
                                                    <button
                                                        key={rule}
                                                        onClick={() => {
                                                            const rules = isActive
                                                                ? styles.rules.filter(r => r !== rule)
                                                                : [...styles.rules, rule as any];
                                                            onChange(series, { ...styles, rules });
                                                        }}
                                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-2 active:scale-95 ${isActive
                                                            ? 'border-blue-600 text-white'
                                                            : 'bg-white border-slate-200 text-slate-400 hover:border-blue-300'
                                                            }`}
                                                        style={{
                                                            backgroundColor: isActive ? '#2563eb' : '#ffffff',
                                                            color: isActive ? '#ffffff' : '#64748b'
                                                        }}
                                                    >
                                                        {rule}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </SidebarSection>

                            <SidebarSection title="数据序列录入">
                                <div className="space-y-4">
                                    {series.map((s, idx) => (
                                        <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <LineChart size={16} className="text-blue-500" />
                                                    <input
                                                        type="text"
                                                        value={s.name}
                                                        onChange={(e) => updateSeriesName(idx, e.target.value)}
                                                        className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 w-48 focus:ring-1 focus:ring-blue-100 rounded px-1"
                                                        style={{ fontSize: '14px' }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => removeSeries(idx)}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <textarea
                                                value={s.data.join('\n')}
                                                onChange={(e) => updateSeriesData(idx, e.target.value)}
                                                placeholder="每行一个数值，或用逗号隔开"
                                                className="w-full h-80 p-4 text-sm font-mono text-slate-600 resize-none outline-none focus:bg-blue-50/10 transition-colors border-none"
                                                style={{ fontSize: '14px', lineHeight: '1.6' }}
                                            />
                                        </div>
                                    ))}
                                    <button
                                        onClick={addSeries}
                                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                                        <span className="text-sm font-bold">添加监控序列</span>
                                    </button>
                                </div>
                            </SidebarSection>

                            <SidebarSection title="视觉风格配置">
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { key: 'titleColor', label: '主标题颜色' },
                                        { key: 'lineColor', label: '折线颜色' },
                                        { key: 'uclColor', label: 'UCL/LCL 颜色' },
                                        { key: 'clColor', label: 'CL 中心线颜色' },
                                        { key: 'pointColor', label: '数据点颜色' }
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                                            <span className="text-sm font-bold text-slate-600" style={{ fontSize: '13px' }}>{item.label}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[11px] font-mono text-slate-400 uppercase">{(styles as any)[item.key]}</span>
                                                <input
                                                    type="color"
                                                    value={(styles as any)[item.key]}
                                                    onChange={(e) => onChange(series, { ...styles, [item.key]: e.target.value })}
                                                    className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white shadow-sm ring-1 ring-slate-200"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </SidebarSection>
                        </div>
                    </div>
                )}

                {activeTab === 'dsl' && (
                    <div className="flex-1 p-4 flex flex-col min-h-0">
                        <textarea
                            value={dsl}
                            onChange={(e) => handleDslChange(e.target.value)}
                            className="flex-1 w-full bg-slate-900 text-blue-50 p-5 font-mono text-sm leading-relaxed border-none rounded-xl outline-none resize-none overflow-y-auto"
                            spellCheck={false}
                        />
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="flex-1 p-6 flex flex-col gap-6 bg-slate-50/30">
                        <div className="flex flex-col gap-4">
                            <label className="font-bold flex items-center gap-2 text-slate-800">
                                <Sparkles size={18} className="text-blue-500" />
                                控制图场景描述
                            </label>
                            <textarea
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                className="h-[300px] w-full bg-white p-5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 outline-none resize-none shadow-sm transition-all"
                                placeholder="例如：输入某批次零件的 25 组外径测量数据，要求生成 X-bar-R 控制图并应用 Western-Electric 规则..."
                            />
                            <button
                                disabled={isGenerating}
                                className="w-full h-12 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
                            >
                                {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                {isGenerating ? 'AI 解析中...' : '智能解析并生成'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Documentation Modal */}
            {
                mounted && showDocs && createPortal(
                    <div
                        className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200"
                        onClick={() => setShowDocs(false)}
                        style={{ zIndex: 99999 }}
                    >
                        <div
                            className="w-[680px] max-h-[90vh] rounded-3xl flex flex-col overflow-hidden shadow-[0_30px_70px_-15px_rgba(0,0,0,0.5)] border border-slate-200"
                            style={{ backgroundColor: '#ffffff', opacity: 1, position: 'relative', zIndex: 100000 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div
                                className="px-10 py-8 flex items-center justify-between border-b border-slate-100 shrink-0"
                                style={{ backgroundColor: '#ffffff', opacity: 1 }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-blue-50 rounded-2xl">
                                        <LineChart size={28} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Control Chart DSL Spec</h2>
                                        <p className="text-[11px] font-bold text-slate-400 mt-2.5 flex items-center gap-2 uppercase tracking-[0.2em] font-sans">
                                            <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse"></span>
                                            Full Logic Manifest v1.2
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setShowDocs(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-all group active:scale-90 border border-transparent hover:border-slate-100">
                                    <X size={24} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                                </button>
                            </div>
                            <div
                                className="flex-1 overflow-y-auto p-12 space-y-14 custom-scrollbar"
                                style={{ backgroundColor: '#ffffff', opacity: 1 }}
                            >
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 px-5 py-2 bg-slate-900 text-white rounded-xl w-fit text-[12px] font-black uppercase tracking-[0.2em] shadow-lg">
                                        <Database size={15} />
                                        Property Manifest
                                    </div>
                                    <div className="p-8 bg-slate-50/50 rounded-3xl font-mono text-[15px] leading-[2] text-slate-900 border border-slate-100 shadow-sm transition-all hover:border-blue-100">
                                        <div className="flex justify-between border-b border-white pb-4 mb-4"><span className="text-blue-800 font-black">Title:</span><span className="text-slate-500 text-sm font-sans text-right">图表主标题</span></div>
                                        <div className="flex justify-between border-b border-white pb-4 mb-4"><span className="text-indigo-800 font-black">Type:</span><span className="text-slate-500 text-sm font-sans text-right">I-MR / X-bar-R / T2 ...</span></div>
                                        <div className="flex justify-between border-b border-white pb-4 mb-4"><span className="text-emerald-800 font-black">Size:</span><span className="text-slate-500 text-sm font-sans text-right">子组大小 (默认为 1)</span></div>
                                        <div className="flex justify-between border-b border-white pb-4 mb-4"><span className="text-amber-800 font-black">Rules:</span><span className="text-slate-500 text-sm font-sans text-right">判异规则列表 (Nelson/WE)</span></div>
                                        <div className="flex justify-between"><span className="text-slate-800 font-black">Decimals:</span><span className="text-slate-500 text-sm font-sans text-right">控制限精度位数</span></div>
                                    </div>
                                </section>

                                {/* New Section: Anomaly Rules Description */}
                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 px-5 py-2 bg-red-600 text-white rounded-xl w-fit text-[12px] font-black uppercase tracking-[0.2em] shadow-lg">
                                        <HelpCircle size={15} />
                                        Anomaly Rules (判异手册)
                                    </div>
                                    <div className="grid grid-cols-1 gap-5">
                                        {[
                                            { id: 'Rule 1', title: '超出控制限', desc: '点落在 UCL 以上或 LCL 以下 (最严重的失控信号)' },
                                            { id: 'Rule 2', title: '九点中心侧', desc: '连续 9 个点落在中心线 (CL) 的同一侧 (意味着过程偏移)' },
                                            { id: 'Rule 3', title: '六点单向', desc: '连续 6 个点持续上升或持续下降 (预示趋势漂移/损耗)' },
                                            { id: 'Rule 4', title: '十四点交替', desc: '连续 14 个点交替上下波动 (预示周期性不稳定/混合过程)' }
                                        ].map(r => (
                                            <div key={r.id} className="p-6 bg-white border border-slate-100 rounded-2xl hover:border-red-100 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="text-[11px] font-black bg-red-500 text-white px-3 py-1 rounded-md leading-none uppercase tracking-wider">{r.id}</span>
                                                    <span className="text-lg font-black text-slate-800">{r.title}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 font-medium leading-relaxed pl-1">{r.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section className="space-y-6">
                                    <div className="flex items-center gap-3 px-5 py-2 bg-blue-50 text-blue-700 rounded-xl w-fit text-[12px] font-black uppercase tracking-[0.2em] shadow-sm">
                                        <LineChart size={15} />
                                        Data Structure
                                    </div>
                                    <div className="p-10 bg-slate-900 rounded-3xl font-mono text-sm leading-8 text-slate-300 shadow-2xl relative overflow-hidden">
                                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                                            <div className="flex gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                                                <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                                                <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest bg-slate-800/50 px-3 py-1 rounded-md">DSL Specification</div>
                                        </div>
                                        <div className="text-slate-400"># 序列定义与数据录入</div>
                                        <div className="text-blue-400">[series]: 熔体温度(℃)</div>
                                        <div className="text-slate-100">12.5, 12.8, 12.1, 13.0</div>
                                        <div className="text-slate-100">12.4, 12.2, 12.9, 12.5</div>
                                        <div className="text-blue-400">[/series]</div>
                                    </div>
                                </section>
                            </div>
                            <div
                                className="p-12 border-t border-slate-100 flex justify-center shrink-0"
                                style={{ backgroundColor: '#f8fafc', opacity: 1 }}
                            >
                                <button
                                    onClick={() => setShowDocs(false)}
                                    className="px-24 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 active:scale-95 transition-all text-base uppercase tracking-widest"
                                >
                                    Specification Read
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};
