/**
 * 控制图 (Control Chart) 渲染组件
 * 基于 Canvas 提供工业级精度的控制图绘制
 */
import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
    ControlSeries,
    ControlChartStyles,
    ControlChartRef,
    ControlChartProps,
    DEFAULT_CONTROL_STYLES
} from './types';

// SPC 统计常数表 (用于计算控制限)
const SPC_CONSTANTS: Record<number, { a2: number; d2: number; d3: number; d4: number; a3: number; b3: number; b4: number }> = {
    2: { a2: 1.880, d2: 1.128, d3: 0, d4: 3.267, a3: 2.659, b3: 0, b4: 3.267 },
    3: { a2: 1.023, d2: 1.693, d3: 0, d4: 2.574, a3: 1.954, b3: 0, b4: 2.568 },
    4: { a2: 0.729, d2: 2.059, d3: 0, d4: 2.282, a3: 1.628, b3: 0, b4: 2.266 },
    5: { a2: 0.577, d2: 2.326, d3: 0, d4: 2.114, a3: 1.427, b3: 0, b4: 2.089 },
    6: { a2: 0.483, d2: 2.534, d3: 0, d4: 2.004, a3: 1.287, b3: 0.030, b4: 1.970 },
    7: { a2: 0.419, d2: 2.704, d3: 0.076, d4: 1.924, a3: 1.182, b3: 0.118, b4: 1.882 },
    8: { a2: 0.373, d2: 2.847, d3: 0.136, d4: 1.864, a3: 1.099, b3: 0.185, b4: 1.815 },
    9: { a2: 0.337, d2: 2.970, d3: 0.184, d4: 1.816, a3: 1.032, b3: 0.239, b4: 1.761 },
    10: { a2: 0.308, d2: 3.078, d3: 0.223, d4: 1.777, a3: 0.975, b3: 0.284, b4: 1.716 }
};

export const ControlChart = forwardRef<ControlChartRef, ControlChartProps>(
    ({ series, styles, className }: ControlChartProps, ref: React.ForwardedRef<ControlChartRef>) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

        const finalStyles = useMemo(() => ({
            ...DEFAULT_CONTROL_STYLES,
            ...styles
        }), [styles]);

        // 核心统计计算逻辑
        const stats = useMemo(() => {
            if (series.length === 0 || series[0].data.length === 0) return null;

            const rawData = series[0].data;
            const n = finalStyles.subgroupSize;
            const chartType = finalStyles.type;

            // 1. 分组处理
            const subgroups: number[][] = [];
            for (let i = 0; i < rawData.length; i += n) {
                if (i + n <= rawData.length) {
                    subgroups.push(rawData.slice(i, i + n));
                }
            }

            if (subgroups.length === 0) return null;

            // 2. 计算各组统计量
            const means = subgroups.map((group: number[]) => group.reduce((a: number, b: number) => a + b, 0) / group.length);
            const ranges = subgroups.map((group: number[]) => Math.max(...group) - Math.min(...group));

            // 3. 计算全局统计量
            const xDoubleBar = means.reduce((a: number, b: number) => a + b, 0) / means.length;
            const rBar = ranges.reduce((a: number, b: number) => a + b, 0) / ranges.length;

            // 4. 计算控制限 (以 X-bar-R 为例)
            let ucl = finalStyles.ucl || 0;
            let lcl = finalStyles.lcl || 0;
            let cl = finalStyles.cl || xDoubleBar;
            let sigma = 0;

            const constants = SPC_CONSTANTS[n] || SPC_CONSTANTS[2];

            if (!finalStyles.ucl || !finalStyles.lcl) {
                if (chartType.includes('X-bar-R')) {
                    ucl = xDoubleBar + constants.a2 * rBar;
                    lcl = xDoubleBar - constants.a2 * rBar;
                    sigma = (ucl - cl) / 3;
                } else if (chartType.includes('I-MR')) {
                    // 对于 I-MR, n=1, 我们使用移动极差
                    const mrs: number[] = [];
                    for (let i = 1; i < rawData.length; i++) {
                        mrs.push(Math.abs(rawData[i] - rawData[i - 1]));
                    }
                    const mrBar = mrs.length > 0 ? mrs.reduce((a, b) => a + b, 0) / mrs.length : 0;
                    cl = rawData.reduce((a, b) => a + b, 0) / rawData.length;
                    ucl = cl + 2.66 * mrBar; // 2.66 是 3/d2 (d2 for n=2 is 1.128)
                    lcl = cl - 2.66 * mrBar;
                    sigma = 0.886 * mrBar; // mrBar / d2
                } else {
                    // 默认降级处理
                    ucl = xDoubleBar + 3 * (rBar / constants.d2 / Math.sqrt(n));
                    lcl = xDoubleBar - 3 * (rBar / constants.d2 / Math.sqrt(n));
                    sigma = (ucl - cl) / 3;
                }
            }

            // 5. 判异规则引擎 (专业版 Nelson Rules)
            const outliers: number[] = [];
            const dataToTest = (chartType.includes('I-MR')) ? rawData : means;

            dataToTest.forEach((val: number, i: number) => {
                // Rule 1: Beyond Limits (Standard)
                if (val > ucl || val < lcl) {
                    outliers.push(i);
                    return;
                }

                // Western-Electric / Nelson Rule 2: 9 points in a row on one side of center
                if (finalStyles.rules.includes('Western-Electric') || finalStyles.rules.includes('Nelson')) {
                    if (i >= 8) {
                        const slice = dataToTest.slice(i - 8, i + 1);
                        if (slice.every((v: number) => v > cl) || slice.every((v: number) => v < cl)) {
                            outliers.push(i);
                        }
                    }
                }

                // Nelson Rule 3: 6 points in a row continually increasing or decreasing
                if (finalStyles.rules.includes('Nelson')) {
                    if (i >= 5) {
                        const slice = dataToTest.slice(i - 5, i + 1);
                        let inc = true, dec = true;
                        for (let j = 1; j < slice.length; j++) {
                            if (slice[j] <= slice[j - 1]) inc = false;
                            if (slice[j] >= slice[j - 1]) dec = false;
                        }
                        if (inc || dec) outliers.push(i);
                    }
                }

                // Nelson Rule 4: 14 points in a row alternating up and down
                if (finalStyles.rules.includes('Nelson')) {
                    if (i >= 13) {
                        const slice = dataToTest.slice(i - 13, i + 1);
                        let alt = true;
                        for (let j = 1; j < slice.length; j++) {
                            const diff = slice[j] - slice[j - 1];
                            const prevDiff = j > 1 ? slice[j - 1] - slice[j - 2] : 0;
                            if (j > 1 && diff * prevDiff >= 0) {
                                alt = false;
                                break;
                            }
                        }
                        if (alt) outliers.push(i);
                    }
                }
            });

            return {
                points: dataToTest,
                cl,
                ucl,
                lcl,
                sigma,
                outliers
            };
        }, [series, finalStyles]);

        const draw = useCallback((transparentArg = false) => {
            const canvas = canvasRef.current;
            if (!canvas || !stats) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // 1. 确保尺寸为整数，避免亚像素带来的模糊/锯齿
            const displayWidth = Math.floor(dimensions.width);
            const displayHeight = Math.floor(dimensions.height);
            const dpr = window.devicePixelRatio || 1;

            // 2. 设置画布物理尺寸
            canvas.width = displayWidth * dpr;
            canvas.height = displayHeight * dpr;

            // 3. 缩放上下文并开启平滑特性
            ctx.scale(dpr, dpr);
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // 设置线段连接处为圆滑，防止突兀的尖刺（Sawtooth 效应）
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            // 清屏
            ctx.clearRect(0, 0, displayWidth, displayHeight);
            if (!transparentArg) {
                ctx.fillStyle = finalStyles.background;
                ctx.fillRect(0, 0, displayWidth, displayHeight);
            }

            const padding = { top: 80, right: 100, bottom: 60, left: 80 };
            const chartW = displayWidth - padding.left - padding.right;
            const chartH = displayHeight - padding.top - padding.bottom;

            // 算 Y 轴范围 (包含 UCL/LCL 并预留空间)
            const dataMax = Math.max(...stats.points, stats.ucl);
            const dataMin = Math.min(...stats.points, stats.lcl);
            const range = dataMax - dataMin;
            const yMax = dataMax + (range === 0 ? 1 : range * 0.2);
            const yMin = dataMin - (range === 0 ? 1 : range * 0.2);

            const getY = (val: number) => padding.top + chartH - ((val - yMin) / (yMax - yMin)) * chartH;
            const getX = (idx: number) => padding.left + (idx / (stats.points.length - 1 || 1)) * chartW;

            // --- 1. 绘制限制线 (UCL, CL, LCL) ---
            ctx.setLineDash([5, 5]);
            ctx.lineWidth = 1.5;

            // UCL
            ctx.strokeStyle = finalStyles.uclColor;
            ctx.beginPath();
            ctx.moveTo(padding.left, getY(stats.ucl));
            ctx.lineTo(padding.left + chartW, getY(stats.ucl));
            ctx.stroke();

            // LCL
            ctx.beginPath();
            ctx.moveTo(padding.left, getY(stats.lcl));
            ctx.lineTo(padding.left + chartW, getY(stats.lcl));
            ctx.stroke();

            // CL
            ctx.setLineDash([]);
            ctx.strokeStyle = finalStyles.clColor;
            ctx.beginPath();
            ctx.moveTo(padding.left, getY(stats.cl));
            ctx.lineTo(padding.left + chartW, getY(stats.cl));
            ctx.stroke();

            // 标注文字
            ctx.font = `bold ${finalStyles.labelFontSize}px sans-serif`;
            ctx.fillStyle = finalStyles.uclColor;
            ctx.fillText(`UCL: ${stats.ucl.toFixed(finalStyles.decimals)}`, padding.left + chartW + 5, getY(stats.ucl) + 4);
            ctx.fillText(`LCL: ${stats.lcl.toFixed(finalStyles.decimals)}`, padding.left + chartW + 5, getY(stats.lcl) + 4);
            ctx.fillStyle = finalStyles.clColor;
            ctx.fillText(`CL: ${stats.cl.toFixed(finalStyles.decimals)}`, padding.left + chartW + 5, getY(stats.cl) + 4);

            // --- 2. 绘制数据折线 ---
            ctx.strokeStyle = finalStyles.lineColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            stats.points.forEach((val: number, i: number) => {
                if (i === 0) ctx.moveTo(getX(i), getY(val));
                else ctx.lineTo(getX(i), getY(val));
            });
            ctx.stroke();

            // --- 3. 绘制数据点 ---
            stats.points.forEach((val: number, i: number) => {
                const isOutlier = stats.outliers.includes(i);
                ctx.fillStyle = isOutlier ? '#ef4444' : finalStyles.pointColor;
                ctx.beginPath();
                ctx.arc(getX(i), getY(val), isOutlier ? 5 : 4, 0, Math.PI * 2);
                ctx.fill();

                if (isOutlier) {
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            // --- 4. 坐标轴与标题 ---
            ctx.fillStyle = finalStyles.titleColor;
            ctx.font = `bold ${finalStyles.titleFontSize}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText(finalStyles.title, displayWidth / 2, padding.top / 2);
        }, [stats, dimensions, finalStyles]);

        useImperativeHandle(ref, () => ({
            exportPNG(transparent = false) {
                draw(transparent);
                const canvas = canvasRef.current;
                if (!canvas) return;
                const link = document.createElement('a');
                link.download = `控制图_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                setTimeout(() => draw(false), 50); // 恢复
            },
            exportPDF() {
                draw(false); // 确保包含背景
                const canvas = canvasRef.current;
                if (!canvas) return;
                const dataURL = canvas.toDataURL('image/png');

                const win = window.open('', '_blank');
                if (win) {
                    win.document.write(`
                        <html>
                            <head><title>导出 PDF - Smart QC Tools</title></head>
                            <body style="margin:0; display:flex; justify-content:center; align-items:center; height:100vh; background:#f8fafc;">
                                <img src="${dataURL}" style="max-width:98%; max-height:98%; object-fit:contain; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); border-radius: 8px;" />
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

        useEffect(() => {
            if (!containerRef.current) return;
            const resizeObserver = new ResizeObserver((entries) => {
                const { width, height } = entries[0].contentRect;
                if (width > 0 && height > 0) setDimensions({ width, height });
            });
            resizeObserver.observe(containerRef.current);
            return () => resizeObserver.disconnect();
        }, []);

        useEffect(() => {
            draw(false);
        }, [draw]);

        return (
            <div ref={containerRef} className={`${className} relative bg-white rounded-xl shadow-inner border border-slate-100 overflow-hidden`}>
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full block"
                />
            </div>
        );
    }
);

ControlChart.displayName = 'ControlChart';
export default ControlChart;
