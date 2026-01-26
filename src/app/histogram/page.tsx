'use client';

import React, { useState, useRef } from 'react';
import { Workspace } from '@/components/layout/Workspace';
import { HistogramChartStyles, DEFAULT_HISTOGRAM_DATA, DEFAULT_HISTOGRAM_STYLES } from '@/components/charts/histogram/types';
import { HistogramChart, HistogramChartRef } from '@/components/charts/histogram/HistogramChart';
import { HistogramDataPanel } from '@/components/charts/histogram/HistogramDataPanel';
import { LayoutGrid, FileImage, Download, FileType } from 'lucide-react';

export default function HistogramPage() {
    const [data, setData] = useState<number[]>(DEFAULT_HISTOGRAM_DATA);
    const [styles, setStyles] = useState<HistogramChartStyles>(DEFAULT_HISTOGRAM_STYLES);
    const chartRef = useRef<HistogramChartRef>(null);

    const handleDataChange = (newData: number[], newStyles: HistogramChartStyles) => {
        setData(newData);
        setStyles(newStyles);
    };

    return (
        <Workspace
            sidebarContent={
                <HistogramDataPanel
                    data={data}
                    onChange={handleDataChange}
                    styles={styles}
                />
            }
            canvasContent={
                <HistogramChart
                    ref={chartRef}
                    data={data}
                    styles={styles}
                    className="w-full h-full"
                />
            }
            toolbarContent={
                <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <button
                        onClick={() => {
                            const sorted = [...data].sort((a, b) => a - b);
                            setData(sorted);
                        }}
                        className="px-3 h-8 flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 text-slate-700 font-semibold"
                        style={{ fontSize: '14px' }}
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
