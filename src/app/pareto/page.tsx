'use client';

import React, { useState } from 'react';
import { Workspace } from '@/components/layout/Workspace';
import { ParetoItem, DEFAULT_PARETO_DATA } from '@/components/charts/pareto/types';
import { ParetoChart } from '@/components/charts/pareto/ParetoChart';
import { ParetoDataPanel } from '@/components/charts/pareto/ParetoDataPanel';

export default function ParetoPage() {
    const [data, setData] = useState<ParetoItem[]>(DEFAULT_PARETO_DATA);

    return (
        <Workspace
            sidebarContent={
                <ParetoDataPanel data={data} onChange={setData} />
            }
            canvasContent={
                <ParetoChart data={data} className="w-full h-full" />
            }
        />
    );
}
