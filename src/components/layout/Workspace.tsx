'use client';

import React, { ReactNode, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkspaceProps {
    sidebarContent: ReactNode;
    canvasContent: ReactNode;
    toolbarContent?: ReactNode;
}

export function Workspace({ sidebarContent, canvasContent, toolbarContent }: WorkspaceProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="flex flex-1 h-[calc(100vh-64px)] overflow-hidden relative bg-white">
            {/* DataPanel Sidebar - Collapsible */}
            <aside
                className="bg-white flex flex-col shrink-0 overflow-hidden transition-all duration-300 ease-in-out min-w-0"
                style={{
                    width: isSidebarOpen ? '360px' : '0px',
                    borderRight: isSidebarOpen ? '1px solid var(--border-default)' : 'none',
                    opacity: isSidebarOpen ? 1 : 0
                }}
            >
                <div className="w-[360px] h-full flex flex-col">
                    {sidebarContent}
                </div>
            </aside>

            {/* Toggle Handle Button */}
            <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="absolute top-1/2 -translate-y-1/2 z-30 w-6 h-16 flex flex-col items-center justify-center gap-1 bg-white hover:bg-slate-50 transition-all group"
                style={{
                    left: isSidebarOpen ? '360px' : '0px',
                    border: '1px solid var(--border-default)',
                    borderLeft: isSidebarOpen ? 'none' : '1px solid var(--border-default)',
                    borderTopRightRadius: '6px',
                    borderBottomRightRadius: '6px',
                    boxShadow: 'var(--shadow-sm)'
                }}
                title={isSidebarOpen ? "收起面板" : "展开面板"}
            >
                <div className="flex flex-col gap-0.5">
                    <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
                    <div className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-blue-500 transition-colors"></div>
                </div>
                <div className="text-slate-400 group-hover:text-blue-600 transition-colors">
                    {isSidebarOpen ? <ChevronLeft size={14} strokeWidth={2.5} /> : <ChevronRight size={14} strokeWidth={2.5} />}
                </div>
            </button>

            {/* CanvasPanel Area - Auto Expanding */}
            <div className="flex-1 min-w-0 relative bg-white flex flex-col overflow-hidden">
                <div className="flex-1 relative z-0 flex items-center justify-center overflow-auto">
                    <div className="w-full h-full flex flex-col relative overflow-hidden bg-white">
                        {canvasContent}
                    </div>
                </div>

                {/* Floating Toolbar */}
                {toolbarContent && (
                    <div className="absolute top-6 right-6 z-20 bg-white p-1 rounded-lg flex gap-1" style={{ border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-lg)' }}>
                        {toolbarContent}
                    </div>
                )}
            </div>
        </div>
    );
}
