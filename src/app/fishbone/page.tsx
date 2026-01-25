'use client';

import React, { useState, useRef } from 'react';
import { Workspace } from '@/components/layout/Workspace';
import { FishboneNode, DEFAULT_FISHBONE_DATA, FishboneChartStyles } from '@/components/charts/fishbone/types';
import { FishboneChart, FishboneChartRef } from '@/components/charts/fishbone/FishboneChart';
import { FishboneDataPanel } from '@/components/charts/fishbone/FishboneDataPanel';
import { Download, LayoutGrid, FileImage, FileType } from 'lucide-react';

export default function FishbonePage() {
    const [data, setData] = useState<FishboneNode>(DEFAULT_FISHBONE_DATA);
    const [styles, setStyles] = useState<FishboneChartStyles>({});
    const chartRef = useRef<FishboneChartRef>(null);

    const handleDataChange = (newData: FishboneNode, newStyles: FishboneChartStyles) => {
        setData(newData);
        setStyles(newStyles);
    };

    return (
        <Workspace
            sidebarContent={
                <FishboneDataPanel onChange={handleDataChange} />
            }
            canvasContent={
                <FishboneChart ref={chartRef} data={data} styles={styles} className="w-full h-full" />
            }
            toolbarContent={
                <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <button
                        onClick={() => chartRef.current?.tidyLayout()}
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
