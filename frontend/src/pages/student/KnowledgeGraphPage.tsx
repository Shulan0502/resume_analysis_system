import { useEffect, useRef, useState } from 'react';
import {
  Input,
  Tag,
  Spin,
  Empty,
  Statistic,
  App as AntdApp,
} from 'antd';
import { SearchOutlined, ApartmentOutlined } from '@ant-design/icons';
import { Graph as G6Graph } from '@antv/g6';
import {
  getSkillAnalysis,
  getJobAnalysis,
  getGraphData,
  getGraphStats,
  type GraphNode,
  type SkillAnalysis,
  type JobAnalysis,
  type GraphStats,
} from '../../services/graph_api';

interface SkillItem {
  skill: string;
  importance: 'required' | 'preferred';
  category: string | null;
}

export default function KnowledgeGraphPage() {
  const { message } = AntdApp.useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<any>(null);

  const [stats, setStats] = useState<GraphStats | null>(null);

  // 左侧 Job 列表
  const [jobList, setJobList] = useState<GraphNode[]>([]);
  const [jobFilter, setJobFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // 选中 Job 的分析数据
  const [jobAnalysis, setJobAnalysis] = useState<JobAnalysis | null>(null);
  const [jobLoading, setJobLoading] = useState(false);

  // 画布点击的 Skill 详情
  const [skillDetail, setSkillDetail] = useState<SkillAnalysis | null>(null);
  const [skillDetailLoading, setSkillDetailLoading] = useState(false);

  // 加载图谱统计 + Job 列表
  useEffect(() => {
    (async () => {
      try {
        const [statsData, graphData] = await Promise.all([
          getGraphStats(),
          getGraphData({ limit: 500 }),
        ]);
        setStats(statsData);
        setJobList(graphData.nodes.filter((n) => n.type === 'Job'));
      } catch (e: any) {
        message.error('初始化失败：' + (e?.message || '未知错误'));
      }
    })();
  }, []);

  // 选中 Job 时：拉分析 + 画 G6
  useEffect(() => {
    if (!selectedJob) return;
    setJobLoading(true);
    setSkillDetail(null);
    getJobAnalysis(selectedJob)
      .then((data) => {
        setJobAnalysis(data);
        renderSubgraph(data);
      })
      .catch((e) => message.error('岗位分析失败：' + e.message))
      .finally(() => setJobLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob]);

  // 销毁 G6
  useEffect(() => {
    return () => {
      if (graphRef.current) {
        graphRef.current.destroy();
        graphRef.current = null;
      }
    };
  }, []);

  // 渲染 1-hop 子图：Job 居中，Skill 环状分布
  const renderSubgraph = (data: JobAnalysis) => {
    if (!containerRef.current) return;
    if (graphRef.current) {
      graphRef.current.destroy();
      graphRef.current = null;
    }

    const skills = data.skills as SkillItem[];
    const N = skills.length;
    const RADIUS = Math.max(180, Math.min(280, 60 + N * 18)); // 节点越多半径越大
    // 画布尺寸（默认 800x600，容器渲染后会被 fitView 修正）
    const canvasW = containerRef.current.clientWidth || 800;
    const canvasH = containerRef.current.clientHeight || 600;
    const CENTER = { x: canvasW / 2, y: canvasH / 2 };

    // Job 节点（居中）
    const jobNode = {
      id: `job:${data.job}`,
      data: { label: data.job, type: 'Job' },
      style: {
        x: CENTER.x,
        y: CENTER.y,
      },
    };

    // Skill 节点（环状）
    const skillNodes = skills.map((s, i) => {
      const angle = (2 * Math.PI * i) / N - Math.PI / 2; // 从正上方开始
      return {
        id: `skill:${s.skill}`,
        data: {
          label: s.skill,
          type: 'Skill',
          importance: s.importance,
          category: s.category,
        },
        style: {
          x: CENTER.x + RADIUS * Math.cos(angle),
          y: CENTER.y + RADIUS * Math.sin(angle),
        },
      };
    });

    // 边
    const edges = skills.map((s) => ({
      source: `job:${data.job}`,
      target: `skill:${s.skill}`,
      data: { importance: s.importance },
    }));

    const graph = new G6Graph({
      container: containerRef.current,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight || 700,
      autoFit: 'view',
      node: {
        type: 'circle',
        style: (d: any) => {
          if (d.data.type === 'Job') {
            return {
              size: 60,
              fill: '#5B8FF9',
              stroke: '#1E5BC6',
              lineWidth: 3,
              labelText: d.data.label,
              labelFill: '#fff',
              labelFontWeight: 600,
              labelFontSize: 14,
              labelPlacement: 'center',
            };
          }
          // Skill 节点
          return {
            size: 36,
            fill: d.data.importance === 'required' ? '#FF7875' : '#FFD666',
            stroke: d.data.importance === 'required' ? '#D4380D' : '#D4880D',
            lineWidth: 2,
            labelText: d.data.label,
            labelFill: '#333',
            labelFontSize: 12,
            labelPlacement: 'bottom',
            labelBackground: true,
            labelBackgroundFill: '#fff',
            labelBackgroundRadius: 4,
            labelPadding: [2, 4],
          };
        },
      },
      edge: {
        type: 'line',
        style: (d: any) => ({
          stroke: d.data.importance === 'required' ? '#F5222D' : '#FAAD14',
          lineWidth: d.data.importance === 'required' ? 2 : 1.5,
          opacity: 0.7,
          endArrow: true,
          endArrowSize: 8,
        }),
      },
      layout: {
        type: 'none', // 手动指定坐标，不用布局
      },
      behaviors: ['drag-canvas', 'zoom-canvas'],
    });

    graph.setData({ nodes: [jobNode, ...skillNodes], edges });
    graph.render();

    // 点击 Skill 节点 → 右侧详情
    graph.on('node:click', (evt: any) => {
      const id = (evt.target?.id ?? evt.targetId) as string | undefined;
      if (!id || !id.startsWith('skill:')) return;
      const skillName = id.slice('skill:'.length);
      setSkillDetailLoading(true);
      setSkillDetail(null);
      getSkillAnalysis(skillName)
        .then(setSkillDetail)
        .catch((e) => message.error('技能详情加载失败：' + e.message))
        .finally(() => setSkillDetailLoading(false));
    });

    graphRef.current = graph;
  };

  // 列表过滤
  const filteredJobs = jobList.filter((j) =>
    jobFilter ? j.label.toLowerCase().includes(jobFilter.toLowerCase()) : true
  );

  // 选中 Job 的 required/preferred 计数
  const requiredCount = jobAnalysis?.skills.filter((s) => s.importance === 'required').length ?? 0;
  const preferredCount = jobAnalysis?.skills.filter((s) => s.importance === 'preferred').length ?? 0;

  return (
    <div className="flex gap-4 animate-fade-in" style={{ height: 'calc(100vh - 120px)' }}>
      {/* ========== 左侧：Job 列表 ========== */}
      <div className="w-64 flex-shrink-0 flex flex-col bg-white rounded-lg shadow-sm p-3 animate-slide-in-left">
        <div className="mb-3">
          <h3 className="text-base font-semibold mb-2">岗位列表</h3>
          <Input
            placeholder="筛选岗位"
            prefix={<SearchOutlined />}
            value={jobFilter}
            onChange={(e) => setJobFilter(e.target.value)}
            allowClear
          />
          <div className="text-xs text-gray-500 mt-2">共 {jobList.length} 个岗位</div>
        </div>
        <div className="flex-1 overflow-y-auto -mx-1 px-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
          {filteredJobs.length === 0 ? (
            <Empty description="无匹配岗位" />
          ) : (
            <ul className="space-y-1">
              {filteredJobs.map((j) => (
                <li
                  key={j.id}
                  onClick={() => setSelectedJob(j.label)}
                  className={`px-3 py-2 rounded cursor-pointer text-sm transition-colors ${
                    selectedJob === j.label
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-blue-50 text-gray-700'
                  }`}
                >
                  {j.label}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ========== 中央：图谱画布 ========== */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm animate-fade-in-up delay-100">
        {/* 顶部统计条 */}
        <div className="flex items-center gap-6 px-4 py-3 border-b">
          <Statistic
            title="岗位节点"
            value={stats?.nodes.jobs ?? '-'}
            prefix={<ApartmentOutlined />}
          />
          <Statistic title="技能节点" value={stats?.nodes.skills ?? '-'} />
          <Statistic title="需求关系" value={stats?.relationships.requires ?? '-'} />
          <div className="ml-auto text-sm text-gray-500">
            {selectedJob ? (
              <span>
                当前查看：<b className="text-gray-800">{selectedJob}</b>
                {jobAnalysis && (
                  <span className="ml-2">
                    <Tag color="red">{requiredCount} 核心</Tag>
                    <Tag color="orange">{preferredCount} 加分</Tag>
                  </span>
                )}
              </span>
            ) : (
              <span>← 从左侧选择一个岗位</span>
            )}
          </div>
        </div>

        {/* 画布 */}
        <div className="flex-1 relative">
          <Spin spinning={jobLoading} wrapperClassName="h-full">
            <div ref={containerRef} className="w-full h-full" />
            {!selectedJob && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <Empty description="请从左侧选择岗位，查看其关联技能" />
              </div>
            )}
          </Spin>
        </div>
      </div>

      {/* ========== 右侧：详情 ========== */}
      <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-sm p-4 overflow-y-auto animate-slide-in-right">
        {!skillDetail && jobAnalysis && (
          <>
            <h3 className="text-base font-semibold mb-1">{jobAnalysis.job}</h3>
            <p className="text-xs text-gray-500 mb-3">
              共 {jobAnalysis.skill_count} 项技能
            </p>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">
                <Tag color="red">核心 required</Tag>
              </div>
              <div className="flex flex-wrap gap-1">
                {jobAnalysis.skills
                  .filter((s) => s.importance === 'required')
                  .map((s) => (
                    <Tag key={s.skill} color="red">{s.skill}</Tag>
                  ))}
                {requiredCount === 0 && <span className="text-xs text-gray-400">无</span>}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">
                <Tag color="orange">加分 preferred</Tag>
              </div>
              <div className="flex flex-wrap gap-1">
                {jobAnalysis.skills
                  .filter((s) => s.importance === 'preferred')
                  .map((s) => (
                    <Tag key={s.skill} color="orange">{s.skill}</Tag>
                  ))}
                {preferredCount === 0 && <span className="text-xs text-gray-400">无</span>}
              </div>
            </div>
          </>
        )}

        {skillDetail && (
          <>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold">{skillDetail.skill}</h3>
              <a
                className="text-xs text-blue-500 cursor-pointer"
                onClick={() => setSkillDetail(null)}
              >
                返回岗位
              </a>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              被 <b>{skillDetail.job_count}</b> 个岗位需要
            </p>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">需要的岗位：</div>
              <div className="flex flex-wrap gap-1">
                {skillDetail.jobs.slice(0, 12).map((j) => (
                  <Tag
                    key={j}
                    color="blue"
                    className="cursor-pointer"
                    onClick={() => setSelectedJob(j)}
                  >
                    {j}
                  </Tag>
                ))}
                {skillDetail.jobs.length > 12 && (
                  <span className="text-xs text-gray-400">+{skillDetail.jobs.length - 12}</span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm font-medium mb-2">共现技能：</div>
              <div className="flex flex-wrap gap-1">
                {skillDetail.related_skills.length === 0 && (
                  <span className="text-xs text-gray-400">无</span>
                )}
                {skillDetail.related_skills.map((r) => (
                  <Tag color="purple" key={r.skill}>
                    {r.skill} ×{r.co_occurrence}
                  </Tag>
                ))}
              </div>
            </div>

            {skillDetailLoading && (
              <div className="text-xs text-gray-400">加载中…</div>
            )}
          </>
        )}

        {!skillDetail && !jobAnalysis && !jobLoading && (
          <Empty description="选择岗位后查看详情" />
        )}
        {jobLoading && !jobAnalysis && (
          <div className="text-center text-gray-400 py-8">加载中…</div>
        )}
      </div>
    </div>
  );
}
