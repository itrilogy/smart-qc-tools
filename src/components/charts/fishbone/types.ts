export interface FishboneNode {
    id: string;
    label: string;
    type: 'root' | 'main' | 'sub' | 'detail' | 'anchor' | 'tail';
    children?: FishboneNode[];
    direction?: 'top' | 'bottom';
    styles?: FishboneChartStyles;
}

export interface FishboneChartStyles {
    boneLine?: string;
    caseLine?: string;
    titleColor?: string;
    caseColor?: string;
    startColor?: string;
    endColor?: string;
    background?: string; // 新增：支持画布背景色定制
}

export const DEFAULT_CHART_STYLES: Required<FishboneChartStyles> = {
    boneLine: '#334155',
    caseLine: '#64748b',
    titleColor: '#ffffff',
    caseColor: '#1e293b',
    startColor: '#2563eb',
    endColor: '#94a3b8',
    background: '#f8fafc' // 默认画布背景
};

export const INITIAL_DSL_CONTENT = `Color[BoneLine]: #475569
Color[CaseLine]: #cbd5e1
Color[Title]: #000000
Color[Case]: #1d4ed8
Color[Start]: #1e293b
Color[End]: #94a3b8
Title: 复印机卡纸

# 人 (Man)
## 操作不当
### 新员工培训不足
### 未按SOP执行
## 心情焦虑

# 机 (Machine)
## 滚轮磨损
## 传感器故障
`;

export const DEFAULT_FISHBONE_DATA: FishboneNode = {
    id: 'root',
    label: '复印机卡纸',
    type: 'root',
    children: [
        {
            id: 'm1',
            label: '人 (Man)',
            type: 'main',
            direction: 'top',
            children: [
                {
                    id: 's1-1',
                    label: '操作不当',
                    type: 'sub',
                    children: [
                        { id: 'd1-1-1', label: '新员工培训不足', type: 'detail' },
                        { id: 'd1-1-2', label: '未按SOP执行', type: 'detail' }
                    ]
                },
                { id: 's1-2', label: '心情焦虑', type: 'sub' }
            ]
        },
        {
            id: 'm2',
            label: '机 (Machine)',
            type: 'main',
            direction: 'bottom',
            children: [
                { id: 's2-1', label: '滚轮磨损', type: 'sub' },
                { id: 's2-2', label: '传感器故障', type: 'sub' }
            ]
        }
    ]
};
