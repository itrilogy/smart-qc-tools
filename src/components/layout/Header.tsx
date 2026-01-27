'use client';

import React from 'react';
import Link from 'next/link';
import { Network } from 'lucide-react';

export function Header() {
    return (
        <header className="h-14 bg-white border-b border-slate-200 flex items-center px-12 justify-between shrink-0 z-50 sticky top-0" style={{ boxShadow: 'var(--shadow-sm)' }}>
            <div className="flex items-center gap-5">
                <Link href="/" className="flex items-center gap-4 active:scale-98 transition-all duration-200 group" style={{ textDecoration: 'none' }}>
                    <div
                        className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black overflow-hidden relative shadow-md group-hover:bg-blue-600 group-hover:shadow-lg transition-all duration-300"
                        style={{
                            fontSize: '16px',
                            fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif',
                            lineHeight: 1
                        }}
                    >
                        <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500 opacity-60"></div>
                        QC
                    </div>
                    <div className="flex items-baseline gap-3">
                        <h1
                            className="font-black text-[20px] tracking-tight leading-none"
                            style={{
                                color: 'var(--text-primary)',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif'
                            }}
                        >
                            Smart QC Tools
                        </h1>
                        <p className="font-bold tracking-[0.2em] uppercase opacity-40 whitespace-nowrap" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Industrial Logic Factory</p>
                    </div>
                </Link>
            </div>

            <div className="flex items-center gap-6">
                <div className="h-4 w-[1px] bg-slate-200"></div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40 whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>Enterprise Logic Hub</p>
            </div>
        </header>
    );
}
