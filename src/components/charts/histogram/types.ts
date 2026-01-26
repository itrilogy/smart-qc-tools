export interface HistogramChartStyles {
    title?: string;
    titleColor?: string;
    titleFontSize?: number;
    barColor?: string;
    uslColor?: string;
    lslColor?: string;
    targetColor?: string;
    curveColor?: string;
    barFontSize?: number;
    baseFontSize?: number;
    usl?: number;
    lsl?: number;
    target?: number;
    bins?: number | 'auto';
    showCurve?: boolean;
}

export const DEFAULT_HISTOGRAM_STYLES: HistogramChartStyles = {
    title: '直方图 (Histogram)',
    titleColor: '#1e293b',
    titleFontSize: 18,
    barColor: '#3b82f6',
    uslColor: '#ef4444',
    lslColor: '#ef4444',
    targetColor: '#22c55e',
    curveColor: '#f59e0b',
    barFontSize: 12,
    baseFontSize: 12,
    usl: undefined,
    lsl: undefined,
    target: undefined,
    bins: 'auto',
    showCurve: false
};

export const DEFAULT_HISTOGRAM_DATA: number[] = [
    9.8, 10.1, 10.3, 9.7, 10.0, 10.2, 9.9, 10.1, 9.8, 10.0,
    10.4, 9.6, 10.1, 10.0, 9.9, 10.2, 9.8, 10.3, 10.1, 9.7,
    10.0, 10.2, 9.9, 10.1, 10.0
];

export const INITIAL_HISTOGRAM_DSL = `Title: 直方图 (Histogram)
Color[Title]: #1e293b
Color[Bar]: #3b82f6
Color[USL]: #ef4444
Color[LSL]: #ef4444
Color[Target]: #22c55e
Color[Curve]: #f59e0b
Font[Title]: 18
Font[Base]: 12

# 规格限配置
USL: 10.5
LSL: 9.5
Target: 10.0

# 分组配置
Bins: auto
ShowCurve: true

# 原始数据
- 9.8
- 10.1
- 10.3
- 9.7
- 10.0
- 10.2
- 9.9
- 10.1
- 9.8
- 10.0
- 10.4
- 9.6
- 10.1
- 10.0
- 9.9
- 10.2
- 9.8
- 10.3
- 10.1
- 9.7
- 10.0
- 10.2
- 9.9
- 10.1
- 10.0`;
