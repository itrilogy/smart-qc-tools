/**
 * 亲和图 (Affinity Diagram / KJ法) 类型定义
 * 支持两种渲染类型：Label（树状层级）/ Card（卡片分组）
 */

export interface AffinityItem {
    id: string;
    label: string;
    parentId?: string;
    children?: AffinityItem[];
    color?: string;  // 单项颜色覆盖
}

export type AffinityChartType = 'Label' | 'Card';
export type AffinityLayoutType = 'Vertical' | 'Horizontal';

export interface AffinityChartStyles {
    title?: string;
    type?: AffinityChartType;
    layout?: AffinityLayoutType;
    // 颜色配置
    titleColor?: string;
    headerColor?: string;
    cardColor?: string;
    itemColor?: string;
    lineColor?: string;
    textColor?: string;
    borderColor?: string;
    background?: string;
    // 字号配置
    titleFontSize?: number;
    headerFontSize?: number;
    itemFontSize?: number;
    itemGap?: number; // 视觉间距
}

export interface AffinityChartRef {
    exportPNG: (transparent?: boolean) => void;
    exportPDF: () => void;
    resetView: () => void;
}

export interface AffinityChartProps {
    data: AffinityItem[];
    styles?: AffinityChartStyles;
    className?: string;
}

// 默认样式配置
export const DEFAULT_AFFINITY_STYLES: Required<AffinityChartStyles> = {
    title: '亲和图 (Affinity Diagram)',
    type: 'Card',
    layout: 'Horizontal',
    titleColor: '#1e293b',
    headerColor: '#f59e0b',
    cardColor: '#ffffff',
    itemColor: '#e2e8f0',
    lineColor: '#64748b',
    textColor: '#1e293b',
    borderColor: '#cbd5e1',
    background: '#f8fafc',
    titleFontSize: 20,
    headerFontSize: 16,
    itemFontSize: 14,
    itemGap: 12
};

// 默认示例数据 (L1 层级应包含多个分组，L0 为图表标题)
export const DEFAULT_AFFINITY_DATA: AffinityItem[] = [
    {
        id: 'G1',
        label: '市场动态',
        children: [
            { id: 'G1-1', label: '竞争对手降价' },
            { id: 'G1-2', label: '新产品进入市场' },
            { id: 'G1-3', label: '消费者需求多元化' }
        ]
    },
    {
        id: 'G2',
        label: '内部优化',
        children: [
            { id: 'G2-1', label: '生产流程冗长' },
            { id: 'G2-2', label: '物流配送延迟' },
            { id: 'G2-3', label: '库存积压严重' }
        ]
    },
    {
        id: 'G3',
        label: '技术挑战',
        children: [
            { id: 'G3-1', label: '旧系统升级困难' },
            { id: 'G3-2', label: '人才储备不足' }
        ]
    }
];

// 经典压力测试数据 (包含深度嵌套)
export const CLASSIC_AFFINITY_TEST_DATA: AffinityItem[] = [
    {
        id: 'T1',
        label: '核心业务',
        children: [
            {
                id: 'T1-1',
                label: '产品开发',
                children: [
                    {
                        id: 'T1-1-1',
                        label: '前端技术栈',
                        children: [
                            { id: 'T1-1-1-1', label: 'React 19 更新' },
                            { id: 'T1-1-1-2', label: 'Tailwind 优化' }
                        ]
                    },
                    { id: 'T1-1-2', label: '后端架构设计' }
                ]
            },
            {
                id: 'T1-2',
                label: '质量保证',
                children: [
                    { id: 'T1-2-1', label: '自动化测试平台' },
                    { id: 'T1-2-2', label: '性能压力测试' }
                ]
            }
        ]
    },
    {
        id: 'T2',
        label: '市场营销',
        children: [
            {
                id: 'T2-1',
                label: '线上渠道',
                children: [
                    { id: 'T2-1-1', label: '社交媒体投放' },
                    { id: 'T2-1-2', label: 'SEO 关键词优化' }
                ]
            },
            { id: 'T2-2', label: '线下活动预热' }
        ]
    }
];

// 初始 DSL 示例
export const INITIAL_AFFINITY_DSL = `Title: 售后服务质量改进分析
Type: Card
Layout: Horizontal
Color[Title]: #1e293b
Color[Header]: #3b82f6
Color[Card]: #ffffff
Color[Item]: #eff6ff
Color[Border]: #bfdbfe
Font[Title]: 22
Font[Header]: 16
Font[Item]: 13

Item: G1, 响应时效性
Item: G1-1, 投诉处理平均耗时过长, G1
Item: G1-2, 客服接听率波动剧烈, G1
Item: G1-3, 备件物流周期不可控, G1

Item: G2, 内容专业度
Item: G2-1, 技术支持文档更新迟缓, G2
Item: G2-2, 远程指导准确率待提升, G2
Item: G2-3, 话术缺乏人性化关怀, G2

Item: G3, 系统支撑力
Item: G3-1, 工单系统移动端适配差, G3
Item: G3-2, CRM 数据同步存在孤岛, G3`;


/**
 * DSL 解析器：将 DSL 文本转换为 AffinityItem 数组和样式配置
 */
export function parseAffinityDSL(dsl: string): { data: AffinityItem[]; styles: AffinityChartStyles } {
    const lines = dsl.split('\n').map(line => line.trimEnd());
    const styles: AffinityChartStyles = { ...DEFAULT_AFFINITY_STYLES };
    const items: AffinityItem[] = [];

    // 用于跟踪层级关系
    const stack: { level: number; item: AffinityItem }[] = [];
    let itemCounter = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('//')) continue;

        // 解析标题
        if (trimmed.startsWith('Title:')) {
            styles.title = trimmed.substring(6).trim();
            continue;
        }

        // 解析类型
        if (trimmed.startsWith('Type:')) {
            const type = trimmed.substring(5).trim();
            if (type === 'Label' || type === 'Card') {
                styles.type = type;
            }
            continue;
        }

        // 解析布局
        if (trimmed.startsWith('Layout:')) {
            const layout = trimmed.substring(7).trim();
            if (layout === 'Vertical' || layout === 'Horizontal') {
                styles.layout = layout;
            }
            continue;
        }

        // 解析颜色配置
        const colorMatch = trimmed.match(/^Color\[(\w+)\]:\s*(#[0-9A-Fa-f]{6})/);
        if (colorMatch) {
            const [, key, value] = colorMatch;
            switch (key) {
                case 'Title': styles.titleColor = value; break;
                case 'Header': styles.headerColor = value; break;
                case 'Card': styles.cardColor = value; break;
                case 'Item': styles.itemColor = value; break;
                case 'Line': styles.lineColor = value; break;
                case 'Text': styles.textColor = value; break;
                case 'Border': styles.borderColor = value; break;
                case 'Background': styles.background = value; break;
            }
            continue;
        }

        // 解析字号配置
        const fontMatch = trimmed.match(/^Font\[(\w+)\]:\s*(\d+)/);
        if (fontMatch) {
            const [, key, value] = fontMatch;
            const size = parseInt(value, 10);
            switch (key) {
                case 'Title': styles.titleFontSize = size; break;
                case 'Header': styles.headerFontSize = size; break;
                case 'Item': styles.itemFontSize = size; break;
            }
            continue;
        }

        // 解析 Item 语法: Item: {ID}, {内容}, {父ID?}
        const itemMatch = trimmed.match(/^Item:\s*([^,]+),\s*([^,]+)(?:,\s*(.+))?$/);
        if (itemMatch) {
            const [, id, label, parentId] = itemMatch;
            const item: AffinityItem = {
                id: id.trim(),
                label: label.trim(),
                parentId: parentId?.trim()
            };
            items.push(item);
            continue;
        }

        // 解析 Markdown 风格层级语法 (# ## ### ####)
        const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
        if (headingMatch) {
            const [, hashes, label] = headingMatch;
            const level = hashes.length;
            itemCounter++;

            const newItem: AffinityItem = {
                id: `item_${itemCounter}`,
                label: label.trim(),
                children: []
            };

            // 找到合适的父节点
            while (stack.length > 0 && stack[stack.length - 1].level >= level) {
                stack.pop();
            }

            if (stack.length === 0) {
                // 顶级节点
                items.push(newItem);
            } else {
                // 作为父节点的子项
                const parent = stack[stack.length - 1].item;
                if (!parent.children) parent.children = [];
                parent.children.push(newItem);
            }

            stack.push({ level, item: newItem });
            continue;
        }
    }

    // 如果使用 Item 语法，需要构建树结构
    if (items.length > 0 && items.some(i => i.parentId)) {
        return { data: buildTree(items), styles };
    }

    return { data: items, styles };
}

/**
 * 将扁平 Item 列表构建为树结构
 */
function buildTree(items: AffinityItem[]): AffinityItem[] {
    const itemMap = new Map<string, AffinityItem>();
    const roots: AffinityItem[] = [];

    // 第一遍：创建所有节点的映射
    for (const item of items) {
        itemMap.set(item.id, { ...item, children: [] });
    }

    // 第二遍：构建父子关系
    for (const item of items) {
        const node = itemMap.get(item.id)!;
        if (item.parentId && itemMap.has(item.parentId)) {
            const parent = itemMap.get(item.parentId)!;
            if (!parent.children) parent.children = [];
            parent.children.push(node);
        } else {
            roots.push(node);
        }
    }

    return roots;
}
