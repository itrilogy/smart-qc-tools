'use client';

import React, { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import ReactECharts from 'echarts-for-react';
import { ParetoItem, ParetoChartStyles, DEFAULT_PARETO_STYLES } from './types';

export interface ParetoChartRef {
    exportPNG: (transparent?: boolean) => void;
    exportPDF: () => void;
    getChartDataURL: (transparent?: boolean) => string;
}

interface ParetoChartProps {
    data: ParetoItem[];
    styles?: ParetoChartStyles;
    className?: string;
    showLine?: boolean;
}

export const ParetoChart = forwardRef<ParetoChartRef, ParetoChartProps>(({ data, styles, className, showLine = true }, ref) => {
    const echartsRef = useRef<any>(null);
    const finalStyles = { ...DEFAULT_PARETO_STYLES, ...styles };

    // 暴露方法给外部
    useImperativeHandle(ref, () => ({
        exportPNG: (transparent = false) => {
            if (!echartsRef.current) return;
            const echartsInstance = echartsRef.current.getEchartsInstance();
            const dataURL = echartsInstance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: transparent ? 'transparent' : '#fff'
            });

            const link = document.createElement('a');
            link.download = `排列图_${new Date().getTime()}.png`;
            link.href = dataURL;
            link.click();
        },
        exportPDF: () => {
            if (!echartsRef.current) return;
            const echartsInstance = echartsRef.current.getEchartsInstance();
            const dataURL = echartsInstance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: '#fff'
            });

            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`
                    <html>
                        <head><title>导出 PDF - Smart QC Tools</title></head>
                        <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#f8fafc;">
                            <img src="${dataURL}" style="max-width:95%; max-height:95%; object-fit:contain; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);" />
                        </body>
                    </html>
                `);
                win.document.close();
                setTimeout(() => {
                    win.print();
                    win.close();
                }, 800);
            }
        },
        getChartDataURL: (transparent = false) => {
            if (!echartsRef.current) return '';
            const echartsInstance = echartsRef.current.getEchartsInstance();
            return echartsInstance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: transparent ? 'transparent' : '#fff'
            });
        }
    }));

    // 数据处理：计算累计频率
    const processedData = useMemo(() => {
        const total = data.reduce((sum, item) => sum + item.value, 0);
        let currentSum = 0;

        return data.map((item) => {
            currentSum += item.value;
            return {
                ...item,
                cumulativeRatio: total > 0 ? (currentSum / total) * 100 : 0
            };
        });
    }, [data]);

    const option = useMemo(() => {
        const xData = processedData.map(i => i.name);
        const yDataBar = processedData.map(i => i.value);
        const yDataLine = processedData.map(i => i.cumulativeRatio);
        const decimals = finalStyles.decimals ?? 1;

        return {
            title: {
                text: finalStyles.title || '排列图 (Pareto Chart)',
                left: 'center',
                top: 20,
                textStyle: {
                    fontSize: finalStyles.titleFontSize,
                    fontWeight: 'bold',
                    color: finalStyles.titleColor
                }
            },
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'cross' },
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                borderColor: '#e2e8f0',
                borderWidth: 1,
                padding: [10, 14],
                textStyle: { color: '#1e293b', fontSize: 13 },
                formatter: (params: any[]) => {
                    const bar = params.find(p => p.seriesType === 'bar');
                    const line = params.find(p => p.seriesType === 'line');
                    return `
                        <div style="font-weight: 700; margin-bottom: 6px; color: #1e293b">${bar ? bar.name : ''}</div>
                        <div style="display: flex; justify-content: space-between; gap: 20px;">
                            <span style="color: #64748b">频数:</span>
                            <span style="font-weight: 600">${bar ? bar.value : 0}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; gap: 20px;">
                            <span style="color: #64748b">累计频率:</span>
                            <span style="font-weight: 600; color: ${finalStyles.lineColor}">${line ? line.value.toFixed(decimals) : 0}%</span>
                        </div>
                    `;
                }
            },
            grid: {
                top: 100,
                bottom: 60,
                left: 80,
                right: 80
            },
            xAxis: {
                type: 'category',
                data: xData,
                axisTick: { alignWithLabel: true },
                axisLabel: {
                    interval: 0,
                    rotate: 30,
                    color: '#64748b',
                    fontSize: finalStyles.baseFontSize
                },
                axisLine: { lineStyle: { color: '#cbd5e1' } }
            },
            yAxis: [
                {
                    type: 'value',
                    name: '频数',
                    position: 'left',
                    nameTextStyle: { color: '#64748b', fontSize: finalStyles.baseFontSize, padding: [0, 0, 10, 0] },
                    axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
                    splitLine: { show: true, lineStyle: { type: 'dashed', color: '#f1f5f9' } },
                    axisLabel: { color: '#64748b', fontSize: finalStyles.baseFontSize }
                },
                {
                    type: 'value',
                    name: '累计频率 (%)',
                    position: 'right',
                    min: 0,
                    max: 100,
                    nameTextStyle: { color: '#64748b', fontSize: finalStyles.baseFontSize, padding: [0, 0, 10, 0] },
                    axisLine: { show: true, lineStyle: { color: '#cbd5e1' } },
                    splitLine: { show: false },
                    axisLabel: {
                        formatter: '{value}%',
                        color: '#64748b',
                        fontSize: finalStyles.baseFontSize
                    }
                }
            ],
            series: [
                {
                    name: '频数',
                    type: 'bar',
                    data: yDataBar,
                    barWidth: '55%',
                    itemStyle: {
                        color: finalStyles.barColor,
                        borderRadius: [6, 6, 0, 0]
                    },
                    label: {
                        show: true,
                        position: 'top',
                        color: finalStyles.barColor,
                        fontSize: finalStyles.barFontSize,
                        fontWeight: 'bold'
                    }
                },
                {
                    name: '累计频率',
                    type: 'line',
                    yAxisIndex: 1,
                    data: yDataLine,
                    symbol: 'circle',
                    symbolSize: 10,
                    itemStyle: {
                        color: finalStyles.lineColor,
                        borderWidth: 2,
                        borderColor: '#fff'
                    },
                    lineStyle: {
                        width: 4,
                        shadowColor: 'rgba(245, 158, 11, 0.3)',
                        shadowBlur: 10
                    },
                    label: {
                        show: true,
                        position: 'top',
                        formatter: (params: any) => `${params.value.toFixed(decimals)}%`,
                        color: finalStyles.lineColor,
                        fontWeight: 'bold',
                        fontSize: finalStyles.lineFontSize
                    },
                    markLine: showLine ? {
                        silent: true,
                        symbol: 'none',
                        label: {
                            position: 'end',
                            formatter: '80% 关键线',
                            color: finalStyles.markLineColor,
                            fontSize: 12,
                            fontWeight: 'bold'
                        },
                        lineStyle: {
                            type: 'dashed',
                            color: finalStyles.markLineColor,
                            width: 2
                        },
                        data: [{ yAxis: 80 }]
                    } : null
                }
            ],
            backgroundColor: '#ffffff'
        };
    }, [processedData, showLine, finalStyles]);

    return (
        <div className={`${className} bg-white p-4 rounded-xl shadow-sm border border-slate-100`}>
            <ReactECharts
                ref={echartsRef}
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
});

ParetoChart.displayName = 'ParetoChart';
