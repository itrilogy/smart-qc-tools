import React from 'react';

export function SidebarHeader({ title, subtitle }: { title: string, subtitle?: string }) {
    return (
        <div className="h-12 px-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white sticky top-0 z-10">
            <div>
                <h2 className="font-semibold text-slate-800">{title}</h2>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
        </div>
    );
}

export function SidebarSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="px-5 py-6 border-b border-slate-50 last:border-0">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">{title}</h3>
            {children}
        </div>
    )
}
