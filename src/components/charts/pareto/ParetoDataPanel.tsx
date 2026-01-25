'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ParetoItem } from './types';
import { SidebarHeader, SidebarSection } from '@/components/layout/Sidebar';

interface ParetoDataPanelProps {
    data: ParetoItem[];
    onChange: (newData: ParetoItem[]) => void;
}

export function ParetoDataPanel({ data, onChange }: ParetoDataPanelProps) {

    const updateItem = (id: string, field: keyof ParetoItem, value: string | number) => {
        const newData = data.map(item => {
            if (item.id === id) {
                return { ...item, [field]: value };
            }
            return item;
        });
        onChange(newData);
    };

    const addItem = () => {
        const newId = Math.random().toString(36).substr(2, 9);
        onChange([...data, { id: newId, name: '新项目', value: 0 }]);
    };

    const removeItem = (id: string) => {
        onChange(data.filter(item => item.id !== id));
    };

    return (
        <>
            <SidebarHeader title="排列图配置" subtitle="数据源" />

            <SidebarSection title="数据录入">
                <div className="space-y-2">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 mb-2 px-1">
                        <div className="col-span-6">项目名称</div>
                        <div className="col-span-4">频数</div>
                        <div className="col-span-2 text-center">操作</div>
                    </div>

                    {/* Report Rows */}
                    {data.map((item) => (
                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center group">
                            <div className="col-span-6">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 transition-all"
                                />
                            </div>
                            <div className="col-span-4">
                                <input
                                    type="number"
                                    value={item.value}
                                    onChange={(e) => updateItem(item.id, 'value', Number(e.target.value))}
                                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 transition-all"
                                />
                            </div>
                            <div className="col-span-2 flex justify-center">
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                    title="删除"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <button
                    onClick={addItem}
                    className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md font-medium transition-colors border border-dashed border-blue-200"
                >
                    <Plus size={16} />
                    添加数据项
                </button>
            </SidebarSection>

            <SidebarSection title="图表选项">
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="showLine" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="showLine" className="text-sm text-slate-600">显示二八原则分割线 (80%)</label>
                </div>
                <p className="text-xs text-slate-400 mt-2">更多高级选项正在开发中...</p>
            </SidebarSection>
        </>
    );
}
