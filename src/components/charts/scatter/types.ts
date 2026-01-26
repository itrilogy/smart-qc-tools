export interface ScatterPoint {
    id: string;
    x: number;
    y: number;
    z?: number; // bubble size
    label?: string; // point label or group
}

export interface ScatterChartStyles {
    title: string;
    xAxisLabel: string;
    yAxisLabel: string;
    zAxisLabel?: string;
    pointColor: string;
    trendColor: string;
    baseSize: number;
    opacity: number;
    showTrend: boolean;
    titleFontSize?: number;
    baseFontSize?: number;
}

export interface ScatterChartRef {
    exportPNG: (transparent?: boolean) => void;
    exportPDF: () => void;
}

export const DEFAULT_SCATTER_STYLES: ScatterChartStyles = {
    title: '散点分布分析',
    xAxisLabel: 'X轴',
    yAxisLabel: 'Y轴',
    zAxisLabel: 'Z轴 (大小)',
    pointColor: '#3b82f6',
    trendColor: '#f59e0b',
    baseSize: 6,
    opacity: 0.7,
    showTrend: false,
    titleFontSize: 20,
    baseFontSize: 12
};

export const INITIAL_SCATTER_DSL = `Title: 广告投入与销售额分析
XAxis: 广告投入(W)
YAxis: 销售额(W)
Color[Point]: #3b82f6
Color[Trend]: #f59e0b
Size[Base]: 8
Opacity: 0.8
ShowTrend: true
Font[Title]: 20
Font[Base]: 12

# 样本数据 (X, Y, [Size])
- 10, 45, 5
- 12, 52, 6
- 15, 60, 8
- 18, 58, 7
- 22, 75, 10
- 25, 80, 12`;
