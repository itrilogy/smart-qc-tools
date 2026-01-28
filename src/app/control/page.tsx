'use client';

import React, { useState, useRef } from 'react';
import { Workspace } from '@/components/layout/Workspace';
import { ControlDataPanel } from '@/components/charts/control/ControlDataPanel';
import { ControlChart } from '@/components/charts/control/ControlChart';
import {
    ControlSeries,
    ControlChartStyles,
    ControlChartRef,
    DEFAULT_CONTROL_STYLES,
    parseControlDSL,
    INITIAL_CONTROL_DSL
} from '@/components/charts/control/types';
import { FileImage, Download, FileType, LayoutGrid, RotateCcw } from 'lucide-react';

export default function ControlPage() {
    // 初始解析默认数据
    const initial = parseControlDSL(INITIAL_CONTROL_DSL);
    const [series, setSeries] = useState<ControlSeries[]>(initial.series);
    const [styles, setStyles] = useState<ControlChartStyles>({
        ...DEFAULT_CONTROL_STYLES,
        ...initial.styles
    });

    const chartRef = useRef<ControlChartRef>(null);

    const handleConfigChange = (newSeries: ControlSeries[], newStyles: ControlChartStyles) => {
        setSeries(newSeries);
        setStyles(newStyles);
    };

    // 整理布局 (示例：清理空数据或重新触发计算)
    const tidyLayout = () => {
        const cleanedSeries = series.map(s => ({
            ...s,
            data: s.data.filter(v => !isNaN(v))
        }));
        setSeries(cleanedSeries);
    };

    return (
        <Workspace
            sidebarContent={
                <ControlDataPanel
                    series={series}
                    styles={styles}
                    onChange={handleConfigChange}
                />
            }
            canvasContent={
                <div className="w-full h-full p-8 bg-slate-50 flex items-center justify-center">
                    <ControlChart
                        ref={chartRef}
                        series={series}
                        styles={styles}
                        className="w-full h-full max-w-5xl bg-white shadow-2xl rounded-2xl p-8"
                    />
                </div>
            }
            toolbarContent={
                <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <button
                        onClick={tidyLayout}
                        className="px-3 h-8 flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 text-slate-700 font-semibold"
                        style={{ fontSize: '14px' }}
                        title="清理异常数据点"
                    >
                        <LayoutGrid size={16} />
                        整理布局
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>
                    <button
                        onClick={() => chartRef.current?.exportPNG(false)}
                        className="px-3 h-8 flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 text-slate-600 font-medium"
                        style={{ fontSize: '14px' }}
                    >
                        <FileImage size={16} />
                        白底 PNG
                    </button>
                    <button
                        onClick={() => chartRef.current?.exportPNG(true)}
                        className="px-3 h-8 flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 text-slate-600 font-medium"
                        style={{ fontSize: '14px' }}
                    >
                        <Download size={16} />
                        透明 PNG
                    </button>
                    <button
                        onClick={() => chartRef.current?.exportPDF()}
                        className="px-3 h-8 flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 text-slate-600 font-medium"
                        style={{ fontSize: '14px' }}
                    >
                        <FileType size={16} />
                        PDF 文件
                    </button>
                </div>
            }
        />
    );
}
