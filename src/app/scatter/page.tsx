'use client';

import React, { useState, useRef } from 'react';
import { Workspace } from '@/components/layout/Workspace';
import { ScatterDataPanel } from '@/components/charts/scatter/ScatterDataPanel';
import { ScatterChartPreview } from '@/components/charts/scatter/ScatterChartPreview';
import { ScatterChart3D } from '@/components/charts/scatter/ScatterChart3D';
import { ScatterPoint, ScatterChartStyles, DEFAULT_SCATTER_STYLES, ScatterChartRef } from '@/components/charts/scatter/types';
import { LayoutGrid, FileImage, Download, FileType, Box, Monitor } from 'lucide-react';

export default function ScatterPage() {
    const [data, setData] = useState<ScatterPoint[]>([]);
    const [styles, setStyles] = useState<ScatterChartStyles>(DEFAULT_SCATTER_STYLES);
    const [isGenerating, setIsGenerating] = useState(false);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const chartRef = useRef<ScatterChartRef>(null);

    const handleDataChange = (newData: ScatterPoint[], newStyles: ScatterChartStyles) => {
        setData(newData);
        setStyles(newStyles);
    };

    // 整理布局：按 X 轴排序
    const tidyLayout = () => {
        const sortedData = [...data].sort((a, b) => a.x - b.x);
        setData(sortedData);
    };

    return (
        <Workspace
            sidebarContent={
                <ScatterDataPanel
                    data={data}
                    styles={styles}
                    onChange={handleDataChange}
                />
            }
            canvasContent={
                viewMode === '2d' ? (
                    <ScatterChartPreview
                        ref={chartRef}
                        data={data}
                        styles={styles}
                        isGenerating={isGenerating}
                        className="w-full h-full"
                    />
                ) : (
                    <ScatterChart3D
                        ref={chartRef}
                        data={data}
                        styles={styles}
                        className="w-full h-full"
                    />
                )
            }
            toolbarContent={
                <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    {/* View Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                        <button
                            onClick={() => setViewMode('2d')}
                            className={`px-3 py-1 flex items-center gap-2 rounded-md transition-all text-xs font-bold ${viewMode === '2d' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Monitor size={14} />
                            2D
                        </button>
                        <button
                            onClick={() => setViewMode('3d')}
                            className={`px-3 py-1 flex items-center gap-2 rounded-md transition-all text-xs font-bold ${viewMode === '3d' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Box size={14} />
                            3D
                        </button>
                    </div>

                    <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

                    <button
                        onClick={tidyLayout}
                        className="px-3 h-8 flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 text-slate-700 font-semibold"
                        style={{ fontSize: '14px' }}
                        title="按 X 轴排序数据"
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
