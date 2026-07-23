import { useEffect, useMemo, useState } from 'react'
import { App, Button, Drawer, Empty, Input, Pagination, Select, Skeleton, Spin, Tag, Tooltip } from 'antd'
import {
  ArrowUpOutlined,
  BookOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  CodeOutlined,
  FileTextOutlined,
  FireOutlined,
  HeartFilled,
  HeartOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  StarFilled,
  TrophyOutlined,
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import { addFavorite, getFavorites, getLearningResources, getLearningSeries, getLearningSeriesDetail, getLearningSeriesDocument, getResourceStats, getUserRecommendations, removeFavorite } from '@/services/api'
import './Resources.css'

type Resource = {
  id: number | string
  title: string
  description: string
  resourceType: string
  category: string
  difficultyLevel: string
  url: string
  duration?: number
  rating?: number
  viewCount?: number
  tags?: string[]
  author?: string
  isFree?: boolean
  recommendationReason?: string
  recommendationScore?: number
  seriesSlug?: string
  documentCount?: number
}

type SeriesSummary = { slug: string; title: string; provider: string; category: string; description: string; documentCount: number }
type SeriesDocument = { id: number; title: string; path: string; sortOrder: number }
type SeriesDetail = SeriesSummary & { repositoryUrl: string; sourceSiteUrl: string; documents: SeriesDocument[] }

const typeLabels: Record<string, string> = { course: '课程', video: '视频', article: '文章', practice: '练习' }
const difficultyLabels: Record<string, string> = { beginner: '入门', intermediate: '进阶', advanced: '高级' }

const iconFor = (type: string) => {
  if (type === 'video') return <PlayCircleOutlined />
  if (type === 'article') return <FileTextOutlined />
  if (type === 'practice') return <TrophyOutlined />
  return <BookOutlined />
}

const prepareMarkdown = (content: string) => content
  .replace(/^:::(?:tip|info|warning|danger)\s*(.*)$/gm, (_match, title) => `> **${title || '提示'}**`)
  .replace(/^:::$/gm, '')
  .replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|CALLOUT)\]\s*$/gm, (_match, type) => {
    const labels: Record<string, string> = { NOTE: '说明', TIP: '提示', IMPORTANT: '重要', WARNING: '注意', CAUTION: '警告', CALLOUT: '延伸学习' }
    return `> **${labels[type] || '提示'}**`
  })

const markdownSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'details', 'summary', 'kbd', 'video', 'source'],
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'id'],
    img: [...(defaultSchema.attributes?.img || []), 'loading', 'width', 'height'],
    video: ['src', 'poster', 'controls', 'width', 'height', 'preload'],
    source: ['src', 'type'],
  },
}

const Resources = () => {
  const { message } = App.useApp()
  const [resources, setResources] = useState<Resource[]>([])
  const [recommended, setRecommended] = useState<Resource[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'discover' | 'recommended' | 'saved'>('discover')
  const [keyword, setKeyword] = useState('')
  const [category, setCategory] = useState<string | undefined>()
  const [resourceType, setResourceType] = useState<string | undefined>()
  const [difficulty, setDifficulty] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState({ totalResources: 0, freeCount: 0, avgRating: 0 })
  const [series, setSeries] = useState<SeriesSummary[]>([])
  const [seriesDetail, setSeriesDetail] = useState<SeriesDetail | null>(null)
  const [activeDocument, setActiveDocument] = useState<SeriesDocument | null>(null)
  const [documentContent, setDocumentContent] = useState('')
  const [documentKeyword, setDocumentKeyword] = useState('')
  const [seriesLoading, setSeriesLoading] = useState(false)
  const [documentLoading, setDocumentLoading] = useState(false)
  const seriesResources = useMemo<Resource[]>(() => series.map((item) => ({
    id: `series:${item.slug}`,
    title: item.title,
    description: item.description,
    resourceType: 'course',
    category: item.category,
    difficultyLevel: 'beginner',
    url: '',
    author: item.provider,
    isFree: true,
    rating: 4.9,
    tags: ['中文课程', item.category],
    seriesSlug: item.slug,
    documentCount: item.documentCount,
  })), [series])

  const documentGroups = useMemo(() => {
    const groups = new Map<string, SeriesDocument[]>()
    const query = documentKeyword.trim().toLowerCase()
    for (const document of seriesDetail?.documents || []) {
      if (query && !`${document.title} ${document.path}`.toLowerCase().includes(query)) continue
      const parts = document.path.split('/')
      const group = parts.length > 1 ? parts[0].replace(/[-_]/g, ' ') : '开始学习'
      groups.set(group, [...(groups.get(group) || []), document])
    }
    return [...groups.entries()]
  }, [seriesDetail, documentKeyword])

  const resolveDocumentPath = (target: string) => {
    if (!seriesDetail || !activeDocument || /^(?:[a-z]+:|\/\/|#|\/)/i.test(target)) return target
    const base = `https://reader.local/${seriesDetail.slug}/${activeDocument.path}`
    const pathname = new URL(target, base).pathname
    const prefix = `/${seriesDetail.slug}/`
    return decodeURIComponent(pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.slice(1))
  }

  const resolveAssetUrl = (src?: string) => {
    if (!src || /^(?:data:|blob:|https?:|\/\/|\/)/i.test(src) || !seriesDetail) return src
    const path = resolveDocumentPath(src)
    return `/api/resource-series/${encodeURIComponent(seriesDetail.slug)}/assets/${path.split('/').map(encodeURIComponent).join('/')}`
  }

  const handleDocumentLink = (href?: string) => {
    if (!href || href.startsWith('#') || /^(?:https?:|mailto:|tel:|\/\/)/i.test(href) || !seriesDetail) return false
    let path = href.split('#')[0]
    const internalPrefixes: Record<string, RegExp> = {
      'mdn-web-zh': /^\/zh-cn\/docs\/learn_web_development\/?/i,
      'react-zh-guide': /^\/learn\/?/i,
      'vue-zh-guide': /^\/guide\/?/i,
    }
    const prefix = internalPrefixes[seriesDetail.slug]
    path = prefix?.test(path) ? path.replace(prefix, '') : resolveDocumentPath(path)
    path = decodeURIComponent(path).replace(/^\//, '').replace(/\/$/, '/index.md')
    const candidates = [path, `${path}.md`, `${path}/index.md`, path.replace(/\.html?$/, '.md')].map((item) => item.toLowerCase())
    const document = seriesDetail.documents.find((item) => candidates.includes(item.path.toLowerCase()))
    if (!document) return false
    openDocument(seriesDetail.slug, document)
    return true
  }

  const loadResources = async () => {
    setLoading(true)
    try {
      const [resourceResult, recommendationResult, favoriteResult, statsResult, seriesResult] = await Promise.all([
        getLearningResources(1, 100), getUserRecommendations(1, 1, 6), getFavorites(1, 100), getResourceStats(1), getLearningSeries(),
      ])
      const allResources = resourceResult?.data?.resources ?? []
      setResources(allResources)
      setRecommended(recommendationResult?.data?.resources ?? [])
      setFavorites(new Set((favoriteResult?.data?.resources ?? []).map((item: Resource) => String(item.id))))
      setStats({
        totalResources: statsResult?.totalResources ?? allResources.length,
        freeCount: statsResult?.freeCount ?? 0,
        avgRating: statsResult?.avgRating ?? 0,
      })
      setSeries(seriesResult?.data ?? [])
    } catch {
      message.error('学习资源暂时无法加载，请检查后端服务和数据库连接')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadResources() }, [])
  useEffect(() => { setPage(1) }, [activeView, keyword, category, resourceType, difficulty])

  const discoveryResources = [...seriesResources, ...resources]
  const source = activeView === 'recommended' ? recommended : activeView === 'saved'
    ? resources.filter((item) => favorites.has(String(item.id))) : discoveryResources
  const categories = useMemo(() => [...new Set([...seriesResources, ...resources].map((item) => item.category).filter(Boolean))], [resources, seriesResources])
  const filtered = source.filter((item) => {
    const searchable = `${item.title} ${item.description} ${(item.tags || []).join(' ')}`.toLowerCase()
    return (!keyword || searchable.includes(keyword.toLowerCase()))
      && (!category || item.category === category)
      && (!resourceType || item.resourceType === resourceType)
      && (!difficulty || item.difficultyLevel === difficulty)
  })
  const displayed = filtered.slice((page - 1) * 9, page * 9)

  const toggleFavorite = async (resource: Resource) => {
    const id = String(resource.id)
    const alreadySaved = favorites.has(id)
    try {
      if (alreadySaved) await removeFavorite(1, Number(resource.id))
      else await addFavorite(1, Number(resource.id))
      setFavorites((current) => {
        const next = new Set(current)
        alreadySaved ? next.delete(id) : next.add(id)
        return next
      })
    } catch {
      message.error('收藏状态更新失败')
    }
  }

  const openSeries = async (item: SeriesSummary) => {
    setSeriesLoading(true)
    setSeriesDetail(null)
    setActiveDocument(null)
    setDocumentContent('')
    setDocumentKeyword('')
    try {
      const result = await getLearningSeriesDetail(item.slug)
      const detail = result?.data as SeriesDetail
      setSeriesDetail(detail)
      if (detail?.documents?.[0]) await openDocument(detail.slug, detail.documents[0])
    } catch {
      message.error('系列目录加载失败')
    } finally {
      setSeriesLoading(false)
    }
  }

  const openDocument = async (slug: string, document: SeriesDocument) => {
    setActiveDocument(document)
    setDocumentLoading(true)
    try {
      const result = await getLearningSeriesDocument(slug, document.id)
      setDocumentContent(result?.data?.content ?? '')
    } catch {
      setDocumentContent('')
      message.error('文档加载失败，请稍后重试')
    } finally {
      setDocumentLoading(false)
    }
  }

  return <main className="resources-page">
    <section className="resources-hero">
      <div className="hero-copy">
        <span className="eyebrow"><FireOutlined /> LEARNING STUDIO</span>
        <h1>让每一次学习<br /><em>直达下一份机会</em></h1>
        <p>按岗位能力和成长阶段，筛出现在最值得投入的学习资源。</p>
      </div>
      <div className="hero-orbit" aria-hidden="true">
        <div className="orbit-core"><CodeOutlined /><span>成长<br />计划</span></div>
        <span className="orbit-dot dot-a" /><span className="orbit-dot dot-b" /><span className="orbit-dot dot-c" />
      </div>
    </section>

    <section className="resource-metrics" aria-label="资源统计">
      <div><span>已收录资源</span><strong>{stats.totalResources + series.length}<small> 个</small></strong></div>
      <div><span>免费可学</span><strong>{stats.freeCount + series.length}<small> 个</small></strong></div>
      <div><span>资源平均评分</span><strong>{stats.avgRating || '--'}<small>{stats.avgRating ? ' / 5' : ''}</small></strong></div>
      <div className="metric-accent"><CheckCircleFilled /><span>学习推荐根据<br />能力画像持续更新</span></div>
    </section>

    <section className="resource-workspace">
      <div className="view-tabs" role="tablist">
        {([['discover', '发现资源', <SearchOutlined />], ['recommended', '为你推荐', <StarFilled />], ['saved', '我的收藏', <HeartOutlined />]] as const).map(([key, label, icon]) =>
          <button key={key} className={activeView === key ? 'active' : ''} onClick={() => setActiveView(key)}>{icon}{label}{key === 'saved' && favorites.size > 0 && <sup>{favorites.size}</sup>}</button>)}
      </div>
      <div className="resource-controls">
        <Input className="resource-search" value={keyword} onChange={(event) => setKeyword(event.target.value)} prefix={<SearchOutlined />} placeholder="搜索技能、课程或主题" allowClear />
        <Select value={category} onChange={setCategory} placeholder="全部方向" allowClear options={categories.map((item) => ({ value: item, label: item }))} />
        <Select value={resourceType} onChange={setResourceType} placeholder="全部类型" allowClear options={Object.entries(typeLabels).map(([value, label]) => ({ value, label }))} />
        <Select value={difficulty} onChange={setDifficulty} placeholder="所有难度" allowClear options={Object.entries(difficultyLabels).map(([value, label]) => ({ value, label }))} />
      </div>
      <div className="result-bar"><span>{activeView === 'recommended' ? '根据你的学习阶段精选' : '探索与岗位能力紧密相关的优质内容'}</span><strong>{filtered.length} 个结果</strong></div>

      {loading ? <div className="resource-grid">{Array.from({ length: 6 }).map((_, index) => <Skeleton.Node active key={index} className="resource-skeleton" />)}</div>
        : displayed.length ? <div className="resource-grid">
          {displayed.map((resource, index) => <article className="resource-card" key={resource.id} style={{ '--card-index': index } as React.CSSProperties}>
            <div className={`resource-icon resource-icon-${resource.resourceType}`}>{iconFor(resource.resourceType)}</div>
            <div className="resource-card-top"><div><span className="resource-source">{resource.author || '公开学习平台'}</span><h2>{resource.title}</h2></div>
              {resource.seriesSlug ? <span className="course-series-badge">系列</span> : <Tooltip title={favorites.has(String(resource.id)) ? '取消收藏' : '收藏资源'}><button className="favorite-button" onClick={() => toggleFavorite(resource)}>{favorites.has(String(resource.id)) ? <HeartFilled /> : <HeartOutlined />}</button></Tooltip>}
            </div>
            <p>{resource.description || '该资源正在完善简介，点击即可前往原始页面学习。'}</p>
            {resource.recommendationReason && <div className="recommendation-note"><ArrowUpOutlined /> {resource.recommendationReason}</div>}
            <div className="resource-tags"><Tag>{typeLabels[resource.resourceType] || '资源'}</Tag><Tag className={`difficulty-${resource.difficultyLevel}`}>{difficultyLabels[resource.difficultyLevel] || '未分级'}</Tag>{resource.isFree !== false && <Tag className="free-tag">免费</Tag>}</div>
            <div className="resource-card-footer"><span>{resource.documentCount ? <><FileTextOutlined /> {resource.documentCount} 篇</> : resource.duration ? <><ClockCircleOutlined /> {resource.duration} 分钟</> : <><StarFilled /> {resource.rating || '优质'} </>}</span>{resource.seriesSlug ? <Button type="link" onClick={() => { const item = series.find((entry) => entry.slug === resource.seriesSlug); if (item) openSeries(item) }}>查看目录</Button> : <Button type="link" href={resource.url} target="_blank" rel="noreferrer">开始学习</Button>}</div>
          </article>)}
        </div> : <Empty description="没有找到匹配的学习资源" className="resource-empty" />}
      {filtered.length > 9 && <Pagination current={page} pageSize={9} total={filtered.length} showSizeChanger={false} onChange={setPage} className="resource-pagination" />}
    </section>
    <Drawer open={Boolean(seriesDetail) || seriesLoading} onClose={() => { setSeriesDetail(null); setActiveDocument(null); setDocumentContent('') }} width="min(1120px, 100vw)" className="series-reader" title={seriesDetail?.title || '加载系列中'}>
      {seriesLoading || !seriesDetail ? <div className="series-loading"><Spin size="large" /></div> : <div className="series-reader-layout">
        <aside className="series-toc"><div className="series-reader-meta"><span>{seriesDetail.provider}</span><p>{seriesDetail.description}</p></div><Input allowClear prefix={<SearchOutlined />} placeholder="搜索目录" value={documentKeyword} onChange={(event) => setDocumentKeyword(event.target.value)} className="toc-search" />{documentGroups.map(([group, documents]) => <section className="toc-group" key={group}><h3>{group}</h3>{documents.map((document) => <button key={document.id} className={activeDocument?.id === document.id ? 'active' : ''} onClick={() => openDocument(seriesDetail.slug, document)}><span>{String(document.sortOrder + 1).padStart(2, '0')}</span>{document.title}</button>)}</section>)}</aside>
        <article className="markdown-reader">{documentLoading ? <div className="series-loading"><Spin /></div> : documentContent ? <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkFrontmatter]}
          rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSchema]]}
          components={{
            img: ({ src, alt, ...props }) => <img {...props} src={resolveAssetUrl(src)} alt={alt || ''} loading="lazy" />,
            video: ({ src, ...props }) => <video {...props} src={resolveAssetUrl(src)} controls />,
            source: ({ src, ...props }) => <source {...props} src={resolveAssetUrl(src)} />,
            a: ({ href, children, ...props }) => <a {...props} href={href} onClick={(event) => {
              if (handleDocumentLink(href)) event.preventDefault()
            }}>{children}</a>,
          }}
        >{prepareMarkdown(documentContent)}</ReactMarkdown> : <Empty description="暂无文档内容" />}</article>
      </div>}
    </Drawer>
  </main>
}

export default Resources
