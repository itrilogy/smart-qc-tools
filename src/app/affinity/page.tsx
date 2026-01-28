'use client';

import React, { useState, useRef } from 'react';
import { Workspace } from '@/components/layout/Workspace';
import { AffinityDataPanel } from '@/components/charts/affinity/AffinityDataPanel';
import { AffinityChart } from '@/components/charts/affinity/AffinityChart';
import {
    AffinityItem,
    AffinityChartStyles,
    DEFAULT_AFFINITY_DATA,
    DEFAULT_AFFINITY_STYLES,
    AffinityChartRef,
    CLASSIC_AFFINITY_TEST_DATA

} from '@/components/charts/affinity/types';
import { LayoutGrid, FileImage, Download, FileType, Boxes, Network, RotateCcw } from 'lucide-react';

export default function AffinityPage() {
    const [data, setData] = useState<AffinityItem[]>(CLASSIC_AFFINITY_TEST_DATA);
    const [styles, setStyles] = useState<AffinityChartStyles>(DEFAULT_AFFINITY_STYLES);

    const chartRef = useRef<AffinityChartRef>(null);

    const handleDataChange = (newData: AffinityItem[], newStyles: AffinityChartStyles) => {
        setData(newData);
        setStyles(newStyles);
    };

    // 重置视图（通过触发重新渲染）
    const resetView = () => {
        chartRef.current?.resetView?.();
    };

    return (
        <Workspace
            sidebarContent={
                <AffinityDataPanel
                    data={data}
                    styles={styles}
                    onChange={handleDataChange}
                    onExportPNG={(transparent) => chartRef.current?.exportPNG(transparent)}
                    onExportPDF={() => chartRef.current?.exportPDF()}
                    onResetView={resetView}
                />
            }
            canvasContent={
                <AffinityChart
                    ref={chartRef}
                    data={data}
                    styles={styles}
                    className="w-full h-full"
                />
            }
            toolbarContent={
                <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-xl shadow-sm">


                    <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

                    {/* Type Switcher */}
                    <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                        <button
                            onClick={() => setStyles({ ...styles, type: 'Card' })}
                            className={`px-3 py-1 flex items-center gap-2 rounded-md transition-all text-xs font-bold ${styles.type === 'Card' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Boxes size={14} />
                            卡片
                        </button>
                        <button
                            onClick={() => setStyles({ ...styles, type: 'Label' })}
                            className={`px-3 py-1 flex items-center gap-2 rounded-md transition-all text-xs font-bold ${styles.type === 'Label' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Network size={14} />
                            树状
                        </button>
                    </div>

                    <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

                    <button
                        onClick={resetView}
                        className="px-3 h-8 flex items-center gap-2 hover:bg-slate-50 rounded-lg transition-all active:scale-95 text-slate-700 font-semibold"
                        style={{ fontSize: '14px' }}
                        title="重置缩放和位置"
                    >
                        <RotateCcw size={16} />
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

