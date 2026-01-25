export interface ParetoItem {
    id: string;
    name: string;
    value: number;
}

export const DEFAULT_PARETO_DATA: ParetoItem[] = [
    { id: '1', name: '插头虚焊', value: 48 },
    { id: '2', name: '按键失灵', value: 25 },
    { id: '3', name: '外壳划痕', value: 12 },
    { id: '4', name: '屏幕不亮', value: 6 },
    { id: '5', name: '螺丝缺失', value: 4 },
    { id: '6', name: '其他', value: 3 },
];
