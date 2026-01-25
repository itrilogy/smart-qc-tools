export interface ParetoItem {
    id: string;
    name: string;
    value: number;
}

export interface ParetoChartStyles {
    title?: string;
    titleColor?: string;
    titleFontSize?: number;
    barColor?: string;
    lineColor?: string;
    markLineColor?: string;
    barFontSize?: number;
    lineFontSize?: number;
    baseFontSize?: number;
    decimals?: number;
}

export const DEFAULT_PARETO_STYLES: ParetoChartStyles = {
    title: '排列图 (Pareto Chart)',
    titleColor: '#1e293b',
    titleFontSize: 18,
    barColor: '#3b82f6',
    lineColor: '#f59e0b',
    markLineColor: '#ef4444',
    barFontSize: 12,
    lineFontSize: 12,
    baseFontSize: 12,
    decimals: 1
};

export const DEFAULT_PARETO_DATA: ParetoItem[] = [
    { id: '1', name: '插头虚焊', value: 48 },
    { id: '2', name: '按键失灵', value: 25 },
    { id: '3', name: '外壳划痕', value: 12 },
    { id: '4', name: '屏幕不亮', value: 6 },
    { id: '5', name: '螺丝缺失', value: 4 },
    { id: '6', name: '其他', value: 3 },
];

export const INITIAL_PARETO_DSL = `Title: 排列图 (Pareto Chart)
Color[Title]: #1e293b
Color[Bar]: #3b82f6
Color[Line]: #f59e0b
Color[MarkLine]: #ef4444
Font[Title]: 18
Font[Bar]: 12
Font[Line]: 12
Font[Base]: 12
Decimals: 1

- 插头虚焊: 48
- 按键失灵: 25
- 外壳划痕: 12
- 屏幕不亮: 6
- 螺丝缺失: 4
- 其他: 3`;
