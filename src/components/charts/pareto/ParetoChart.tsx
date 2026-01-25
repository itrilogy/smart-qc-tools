'use client';

import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { ParetoItem } from './types';

interface ParetoChartProps {
    data: ParetoItem[];
    className?: string;
}

export function ParetoChart({ data, className }: ParetoChartProps) {

    // 1. 数据处理：排序并计算累计频率
    const processedData = useMemo(() => {
        // 深拷贝并排序 (降序)
        // 注意：通常"其他"项即使数值大也放在最后，这里暂简单按数值排序
        const sorted = [...data].sort((a, b) => b.value - a.value);

        const total = sorted.reduce((sum, item) => sum + item.value, 0);

        // 计算累计百分比
        let currentSum = 0;
        const result = sorted.map((item) => {
            currentSum += item.value;
            return {
                ...item,
                cumulativeRatio: (currentSum / total) * 100
            };
        });

        return result;
    }, [data]);

    const option = useMemo(() => {
        const xData = processedData.map(i => i.name);
        const yDataBar = processedData.map(i => i.value);
        const yDataLine = processedData.map(i => i.cumulativeRatio);

        return {
            title: {
                text: '排列图 (Pareto Chart)',
                left: 'center',
                top: 10,
                textStyle: { fontWeight: 'normal' }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                formatter: (params: any[]) => {
                    const bar = params.find(p => p.seriesType === 'bar');
                    const line = params.find(p => p.seriesType === 'line');
                    return `
                        <div class="font-bold border-b pb-1 mb-1">${bar ? bar.name : ''}</div>
                        ${bar ? `频数: <b>${bar.value}</b><br/>` : ''}
                        ${line ? `累计频率: <b>${line.value.toFixed(1)}%</b>` : ''}
                    `;
                }
            },
            grid: {
                top: 80,
                bottom: 40,
                left: 60,
                right: 60
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisTick: { alignWithLabel: true }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '频数',
                    position: 'left',
                    axisLine: { show: true },
                    splitLine: { show: true, lineStyle: { type: 'dashed' } }
                },
                {
                    type: 'value',
                    name: '累计频率 (%)',
                    position: 'right',
                    min: 0,
                    max: 100,
                    axisLine: { show: true },
                    splitLine: { show: false },
                    axisLabel: { formatter: '{value} %' }
                }
            ],
            series: [
                {
                    name: '频数',
                    type: 'bar',
                    data: yDataBar,
                    barWidth: '60%',
                    itemStyle: {
                        color: {
                            type: 'linear',
                            x: 0, y: 0, x2: 0, y2: 1,
                            colorStops: [
                                { offset: 0, color: '#3b82f6' }, // blue-500
                                { offset: 1, color: '#1d4ed8' }  // blue-700
                            ]
                        },
                        borderRadius: [4, 4, 0, 0]
                    }
                },
                {
                    name: '累计频率',
                    type: 'line',
                    yAxisIndex: 1,
                    data: yDataLine,
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: {
                        color: '#f59e0b', // Amber
                        borderWidth: 2,
                        borderColor: '#fff'
                    },
                    lineStyle: {
                        width: 3,
                        shadowColor: 'rgba(245, 158, 11, 0.3)',
                        shadowBlur: 10
                    },
                    label: {
                        show: true,
                        position: 'top',
                        formatter: '{c}%',
                        color: '#f59e0b',
                        fontWeight: 'bold',
                        fontSize: 11
                    },
                    markLine: {
                        silent: true,
                        symbol: 'none',
                        label: {
                            position: 'end',
                            formatter: '80% 关键线',
                            color: '#ef4444'
                        },
                        lineStyle: {
                            type: 'dashed',
                            color: '#ef4444',
                            width: 1.5
                        },
                        data: [{ yAxis: 80 }]
                    }
                }
            ]
        };
    }, [processedData]);

    return (
        <div className={className}>
            <ReactECharts
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
}
