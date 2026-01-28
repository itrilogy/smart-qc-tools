/**
 * 控制图 (Control Chart) 类型定义
 */

export type ControlChartType =
    | 'I-MR (仅限单维)'
    | 'X-bar-R (仅限单维)'
    | 'X-bar-S (仅限单维)'
    | 'P / NP (仅限单维)'
    | 'C / U (仅限单维)'
    | 'T2 (仅限多维)'
    | 'Parallel (可用于多维)';

export type ControlRule = 'Basic' | 'Western-Electric' | 'Nelson';

export interface ControlSeries {
    name: string;
    data: number[];
}

export interface ControlChartStyles {
    title: string;
    type: ControlChartType;
    subgroupSize: number; // Size: N
    rules: ControlRule[];

    // 限制线 (可选)
    ucl?: number;
    lcl?: number;
    cl?: number;

    // 视觉配置
    titleColor: string;
    lineColor: string;
    uclColor: string;
    clColor: string;
    pointColor: string;
    background: string;

    titleFontSize: number;
    baseFontSize: number;
    labelFontSize: number;

    decimals: number;
}

export interface ControlChartProps {
    series: ControlSeries[];
    styles: ControlChartStyles;
    className?: string;
}

export interface ControlChartRef {
    exportPNG: (transparent?: boolean) => void;
    exportPDF: () => void;
}

export const DEFAULT_CONTROL_STYLES: Required<ControlChartStyles> = {
    title: '控制图 (Control Chart)',
    type: 'I-MR (仅限单维)',
    subgroupSize: 1,
    rules: ['Basic'],
    ucl: 0,
    lcl: 0,
    cl: 0,
    titleColor: '#1e293b',
    lineColor: '#3b82f6',
    uclColor: '#ef4444',
    clColor: '#22c55e',
    pointColor: '#1d4ed8',
    background: '#f8fafc',
    titleFontSize: 20,
    baseFontSize: 12,
    labelFontSize: 10,
    decimals: 2
};

export const INITIAL_CONTROL_DSL = `// 示例：轴类零件外径加工过程监控
// 包含 25 个连续观测值，若子组大小为 5，则自动计算 5 个子组的均值与极差
Title: 活塞销外径加工过程监控（高频采样）
Type: X-bar-R (仅限单维)
Size: 5
Rules: Western-Electric,Nelson
Decimals: 3

[series]: 测量观测值
12.012, 11.985, 12.053, 12.001, 11.974
12.022, 11.991, 12.035, 12.011, 12.042
11.988, 12.005, 12.021, 11.995, 12.018
12.031, 11.978, 11.999, 12.015, 12.024
12.008, 12.026, 11.984, 12.041, 11.992
[/series]`;

/**
 * DSL 解析器
 */
export function parseControlDSL(dsl: string): { series: ControlSeries[]; styles: Partial<ControlChartStyles> } {
    const lines = dsl.split('\n').map(l => l.trimEnd());
    const styles: Partial<ControlChartStyles> = {};
    const series: ControlSeries[] = [];

    let currentSeries: ControlSeries | null = null;
    let isDataBlock = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || (trimmed.startsWith('//') && !isDataBlock)) continue;

        // Header configs
        if (trimmed.startsWith('Title:')) {
            styles.title = trimmed.substring(6).trim();
            continue;
        }
        if (trimmed.startsWith('Type:')) {
            styles.type = trimmed.substring(5).trim() as ControlChartType;
            continue;
        }
        if (trimmed.startsWith('Size:')) {
            styles.subgroupSize = parseInt(trimmed.substring(5).trim());
            continue;
        }
        if (trimmed.startsWith('Rules:')) {
            styles.rules = trimmed.substring(6).split(',').map(r => r.trim() as ControlRule);
            continue;
        }
        if (trimmed.startsWith('UCL:')) {
            styles.ucl = parseFloat(trimmed.substring(4).trim());
            continue;
        }
        if (trimmed.startsWith('LCL:')) {
            styles.lcl = parseFloat(trimmed.substring(4).trim());
            continue;
        }
        if (trimmed.startsWith('CL:')) {
            styles.cl = parseFloat(trimmed.substring(3).trim());
            continue;
        }
        if (trimmed.startsWith('Decimals:')) {
            styles.decimals = parseInt(trimmed.substring(9).trim());
            continue;
        }

        // Colors
        const colorMatch = trimmed.match(/^Color\[(\w+)\]:\s*(#[0-9A-Fa-f]{6})/);
        if (colorMatch) {
            const [, key, val] = colorMatch;
            if (key === 'Title') styles.titleColor = val;
            if (key === 'Line') styles.lineColor = val;
            if (key === 'UCL') styles.uclColor = val;
            if (key === 'CL') styles.clColor = val;
            if (key === 'Point') styles.pointColor = val;
            continue;
        }

        // Series Block
        if (trimmed.startsWith('[series]:')) {
            isDataBlock = true;
            currentSeries = {
                name: trimmed.substring(9).trim(),
                data: []
            };
            continue;
        }
        if (trimmed === '[/series]') {
            if (currentSeries) series.push(currentSeries);
            currentSeries = null;
            isDataBlock = false;
            continue;
        }

        if (isDataBlock && currentSeries) {
            // 支持逗号、空格或分号分隔的多值解析
            const values = trimmed.split(/[,;\s]+/).map(v => parseFloat(v));
            values.forEach(val => {
                if (!isNaN(val)) {
                    currentSeries!.data.push(val);
                }
            });
            continue;
        }
    }

    return { series, styles };
}
