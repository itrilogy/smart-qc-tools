'use client';

import React, { useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import ReactECharts from 'echarts-for-react';
import 'echarts-gl'; // Register 3D components
import { ScatterPoint, ScatterChartStyles, DEFAULT_SCATTER_STYLES, ScatterChartRef } from './types';

interface ScatterChart3DProps {
    data: ScatterPoint[];
    styles: ScatterChartStyles;
    className?: string; // Support className for layout consistency
}

export const ScatterChart3D = forwardRef<ScatterChartRef, ScatterChart3DProps>(({ data, styles, className }, ref) => {
    const finalStyles = { ...DEFAULT_SCATTER_STYLES, ...styles };
    const echartsRef = useRef<any>(null);

    // Expose export methods
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
            link.download = `3D散点图_${new Date().getTime()}.png`;
            link.href = url;
            link.click();
        },
        exportPDF: () => {
            // 3D PDF is hard, maybe just screenshot
            if (!echartsRef.current) return;
            const instance = echartsRef.current.getEchartsInstance();
            const url = instance.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: '#fff' });
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(`<html><body style="margin:0;display:flex;justify-content:center;align-items:center;height:100vh"><img src="${url}" style="max-width:100%;max-height:100%"/></body></html>`);
                setTimeout(() => win.print(), 500);
            }
        }
    }));

    const option = useMemo(() => {
        // Prepare data for 3D: [x, y, z]
        const seriesData = data.map(p => [
            p.x,
            p.y,
            p.z !== undefined ? p.z : 0
        ]);

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
                    const val = params.value; // [x, y, z]
                    return `
                        <div style="font-weight:bold; margin-bottom:5px;">数据点</div>
                        X: ${val[0]}<br/>
                        Y: ${val[1]}<br/>
                        Z: ${val[2]}
                    `;
                }
            },
            grid3D: {
                viewControl: {
                    // autoRotate: true,
                    projection: 'perspective'
                },
                boxWidth: 100,
                boxDepth: 100,
                boxHeight: 100,
                axisPointer: {
                    show: true,
                    lineStyle: { color: '#cbd5e1', width: 1 }
                },
                light: {
                    main: { intensity: 1.2, shadow: true, alpha: 55, beta: 10 },
                    ambient: { intensity: 0.3 }
                },
                environment: '#ffffff'
            },
            xAxis3D: {
                name: finalStyles.xAxisLabel,
                type: 'value',
                axisLine: { lineStyle: { color: '#64748b' } },
                axisLabel: { color: '#64748b', fontSize: 12 },
                nameTextStyle: { color: '#1e293b', fontSize: 14, fontWeight: 'bold' }
            },
            yAxis3D: {
                name: finalStyles.yAxisLabel,
                type: 'value',
                axisLine: { lineStyle: { color: '#64748b' } },
                axisLabel: { color: '#64748b', fontSize: 12 },
                nameTextStyle: { color: '#1e293b', fontSize: 14, fontWeight: 'bold' }
            },
            zAxis3D: {
                name: finalStyles.zAxisLabel || 'Z',
                type: 'value',
                axisLine: { lineStyle: { color: '#64748b' } },
                axisLabel: { color: '#64748b', fontSize: 12 },
                nameTextStyle: { color: '#1e293b', fontSize: 14, fontWeight: 'bold' }
            },
            series: [{
                type: 'scatter3D',
                data: seriesData,
                symbolSize: finalStyles.baseSize * 1.5,
                itemStyle: {
                    color: finalStyles.pointColor,
                    opacity: 0.8
                },
                emphasis: {
                    itemStyle: { color: '#ef4444', opacity: 1 }
                }
            }]
        };
    }, [data, finalStyles]);

    if (!data || data.length === 0) {
        return (
            <div className={`flex items-center justify-center bg-slate-50 text-slate-400 ${className}`}>
                <p>暂无数据</p>
            </div>
        );
    }

    return (
        <div className={`${className} bg-white p-4 rounded-xl shadow-sm border border-slate-100 overflow-hidden`}>
            <ReactECharts
                ref={echartsRef}
                option={option}
                style={{ height: '100%', width: '100%' }}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
});

ScatterChart3D.displayName = 'ScatterChart3D';
