import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Graph } from '@antv/g6';
import { FishboneNode, FishboneChartStyles, DEFAULT_CHART_STYLES } from './types';

export interface FishboneChartRef {
    exportPNG: (transparent?: boolean) => void;
    exportSVG: () => void;
    exportPDF: () => void;
    tidyLayout: () => void;
}

interface FishboneChartProps {
    data: FishboneNode;
    styles?: FishboneChartStyles;
    className?: string;
}

export const FishboneChart = forwardRef<FishboneChartRef, FishboneChartProps>(({ data, styles, className }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const graphRef = useRef<Graph | null>(null);

    // 合并默认配色与自定义配色，使其在导出函数与渲染函数中均可见
    const finalStyles = { ...DEFAULT_CHART_STYLES, ...styles };

    // 暴露方法给外部
    useImperativeHandle(ref, () => ({
        exportPNG: async (transparent = false) => {
            if (!graphRef.current) return;
            // 1. 获取图表原始图片 (可能含透明)
            const rawDataURL = await graphRef.current.toDataURL();

            if (transparent) {
                const link = document.createElement('a');
                link.download = `鱼骨图_透明_${new Date().getTime()}.png`;
                link.href = rawDataURL;
                link.click();
                return;
            }

            // 2. 手动合并白色背景 (解决 G6 内置背景合成失效问题)
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.fillStyle = finalStyles.background || '#ffffff';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);
                    const link = document.createElement('a');
                    link.download = `鱼骨图_${new Date().getTime()}.png`;
                    link.href = canvas.toDataURL('image/png');
                    link.click();
                }
            };
            img.src = rawDataURL;
        },
        exportSVG: async () => {
            // 目前由于项目依赖限制，暂通过高清 PNG 代替，并提示用户渲染引擎状态
            if (!graphRef.current) return;
            const dataURL = await graphRef.current.toDataURL();
            const link = document.createElement('a');
            link.download = `鱼骨图_矢量预览_${new Date().getTime()}.png`;
            link.href = dataURL;
            link.click();
            alert('当前使用高效 Canvas 引擎。如需导出矢量 SVG，建议使用浏览器的“打印 -> 另存为 PDF”功能，该 PDF 具备矢量缩放特性。');
        },
        exportPDF: async () => {
            if (!graphRef.current) return;
            // 核心思路：将图表转化为图片，在独立窗口中打印，防止输出侧边栏
            const dataURL = await graphRef.current.toDataURL({
                backgroundColor: finalStyles.background || '#ffffff'
            } as any);

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
        tidyLayout: () => {
            if (graphRef.current) {
                graphRef.current.fitView({ duration: 500 } as any);
            }
        }
    }));

    useEffect(() => {
        if (!containerRef.current) return;

        const {
            boneLine: boneLineColor,
            caseLine: caseLineColor,
            titleColor: titleTextColor,
            caseColor: caseTextColor,
            startColor,
            endColor,
            background: bgColor
        } = finalStyles;

        const width = containerRef.current.clientWidth || 800;
        const height = containerRef.current.clientHeight || 600;
        const cy = height / 2;

        const nodes: any[] = [];
        const edges: any[] = [];

        // --- 鱼头 (Root) ---
        const rootX = width - 150;
        const rootY = cy;
        nodes.push({
            id: 'root',
            data: { label: data.label, type: 'root' },
            style: {
                x: rootX,
                y: rootY,
                labelText: data.label,
                fill: startColor,
                labelFill: titleTextColor,
                label: {
                    fill: titleTextColor,
                    fontSize: 16,
                    fontWeight: 'bold'
                },
                labelFontSize: 16,
                labelFontWeight: 'bold',
                size: [140, 50],
                radius: 4,
                stroke: 'none',
            }
        });

        // --- 鱼尾 (Tail) ---
        const tailX = 50;
        nodes.push({
            id: 'tail',
            data: { type: 'tail' },
            style: {
                x: tailX,
                y: cy,
                size: [20, 60],
                fill: endColor,
                stroke: 'none',
                type: 'rect'
            }
        });

        // --- 脊椎 (Spine) ---
        edges.push({
            id: 'edge-spine',
            source: 'tail',
            target: 'root',
            style: {
                stroke: boneLineColor,
                lineWidth: 4,
                endArrow: {
                    path: 'M 0,0 L 10,5 L 10,-5 Z',
                    fill: boneLineColor
                }
            }
        });

        // --- 递归预计算权重 ---
        const calcWeight = (node: FishboneNode): number => {
            if (!node.children || node.children.length === 0) return 1;
            // 【优化】提高冗余因子，增大同级骨刺间的物理间距，防止积压
            return node.children.reduce((acc, child) => acc + calcWeight(child), 0) + 0.4;
        };

        // --- 大骨/中骨布局算法 ---
        if (data.children) {
            const mainWeights = data.children.map(calcWeight);
            const totalMainWeight = mainWeights.reduce((a, b) => a + b, 0);
            // 【优化】减少头部/尾部硬性预留，扩大可用脊椎空间
            const availableSpine = rootX - tailX - 100;

            data.children.forEach((mainNode, i) => {
                const isTop = i % 2 === 0;
                const prevWeights = mainWeights.slice(0, i).reduce((a, b) => a + b, 0);
                const baseX = tailX + 60 + (prevWeights + mainWeights[i] / 2) * (availableSpine / totalMainWeight);

                // 【大幅提升】大骨动态长度系数，提供更充裕的纵向展开空间
                const dynamicLen = 140 + mainWeights[i] * 65;
                const dx = dynamicLen * Math.cos(60 * Math.PI / 180);
                const dy = dynamicLen * Math.sin(60 * Math.PI / 180);
                const mainX = baseX - dx;
                const mainY = isTop ? cy - dy : cy + dy;

                nodes.push({
                    id: mainNode.id,
                    data: { label: mainNode.label, type: 'main' },
                    style: {
                        x: mainX, y: mainY,
                        labelText: mainNode.label,
                        fill: startColor,
                        stroke: boneLineColor,
                        lineWidth: 2,
                        labelFill: caseTextColor,
                        label: {
                            fill: caseTextColor,
                            fontWeight: 'bold'
                        },
                        labelFontWeight: 'bold',
                        size: [Math.max(100, mainNode.label.length * 15), 30],
                        radius: 4,
                    }
                });

                const anchorId = `anchor-${mainNode.id}`;
                nodes.push({
                    id: anchorId,
                    data: { type: 'anchor' },
                    style: { x: baseX, y: cy, size: 4, fill: '#475569', stroke: 'none' }
                });

                edges.push({
                    id: `edge-${anchorId}`,
                    source: anchorId, target: mainNode.id,
                    style: { stroke: boneLineColor, lineWidth: 3 }
                });

                const renderBranches = (
                    pNodeId: string, pEndX: number, pEndY: number, pStartX: number, pStartY: number,
                    children: FishboneNode[], level: number, isUpBase: boolean
                ) => {
                    if (!children || children.length === 0) return;
                    const childWeights = children.map(calcWeight);
                    const totalChildWeight = childWeights.reduce((a, b) => a + b, 0);
                    const pDirX = pEndX - pStartX;

                    children.forEach((child, idx) => {
                        const prevWeights = childWeights.slice(0, idx).reduce((a, b) => a + b, 0);
                        const weightRatio = (prevWeights + childWeights[idx] / 2) / totalChildWeight;
                        const startX = pStartX + (pEndX - pStartX) * weightRatio;
                        const startY = pStartY + (pEndY - pStartY) * weightRatio;
                        const side = (idx % 2 === 0) ? 1 : -1;

                        // 【大幅提升】分枝增长系数(35)与衰减保护(0.88)，防止深层文本拥挤
                        const branchLen = (50 + childWeights[idx] * 35) * Math.pow(0.88, level - 1);

                        let endX, endY;
                        if (level % 2 !== 0) {
                            endX = startX + side * branchLen;
                            endY = startY;
                        } else {
                            const angle = 60;
                            const dx = branchLen * Math.cos(angle * Math.PI / 180);
                            const dy = branchLen * Math.sin(angle * Math.PI / 180);
                            const dirFactor = pDirX >= 0 ? 1 : -1;
                            endX = startX + dirFactor * dx;
                            endY = startY + side * dy;
                        }

                        const currentLabelColor = level === 1 ? caseTextColor : '#475569';

                        nodes.push({
                            id: child.id,
                            data: { label: child.label, type: child.type },
                            style: {
                                x: endX, y: endY,
                                labelText: child.label,
                                labelFill: currentLabelColor,
                                label: {
                                    fill: currentLabelColor,
                                    fontSize: Math.max(10, 14 - (level - 1) * 1.2),
                                    fontWeight: level === 1 ? 'bold' : 'normal'
                                },
                                labelFontSize: Math.max(10, 14 - (level - 1) * 1.2),
                                labelFontWeight: level === 1 ? 'bold' : 'normal',
                                size: [2, 2], fill: caseLineColor, stroke: 'none'
                            }
                        });

                        const branchAnchorId = `ba-${child.id}`;
                        nodes.push({
                            id: branchAnchorId,
                            style: { x: startX, y: startY, size: 2, fill: '#cbd5e1', stroke: 'none' }
                        });

                        edges.push({
                            id: `edge-${child.id}`,
                            source: branchAnchorId, target: child.id,
                            style: { stroke: caseLineColor, lineWidth: Math.max(0.5, 1.5 / Math.pow(1.2, level - 1)) }
                        });

                        if (child.children) {
                            renderBranches(child.id, endX, endY, startX, startY, child.children, level + 1, isUpBase);
                        }
                    });
                };

                renderBranches(mainNode.id, mainX, mainY, baseX, cy, mainNode.children || [], 1, isTop);
            });
        }

        if (!graphRef.current) {
            graphRef.current = new Graph({
                container: containerRef.current,
                width,
                height,
                autoFit: 'view',
                data: { nodes, edges },
                behaviors: ['drag-canvas', 'zoom-canvas', 'drag-element'],
                background: bgColor, // 使用 DSL 定义的背景色
            });
            graphRef.current.render().then(() => {
                // 【优化】注入更大的 fitView padding (80)，防止文字贴地和互相积压
                graphRef.current?.fitView({ duration: 500, padding: 80 } as any);
            });
        } else {
            // 【核心修复】动态更新 G6 背景与配置，防止被“锁死”在初始值
            graphRef.current.setOptions({ background: bgColor });
            graphRef.current.setData({ nodes, edges });
            graphRef.current.render().then(() => {
                graphRef.current?.fitView({ duration: 500, padding: 80 } as any);
            });
        }

        // 【终极自适应】引入 ResizeObserver 物理级监听容器尺寸变化
        const resizeObserver = new ResizeObserver((entries) => {
            if (!containerRef.current || !graphRef.current) return;
            const { width, height } = entries[0].contentRect;
            if (width > 0 && height > 0) {
                graphRef.current.setSize(width, height);
                graphRef.current.fitView({ duration: 300, padding: 80 } as any);
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, [data, styles]);

    return (
        <div
            ref={containerRef}
            className={className}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: styles?.background || '#ffffff', // 强制注入背景色，解决锁定问题
                transition: 'background-color 0.3s ease'
            }}
        >
        </div>
    );
});
