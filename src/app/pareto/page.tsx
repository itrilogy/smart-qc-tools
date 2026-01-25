'use client';

import React, { useState, useRef } from 'react';
import { Workspace } from '@/components/layout/Workspace';
import { ParetoItem, ParetoChartStyles, DEFAULT_PARETO_DATA, DEFAULT_PARETO_STYLES } from '@/components/charts/pareto/types';
import { ParetoChart, ParetoChartRef } from '@/components/charts/pareto/ParetoChart';
import { ParetoDataPanel } from '@/components/charts/pareto/ParetoDataPanel';
import { LayoutGrid, FileImage, Download, FileType } from 'lucide-react';

export default function ParetoPage() {
    const [data, setData] = useState<ParetoItem[]>(DEFAULT_PARETO_DATA);
    const [styles, setStyles] = useState<ParetoChartStyles>(DEFAULT_PARETO_STYLES);
    const [showLine, setShowLine] = useState(true);
    const chartRef = useRef<ParetoChartRef>(null);

    // 数据与样式同步
    const handleDataChange = (newData: ParetoItem[], newStyles: ParetoChartStyles) => {
        setData(newData);
        setStyles(newStyles);
    };

    // 整理布局：默认降序排列
    const tidyLayout = () => {
        const sortedData = [...data].sort((a, b) => b.value - a.value);
        setData(sortedData);
    };

    return (
        <Workspace
            sidebarContent={
                <ParetoDataPanel
                    data={data}
                    onChange={handleDataChange}
                    styles={styles}
                    showLine={showLine}
                    onShowLineChange={setShowLine}
                />
            }
            canvasContent={
                <ParetoChart
                    ref={chartRef}
                    data={data}
                    styles={styles}
                    showLine={showLine}
                    className="w-full h-full"
                />
            }
            toolbarContent={
                <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <button
                        onClick={tidyLayout}
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
                        白底 PNG 图片
                    </button>
                    <button
                        onClick={() => chartRef.current?.exportPNG(true)}
                        className="px-3 h-8 flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 text-slate-600 font-medium"
                        style={{ fontSize: '14px' }}
                    >
                        <Download size={16} />
                        透明 PNG 图片
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
