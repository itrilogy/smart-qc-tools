/**
 * 亲和图 (Affinity Diagram / KJ法) 渲染组件
 */
import React, { useRef, useImperativeHandle, forwardRef, useEffect, useState, useCallback, useMemo } from 'react';
import {
    AffinityItem,
    AffinityChartStyles,
    AffinityChartRef,
    AffinityChartProps,
    DEFAULT_AFFINITY_STYLES
} from './types';

export const AffinityChart = forwardRef<AffinityChartRef, AffinityChartProps>(
    ({ data, styles, className }, ref) => {
        const containerRef = useRef<HTMLDivElement>(null);
        const canvasRef = useRef<HTMLCanvasElement>(null);
        const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

        const [scale, setScale] = useState(1);
        const [offset, setOffset] = useState({ x: 0, y: 0 });
        const [isDragging, setIsDragging] = useState(false);
        const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

        const finalStyles = useMemo(() => ({
            ...DEFAULT_AFFINITY_STYLES,
            ...styles
        }), [styles]);

        useImperativeHandle(ref, () => ({
            exportPNG(transparent = false) {
                const canvas = canvasRef.current;
                if (!canvas) return;
                const contentSize = calculateContentSize(data, finalStyles);
                const exportCanvas = document.createElement('canvas');
                exportCanvas.width = contentSize.width;
                exportCanvas.height = contentSize.height;
                const ctx = exportCanvas.getContext('2d')!;
                if (!transparent) {
                    ctx.fillStyle = finalStyles.background;
                    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                }
                if (finalStyles.type === 'Label') {
                    renderLabelStyle(ctx, data, finalStyles, contentSize);
                } else {
                    renderPlateStyle(ctx, data, finalStyles, contentSize);
                }
                const link = document.createElement('a');
                link.download = `亲和图_${Date.now()}.png`;
                link.href = exportCanvas.toDataURL('image/png');
                link.click();
            },
            exportPDF() {
                const contentSize = calculateContentSize(data, finalStyles);
                const exportCanvas = document.createElement('canvas');
                exportCanvas.width = contentSize.width;
                exportCanvas.height = contentSize.height;
                const ctx = exportCanvas.getContext('2d')!;
                ctx.fillStyle = finalStyles.background;
                ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
                if (finalStyles.type === 'Label') {
                    renderLabelStyle(ctx, data, finalStyles, contentSize);
                } else {
                    renderPlateStyle(ctx, data, finalStyles, contentSize);
                }
                const dataURL = exportCanvas.toDataURL('image/png');
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
            resetView() {
                setScale(1);
                setOffset({ x: 0, y: 0 });
            }
        }));

        const handleWheel = useCallback((e: WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.max(0.1, Math.min(5, prev * delta)));
        }, []);

        const handleMouseDown = useCallback((e: React.MouseEvent) => {
            setIsDragging(true);
            setLastMouse({ x: e.clientX, y: e.clientY });
        }, []);

        const handleMouseMove = useCallback((e: React.MouseEvent) => {
            if (!isDragging) return;
            const dx = e.clientX - lastMouse.x;
            const dy = e.clientY - lastMouse.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMouse({ x: e.clientX, y: e.clientY });
        }, [isDragging, lastMouse]);

        const handleMouseUp = useCallback(() => setIsDragging(false), []);

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
            const container = containerRef.current;
            if (!container) return;
            container.addEventListener('wheel', handleWheel, { passive: false });
            return () => container.removeEventListener('wheel', handleWheel);
        }, [handleWheel]);

        useEffect(() => {
            const canvas = canvasRef.current;
            if (!canvas || data.length === 0) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const dpr = window.devicePixelRatio || 1;
            canvas.width = dimensions.width * dpr;
            canvas.height = dimensions.height * dpr;
            canvas.style.width = `${dimensions.width}px`;
            canvas.style.height = `${dimensions.height}px`;
            ctx.scale(dpr, dpr);

            // --- AUTO-SCALING LOGIC ---
            const rootItem: AffinityItem = { id: 'root', label: finalStyles.title, children: data };
            const contentSize = measurePlate(ctx, rootItem, finalStyles, 0);

            // Padding for the viewport
            const viewportPadding = 60;
            const availW = dimensions.width - viewportPadding;
            const availH = dimensions.height - viewportPadding;

            let autoScale = 1;
            if (contentSize.width > availW || contentSize.height > availH) {
                autoScale = Math.min(availW / contentSize.width, availH / contentSize.height);
                // Don't auto-scale UP too much if content is tiny, but scale DOWN if too large.
                autoScale = Math.min(1, autoScale);
            }

            const currentScale = scale * autoScale;

            ctx.fillStyle = finalStyles.background;
            ctx.fillRect(0, 0, dimensions.width, dimensions.height);

            ctx.save();
            // Center the content
            ctx.translate(dimensions.width / 2 + offset.x, dimensions.height / 2 + offset.y);
            ctx.scale(currentScale, currentScale);
            ctx.translate(-dimensions.width / 2, -dimensions.height / 2);

            if (finalStyles.type === 'Label') {
                renderLabelStyle(ctx, data, finalStyles, dimensions);
            } else {
                renderPlateStyle(ctx, data, finalStyles, dimensions);
            }

            ctx.restore();
        }, [data, finalStyles, dimensions, scale, offset]);

        return (
            <div
                ref={containerRef}
                className={className}
                style={{
                    width: '100%', height: '100%', minHeight: '400px',
                    backgroundColor: finalStyles.background, borderRadius: '8px',
                    overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
            </div>
        );
    }
);

AffinityChart.displayName = 'AffinityChart';

/**
 * 🎨 渲染引擎规格定义
 */
const MIN_PLATE_WIDTH = 120;
const MIN_PLATE_HEIGHT = 44;
const PLATE_SIDE_PADDING = 24; // Unified horizontal padding
// Basic specification
const HEADER_HEIGHT = 42;
const SIDE_WIDTH = 42;

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * -----------------------------------------------------------------------------
 * 1. PLATE / CONTAINER RENDERER (底板卡片模式)
 * -----------------------------------------------------------------------------
 */

function calculateContentSize(data: AffinityItem[], styles: Required<AffinityChartStyles>): { width: number; height: number } {
    const dummyCtx = document.createElement('canvas').getContext('2d')!;
    if (styles.type === 'Card') {
        const rootItem: AffinityItem = { id: 'root', label: styles.title, children: data };
        const size = measurePlate(dummyCtx, rootItem, styles, 0);
        return { width: size.width + 200, height: size.height + 200 };
    } else {
        const rootItem: AffinityItem = { id: 'root', label: styles.title, children: data };
        const size = measureTree(dummyCtx, rootItem, styles, 0);
        return { width: size.width + 200, height: size.height + 200 };
    }
}

function measurePlate(ctx: CanvasRenderingContext2D, item: AffinityItem, styles: Required<AffinityChartStyles>, depth: number, widthConstraint: number = 0): { width: number; height: number } {
    const fs = depth === 0 ? styles.titleFontSize : (depth === 1 ? styles.headerFontSize : styles.itemFontSize);
    ctx.font = `bold ${fs}px "Microsoft YaHei", sans-serif`;
    const labelW = ctx.measureText(item.label).width + 40;

    // --- WIDTH CALCULATION ---
    let frameW = widthConstraint;
    if (depth === 0 && frameW === 0) {
        frameW = 1200; // Base width for Root
    }
    const titleW = Math.max(labelW, frameW - 2 * PLATE_SIDE_PADDING);

    // ITEM (Leaf Node)
    if (!item.children || item.children.length === 0) {
        return { width: frameW, height: MIN_PLATE_HEIGHT };
    }

    // --- RECURSIVE LAYOUT ---
    let childWidthConstraint = 0;
    if (depth === 0) {
        // Root -> L1: Horizontal
        const gapTotal = (item.children.length - 1) * styles.itemGap;
        childWidthConstraint = (titleW - gapTotal) / item.children.length;
        childWidthConstraint = Math.max(childWidthConstraint, MIN_PLATE_WIDTH);
    } else {
        // L1+ -> Vertical
        childWidthConstraint = titleW;
    }

    const childSizes = item.children.map(c => measurePlate(ctx, c, styles, depth + 1, childWidthConstraint));

    // HEIGHT CALCULATION
    if (depth === 0) {
        // Root (Horizontal Layout)
        const maxChildH = Math.max(...childSizes.map(s => s.height));
        const actualContentW = childSizes.reduce((s, c) => s + c.width, 0) + (item.children.length - 1) * styles.itemGap;
        const actualFrameW = Math.max(frameW, actualContentW + 2 * PLATE_SIDE_PADDING);

        // Visual Gap = styles.itemGap; Parent Intrusion = 21; Child Intrusion = 21 (if Card)
        const firstChildIsCard = item.children[0].children && item.children[0].children.length > 0;
        const rootPaddingTop = 21 + styles.itemGap + (firstChildIsCard ? 21 : 0);

        return {
            width: actualFrameW,
            height: rootPaddingTop + maxChildH + 40
        };
    } else {
        // L1+ (Vertical Stack)
        let totalContentH = 0;
        item.children.forEach((child, i) => {
            const size = childSizes[i];
            const isCard = child.children && child.children.length > 0;
            if (i === 0) {
                // First child padding: 21 (parent intrusion) + itemGap + 21 (child intrusion if card)
                const padding = 21 + styles.itemGap + (isCard ? 21 : 0);
                totalContentH += padding + size.height;
            } else {
                // Gap logic: visible gap between boundaries
                const gap = styles.itemGap + (isCard ? 21 : 0);
                totalContentH += gap + size.height;
            }
        });

        return {
            width: frameW,
            height: totalContentH + styles.itemGap // Match the gap rhythm at the bottom
        };
    }
}

function drawPlate(ctx: CanvasRenderingContext2D, item: AffinityItem, x: number, y: number, width: number, height: number, styles: Required<AffinityChartStyles>, depth: number) {
    // --- LEAF NODE (OPTION) RENDERING ---
    if (!item.children || item.children.length === 0) {
        ctx.fillStyle = styles.itemColor || '#ffffff';
        ctx.strokeStyle = styles.borderColor;
        ctx.lineWidth = 1;
        roundRect(ctx, x, y, width, height, 4);
        ctx.fill();
        ctx.stroke();

        ctx.font = `normal ${styles.itemFontSize}px "Microsoft YaHei", sans-serif`;
        ctx.fillStyle = styles.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.label, x + width / 2, y + height / 2);
        return;
    }

    // --- GROUP NODE (CARD) RENDERING ---
    const fs = depth === 0 ? styles.titleFontSize : (depth === 1 ? styles.headerFontSize : styles.itemFontSize);
    const textColor = depth === 0 ? styles.titleColor : (depth === 1 ? styles.headerColor : styles.textColor);
    ctx.font = `bold ${fs}px "Microsoft YaHei", sans-serif`;

    // Rule: Title Width = Frame Width - Fixed Side Padding
    const headerW = width - 2 * PLATE_SIDE_PADDING;
    const headerH = HEADER_HEIGHT;
    const headerRect = {
        x: x + (width - headerW) / 2,
        y: y - headerH / 2,
        w: headerW,
        h: headerH
    };

    // 1. Draw Container Border
    const bgColor = depth === 0 ? '#ffffff' : hexToRgba(styles.cardColor, Math.min(0.6, depth * 0.15));
    const borderW = depth === 0 ? 3 : 1.5;

    ctx.strokeStyle = styles.borderColor;
    ctx.lineWidth = borderW;
    ctx.fillStyle = bgColor;
    roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // 2. Clear/Draw Header (Straddle)
    ctx.fillStyle = depth === 0 ? '#ffffff' : styles.cardColor;
    ctx.fillRect(headerRect.x, headerRect.y, headerRect.w, headerRect.h);

    ctx.strokeStyle = styles.borderColor;
    ctx.lineWidth = borderW;
    roundRect(ctx, headerRect.x, headerRect.y, headerRect.w, headerRect.h, 4);
    ctx.stroke();

    // Draw Text
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, headerRect.x + headerRect.w / 2, headerRect.y + headerRect.h / 2);

    // 3. Draw Children
    if (item.children && item.children.length > 0) {
        if (depth === 0) {
            // Root -> L1: Horizontal Row
            const gapTotal = (item.children.length - 1) * styles.itemGap;
            const childSizes = item.children.map(child => {
                const childW = (headerW - gapTotal) / item.children!.length;
                return measurePlate(ctx, child, styles, depth + 1, childW);
            });
            const totalWidthUsed = childSizes.reduce((s, c) => s + c.width, 0) + gapTotal;

            const firstChildIsCard = item.children[0].children && item.children[0].children.length > 0;
            const rootPaddingTop = 21 + styles.itemGap + (firstChildIsCard ? 21 : 0);

            let curX = x + (width - totalWidthUsed) / 2;
            let curY = y + rootPaddingTop;

            item.children.forEach((child, i) => {
                drawPlate(ctx, child, curX, curY, childSizes[i].width, childSizes[i].height, styles, depth + 1);
                curX += childSizes[i].width + styles.itemGap;
            });
        } else {
            // L1+ -> Vertical Stack with Dynamic Gaps
            let curY = y;
            item.children.forEach((child, i) => {
                const isCard = child.children && child.children.length > 0;
                const childW = headerW; // Child Frame = Parent Title
                const measuredSize = measurePlate(ctx, child, styles, depth + 1, childW);
                const centeredX = x + (width - measuredSize.width) / 2;

                if (i === 0) {
                    const firstPadding = 21 + styles.itemGap + (isCard ? 21 : 0);
                    curY += firstPadding;
                } else {
                    const gap = styles.itemGap + (isCard ? 21 : 0);
                    curY += gap;
                }

                drawPlate(ctx, child, centeredX, curY, measuredSize.width, measuredSize.height, styles, depth + 1);
                curY += measuredSize.height;
            });
        }
    }
}

function renderPlateStyle(ctx: CanvasRenderingContext2D, data: AffinityItem[], styles: Required<AffinityChartStyles>, dimensions: { width: number; height: number }) {
    const rootItem: AffinityItem = { id: 'root', label: styles.title, children: data };
    const size = measurePlate(ctx, rootItem, styles, 0);
    const sx = (dimensions.width - size.width) / 2;
    const sy = (dimensions.height - size.height) / 2;
    drawPlate(ctx, rootItem, sx, sy, size.width, size.height, styles, 0);
}

/**
 * -----------------------------------------------------------------------------
 * 2. TREE / LABEL RENDERER (标准直角组织结构图模式)
 * -----------------------------------------------------------------------------
 */

function measureTree(ctx: CanvasRenderingContext2D, item: AffinityItem, styles: Required<AffinityChartStyles>, depth: number): { width: number; height: number } {
    const fs = depth === 0 ? styles.titleFontSize : styles.itemFontSize;
    ctx.font = `bold ${fs}px sans-serif`;
    const tw = ctx.measureText(item.label).width + 36;
    const th = 40;

    if (!item.children || item.children.length === 0) return { width: tw, height: th };

    if (styles.layout === 'Vertical') {
        const childSizes = item.children.map(c => measureTree(ctx, c, styles, depth + 1));
        const totalChildW = childSizes.reduce((sum, s) => sum + s.width, 0) + (childSizes.length - 1) * styles.itemGap;
        const maxChildH = Math.max(...childSizes.map(s => s.height));

        const levelGap = 2 * styles.itemGap; // Calculated twice as requested

        return {
            width: Math.max(tw, totalChildW),
            height: th + levelGap + maxChildH
        };
    }

    const childSizes = item.children.map(c => measureTree(ctx, c, styles, depth + 1));
    const maxChildW = Math.max(...childSizes.map(s => s.width));
    const totalChildH = childSizes.reduce((sum, s) => sum + s.height, 0) + (childSizes.length - 1) * styles.itemGap;

    const levelGap = 2 * styles.itemGap;

    return {
        width: tw + levelGap + maxChildW,
        height: Math.max(th, totalChildH)
    };
}

function drawTree(ctx: CanvasRenderingContext2D, item: AffinityItem, x: number, y: number, styles: Required<AffinityChartStyles>, depth: number) {
    const fs = depth === 0 ? styles.titleFontSize : styles.itemFontSize;
    ctx.font = `bold ${fs}px sans-serif`;
    const tw = ctx.measureText(item.label).width + 36;
    const th = 38;

    const nodeX = x;
    const nodeY = y;

    // 1. 绘制节点底盒
    ctx.fillStyle = depth === 0 ? styles.headerColor : styles.itemColor;
    ctx.strokeStyle = styles.borderColor;
    ctx.lineWidth = depth === 0 ? 2 : 1;
    roundRect(ctx, nodeX, nodeY - th / 2, tw, th, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = depth === 0 ? '#ffffff' : styles.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.label, nodeX + tw / 2, nodeY);

    // 2. 绘制直角连线与子项
    if (item.children && item.children.length > 0) {
        // levelGap will be calculated dynamically based on styles.itemGap below

        if (styles.layout === 'Vertical') {
            const childSizes = item.children.map(c => measureTree(ctx, c, styles, depth + 1));
            const totalChildW = childSizes.reduce((sum, s) => sum + s.width, 0) + (item.children.length - 1) * styles.itemGap;

            let startChildX = nodeX - totalChildW / 2 + tw / 2;
            const levelGap = 2 * styles.itemGap;
            const midY = nodeY + th / 2 + levelGap / 2;
            const childY = nodeY + th / 2 + levelGap;

            // 主干线
            ctx.beginPath();
            ctx.strokeStyle = styles.lineColor;
            ctx.lineWidth = 1.2;
            ctx.moveTo(nodeX + tw / 2, nodeY + th / 2);
            ctx.lineTo(nodeX + tw / 2, midY);
            ctx.stroke();

            // 横向分支线
            if (item.children.length > 1) {
                const firstChildCenter = startChildX + childSizes[0].width / 2;
                const lastChildCenter = startChildX + totalChildW - childSizes[childSizes.length - 1].width / 2;

                ctx.beginPath();
                ctx.moveTo(firstChildCenter, midY);
                ctx.lineTo(lastChildCenter, midY);
                ctx.stroke();
            }

            item.children.forEach((child, i) => {
                const cs = childSizes[i];
                const cx = startChildX;
                const childCenterX = cx + cs.width / 2;

                ctx.beginPath();
                ctx.moveTo(childCenterX, midY);
                ctx.lineTo(childCenterX, childY);
                ctx.stroke();

                drawTree(ctx, child, cx + (cs.width - (ctx.measureText(child.label).width + 36)) / 2, childY + th / 2, styles, depth + 1);

                startChildX += cs.width + styles.itemGap;
            });

        } else {
            // HORIZONTAL (Tree/Label)
            const levelGap = 2 * styles.itemGap;
            const childX = nodeX + tw + levelGap;
            const childSizes = item.children.map(c => measureTree(ctx, c, styles, depth + 1));
            const totalH = childSizes.reduce((sum, s) => sum + s.height, 0) + (item.children.length - 1) * styles.itemGap;

            let startChildY = nodeY - totalH / 2;
            const midX = nodeX + tw + levelGap / 2;

            // 主干线 (垂直线)
            if (item.children.length > 1) {
                ctx.beginPath();
                ctx.strokeStyle = styles.lineColor;
                ctx.lineWidth = 1.2;
                ctx.moveTo(midX, startChildY + childSizes[0].height / 2);
                ctx.lineTo(midX, startChildY + totalH - childSizes[childSizes.length - 1].height / 2);
                ctx.stroke();
            }

            item.children.forEach((child, i) => {
                const cs = childSizes[i];
                const cy = startChildY + cs.height / 2;

                ctx.beginPath();
                ctx.strokeStyle = styles.lineColor;
                // 横向引线 1: 从父节点到中点
                ctx.moveTo(nodeX + tw, nodeY);
                ctx.lineTo(midX, nodeY);
                // 横向引线 2: 从垂直主干到子节点
                ctx.moveTo(midX, cy);
                ctx.lineTo(childX, cy);
                ctx.stroke();

                drawTree(ctx, child, childX, cy, styles, depth + 1);
                startChildY += cs.height + styles.itemGap;
            });
        }
    }
}

function renderLabelStyle(ctx: CanvasRenderingContext2D, data: AffinityItem[], styles: Required<AffinityChartStyles>, dimensions: { width: number; height: number }) {
    const rootItem: AffinityItem = { id: 'root', label: styles.title, children: data };
    const size = measureTree(ctx, rootItem, styles, 0);
    const sx = (dimensions.width - size.width) / 2;

    if (styles.layout === 'Vertical') {
        const fs = styles.titleFontSize;
        ctx.font = `bold ${fs}px sans-serif`;
        const rootTw = ctx.measureText(rootItem.label).width + 36;
        const rootTh = 40;

        const sy = (dimensions.height - size.height) / 2 + rootTh / 2;
        const rootX = sx + (size.width - rootTw) / 2;

        drawTree(ctx, rootItem, rootX, sy, styles, 0);
    } else {
        const sy = dimensions.height / 2;
        drawTree(ctx, rootItem, sx, sy, styles, 0);
    }
}

/**
 * 🎨 通用绘图助手
 */
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
}

export default AffinityChart;
