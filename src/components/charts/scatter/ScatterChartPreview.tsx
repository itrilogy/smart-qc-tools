'use client';

import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactECharts from 'echarts-for-react';
import { ScatterPoint, ScatterChartStyles, ScatterChartRef, DEFAULT_SCATTER_STYLES } from './types';
import { Loader2 } from 'lucide-react';

interface ScatterChartPreviewProps {
    data: ScatterPoint[];
    styles: ScatterChartStyles;
    isGenerating?: boolean;
    className?: string;
}

export const ScatterChartPreview = forwardRef<ScatterChartRef, ScatterChartPreviewProps>(({ data, styles, isGenerating, className }, ref) => {
    const echartsRef = useRef<any>(null);
    const finalStyles = { ...DEFAULT_SCATTER_STYLES, ...styles };

    // Handle Exports
    useImperativeHandle(ref, () => ({
        exportPNG: (transparent = false) => {
            if (!echartsRef.current) return;
            const instance = echartsRef.current.getEchartsInstance();
            const url = instance.getDataURL({
                type: 'png',
                pixelRatio: 2,
                backgroundColor: transparent ? 'transparent' : '#fff'
            });
            const link = document.createElement('a');
            link.download = `散点图_${new Date().getTime()}.png`;
            link.href = url;
            link.click();
        },
        exportPDF: () => {
            if (!echartsRef.current) return;
            const instance = echartsRef.current.getEchartsInstance();
            const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });

            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`
                    <html>
                        <head><title>导出 PDF - Smart QC Tools</title></head>
                        <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#f8fafc;">
                            <img src="${url}" style="max-width:95%; max-height:95%; object-fit:contain; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);" />
                        </body>
                    </html>
                `);
                win.document.close();
                setTimeout(() => {
                    win.print();
                    win.close();
                }, 800);
            }
        }
    }));

    const option = useMemo(() => {
        if (!data || data.length === 0) return {};

        // Prepare data: [[x, y, z, id]]
        const seriesData = data.map(p => [p.x, p.y, p.z || 0, p.id]);

        // Calculate regression if needed
        let regressionSeries = [];
        if (finalStyles.showTrend && data.length > 1) {
            let n = data.length;
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            data.forEach(p => {
                sumX += p.x;
                sumY += p.y;
                sumXY += (p.x * p.y);
                sumXX += (p.x * p.x);
            });

            const denominator = (n * sumXX - sumX * sumX);
            if (denominator !== 0) {
                const slope = (n * sumXY - sumX * sumY) / denominator;
                const intercept = (sumY - slope * sumX) / n;

                const minX = Math.min(...data.map(d => d.x));
                const maxX = Math.max(...data.map(d => d.x));

                // Add some padding to regression line
                const xPad = (maxX - minX) * 0.1;

                regressionSeries.push({
                    name: '趋势线',
                    type: 'line',
                    data: [[minX - xPad, (minX - xPad) * slope + intercept], [maxX + xPad, (maxX + xPad) * slope + intercept]],
                    showSymbol: false,
                    lineStyle: {
                        color: finalStyles.trendColor,
                        width: 2,
                        type: 'dashed'
                    },
                    z: 1
                });
            }
        }

        return {
            title: {
                text: finalStyles.title,
                left: 'center',
                top: 20,
                textStyle: {
                    fontSize: finalStyles.titleFontSize,
                    fontWeight: 'bold',
                    color: '#1e293b'
                }
            },
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    if (params.seriesType === 'line') return '';
                    const [x, y, z] = params.value;
                    return `
                        <div style="font-weight:bold; margin-bottom:4px; font-size:12px; color:#64748b;">数据点统计</div>
                        <div style="display:flex; justify-content:space-between; gap:20px;">
                            <span style="color:#94a3b8">X 轴:</span>
                            <span style="font-weight:600; color:#1e293b">${x}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; gap:20px;">
                            <span style="color:#94a3b8">Y 轴:</span>
                            <span style="font-weight:600; color:#1e293b">${y}</span>
                        </div>
                        ${z > 0 ? `
                        <div style="display:flex; justify-content:space-between; gap:20px;">
                            <span style="color:#94a3b8">Z 轴 (大小):</span>
                            <span style="font-weight:600; color:#1e293b">${z}</span>
                        </div>` : ''}
                    `;
                }
            },
            grid: {
                top: 80,
                left: '10%',
                right: '10%',
                bottom: 80,
                containLabel: true
            },
            xAxis: {
                name: finalStyles.xAxisLabel,
                nameLocation: 'center',
                nameGap: 35,
                type: 'value',
                scale: true,
                axisLine: { lineStyle: { color: '#e2e8f0' } },
                axisLabel: { color: '#64748b', fontSize: finalStyles.baseFontSize || 12 },
                nameTextStyle: { color: '#1e293b', fontSize: (finalStyles.baseFontSize || 12) + 2, fontWeight: 'bold' },
                splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
            },
            yAxis: {
                name: finalStyles.yAxisLabel,
                nameLocation: 'center',
                nameGap: 50,
                type: 'value',
                scale: true,
                axisLine: { lineStyle: { color: '#e2e8f0' } },
                axisLabel: { color: '#64748b', fontSize: finalStyles.baseFontSize || 12 },
                nameTextStyle: { color: '#1e293b', fontSize: (finalStyles.baseFontSize || 12) + 2, fontWeight: 'bold' },
                splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } }
            },
            dataZoom: [
                {
                    type: 'inside', // Mousewheel zoom
                    xAxisIndex: 0,
                    filterMode: 'none'
                },
                {
                    type: 'inside',
                    yAxisIndex: 0,
                    filterMode: 'none'
                }
            ],
            series: [
                {
                    name: '散点',
                    type: 'scatter',
                    data: seriesData,
                    symbolSize: (val: any) => {
                        const z = val[2];
                        if (!z) return finalStyles.baseSize;
                        // Linear scale for Z bubble: baseSize to 5*baseSize
                        const zMin = Math.min(...data.map(d => d.z || 0));
                        const zMax = Math.max(...data.map(d => d.z || 0));
                        if (zMax === zMin) return finalStyles.baseSize;
                        return finalStyles.baseSize * (1 + (z - zMin) / (zMax - zMin) * 3);
                    },
                    itemStyle: {
                        color: finalStyles.pointColor,
                        opacity: finalStyles.opacity,
                        borderColor: '#fff',
                        borderWidth: 1
                    },
                    emphasis: {
                        itemStyle: {
                            opacity: 1,
                            shadowBlur: 10,
                            shadowColor: 'rgba(0,0,0,0.3)'
                        }
                    },
                    z: 2
                },
                ...regressionSeries
            ]
        };
    }, [data, finalStyles]);

    if (isGenerating) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 animate-pulse">
                <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                <p className="font-mono text-sm">AI 正在推理数据逻辑...</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400">
                <p>暂无数据</p>
            </div>
        );
    }

    return (
        <div className={`${className || ''} w-full h-full bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden`}>
            <ReactECharts
                ref={echartsRef}
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
                notMerge={true}
            />
        </div>
    );
});

ScatterChartPreview.displayName = 'ScatterChartPreview';
