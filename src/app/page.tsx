import Link from "next/link";
import { BarChart3, Network, Activity, TrendingUp, ScatterChart, ArrowRight, Boxes } from "lucide-react";

const TOOLS = [
  {
    id: 'fishbone',
    name: '鱼骨图',
    enName: 'Fishbone Diagram',
    desc: '用于分析问题与其潜在原因之间的关系，支持思维导图式交互。',
    icon: Network,
    href: '/fishbone',
    color: 'bg-blue-500'
  },
  {
    id: 'pareto',
    name: '排列图',
    enName: 'Pareto Chart',
    desc: '自动计算累计频率，识别造成这一结果的主要原因（二八法则）。',
    icon: BarChart3,
    href: '/pareto',
    color: 'bg-emerald-500'
  },
  {
    id: 'histogram',
    name: '直方图',
    enName: 'Histogram',
    desc: '显示数据的分布情况，判断工序是否处于稳定状态。',
    icon: Activity,
    href: '/histogram',
    color: 'bg-indigo-500'
  },
  {
    id: 'scatter',
    name: '散点图',
    enName: 'Scatter Plot',
    desc: '分析两个变量之间的相关性，支持多维度气泡展示与趋势回归。',
    icon: ScatterChart,
    href: '/scatter',
    color: 'bg-amber-500'
  },
  {
    id: 'affinity',
    name: '亲和图',
    enName: 'Affinity Diagram',
    desc: '将大量信息进行分组归类的 KJ 法工具，支持树状层级与卡片分组两种模式。',
    icon: Boxes,
    href: '/affinity',
    color: 'bg-orange-500'
  }
];

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 overflow-y-auto">
      <div className="max-w-4xl w-full flex flex-col items-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Smart QC Tools</h1>
        <p className="text-lg text-slate-500 mb-12 text-center max-w-2xl">
          专为 QC 小组活动设计的智能化图表生成工具。<br />
          无需复杂的 Excel 操作，选择工具，填入数据，即可生成专业图表。
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {TOOLS.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className="group bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-5 hover:shadow-lg hover:border-blue-300 transition-all duration-300 relative overflow-hidden"
            >
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 text-white shadow-sm ${tool.color}`}>
                <tool.icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{tool.name}</h3>
                <p className="text-xs font-semibold text-slate-400 mb-2">{tool.enName}</p>
                <p className="text-sm text-slate-500 leading-relaxed">{tool.desc}</p>
              </div>

              <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-blue-600">
                <ArrowRight size={20} />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-16 text-slate-400 text-sm">
          © 2026 Smart QC Tools. All rights reserved.
        </div>
      </div>
    </div>
  );
}
