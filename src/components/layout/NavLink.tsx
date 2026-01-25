'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { LucideIcon } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
}

export function NavLink({ item }: { item: NavItem }) {
    const pathname = usePathname();
    const isActive = pathname === item.href;

    return (
        <Link
            href={item.href}
            className={clsx(
                "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 group",
                isActive
                    ? "bg-white text-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.08)] ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
            )}
        >
            <item.icon size={15} className={clsx("transition-transform group-hover:scale-110", isActive ? "text-blue-500" : "text-slate-400")} />
            {item.label}
        </Link>
    );
}
