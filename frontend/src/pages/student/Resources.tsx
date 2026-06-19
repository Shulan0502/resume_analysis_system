import { useState, useEffect, FC } from 'react'
import {
  Card,
  Row,
  Col,
  Input,
  Select,
  Button,
  Tag,
  Rate,
  Pagination,
  Spin,
  App,
  Tabs,
  Badge,
  Avatar,
  Tooltip,
  Empty
} from 'antd'
import {
  SearchOutlined,
  BookOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  HeartOutlined,
  CheckCircleOutlined,
  UserOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons'
import { getLearningResources, getUserRecommendations, getResourceStats, searchResources, getResourcesByCategory, getResourcesByType, addFavorite, removeFavorite, getFavorites, checkFavorite } from '@/services/api.ts'

const { Search } = Input
const { Option } = Select
const { TabPane } = Tabs

interface ResourceDetail {
  id: number
  title: string
  description: string
  resourceType: string
  category: string
  difficultyLevel: string
  url: string
  thumbnailUrl?: string
  duration?: number
  rating: number
  viewCount: number
  tags: string[]
  author: string
  isFree: boolean
  price?: number
  createdAt: string
}

interface RecommendationDetail {
  id: number
  resource: ResourceDetail
  recommendationReason: string
  recommendationScore: number
  priorityLevel: number
  isViewed: boolean
  isCompleted: boolean
  createdAt: string
}

interface ResourceStats {
  totalResources: number
  totalRecommendations: number
  unviewedRecommendations: number
  completedRecommendations: number
}

const Resources: FC = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [resources, setResources] = useState<ResourceDetail[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationDetail[]>([])
  const [favorites, setFavorites] = useState<ResourceDetail[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set())
  const [stats, setStats] = useState<ResourceStats | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(12)
  const [totalCount, setTotalCount] = useState(0)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [activeTab, setActiveTab] = useState('all')

  // 资源类型图标映射
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayCircleOutlined className="text-red-500" />
      case 'article':
        return <FileTextOutlined className="text-blue-500" />
      case 'course':
        return <BookOutlined className="text-green-500" />
      case 'practice':
        return <TrophyOutlined className="text-yellow-500" />
      default:
        return <BookOutlined className="text-gray-500" />
    }
  }

  // 难度级别颜色映射
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'green'
      case 'intermediate':
        return 'orange'
      case 'advanced':
        return 'red'
      default:
        return 'default'
    }
  }

  // 获取所有资源（支持搜索和筛选）
  const fetchAllResources = async () => {
    setLoading(true)
    try {
      let response: any
      let filteredResources: ResourceDetail[] = []
      let total = 0

      // 如果有搜索关键词，使用搜索接口
      if (searchKeyword.trim()) {
        console.log('使用搜索接口:', searchKeyword)
        response = await searchResources(searchKeyword)
        console.log('搜索结果:', response)
        if (response.success && response.data) {
          filteredResources = Array.isArray(response.data) ? response.data : (response.data.resources || [])
          total = filteredResources.length
        }
      } else if (selectedCategory && selectedType) {
        // 如果同时有分类和类型筛选，先调用分类接口，再在前端筛选类型
        console.log('使用分类接口:', selectedCategory)
        response = await getResourcesByCategory(selectedCategory)
        console.log('分类结果:', response)
        if (response.success && response.data) {
          filteredResources = Array.isArray(response.data) ? response.data : (response.data.resources || [])
          // 前端筛选类型
          filteredResources = filteredResources.filter(resource => resource.resourceType === selectedType)
          total = filteredResources.length
        }
      } else if (selectedCategory) {
        // 如果只有分类筛选，直接调用后端分类接口
        console.log('使用分类接口:', selectedCategory)
        response = await getResourcesByCategory(selectedCategory)
        console.log('分类结果:', response)
        if (response.success && response.data) {
          filteredResources = Array.isArray(response.data) ? response.data : (response.data.resources || [])
          total = filteredResources.length
        }
      } else if (selectedType) {
        // 如果只有类型筛选，直接调用后端类型接口
        console.log('使用类型接口:', selectedType)
        response = await getResourcesByType(selectedType)
        console.log('类型结果:', response)
        if (response.success && response.data) {
          filteredResources = Array.isArray(response.data) ? response.data : (response.data.resources || [])
          total = filteredResources.length
        }
      } else {
        // 否则获取所有资源（分页）
        console.log('获取所有资源, page:', currentPage, 'size:', pageSize)
        response = await getLearningResources(currentPage, pageSize)
        console.log('API响应:', response)
        if (response.success && response.data && response.data.resources) {
          filteredResources = response.data.resources
          total = response.data.totalCount || 0  // 使用后端返回的总数
          console.log('获取到的资源数量:', filteredResources.length, '总数:', total)
        } else {
          console.log('API响应无数据或结构不正确')
        }
      }

      console.log('最终资源数量:', filteredResources.length, '总数:', total)
      setResources(filteredResources)
      setTotalCount(total)
    } catch (error) {
      message.error('获取资源失败')
      console.error('获取资源失败:', error)
    } finally {
      setLoading(false)
    }
  }

  // 获取用户推荐
  const fetchRecommendations = async () => {
    setLoading(true)
    try {
      // 个性化推荐固定显示6个资源
      const recommendationPageSize = 6;
      const response = await getUserRecommendations(1, currentPage, recommendationPageSize) // 默认用户ID为1
      if (response.success && response.data && response.data.recommendations && response.data.recommendations.length > 0) {
        setRecommendations(response.data.recommendations)
        setTotalCount(response.data.totalCount || 0)
      } else {
        // 如果后端没有数据，使用固定的推荐数据
        const fixedRecommendations: RecommendationDetail[] = [
          {
            id: 1,
            resource: {
              id: 1,
              title: 'Java基础编程入门',
              description: '从零开始学习Java编程语言，掌握面向对象编程思想和基本语法',
              category: '编程语言',
              resourceType: 'video',
              difficultyLevel: 'beginner',
              duration: 120,
              rating: 4.8,
              viewCount: 1250,
              isFree: true,
              url: 'https://example.com/java-basics',
              thumbnailUrl: 'https://example.com/thumbnails/java.jpg',
              tags: ['Java', '编程', '入门', '面向对象'],
              author: '张老师',
              createdAt: new Date().toISOString()
            },
            recommendationReason: '基于您的编程基础，推荐学习Java基础知识',
            recommendationScore: 0.95,
            priorityLevel: 5,
            isViewed: false,
            isCompleted: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            resource: {
              id: 2,
              title: 'Spring Boot实战开发',
              description: '深入学习Spring Boot框架，构建企业级Web应用程序',
              category: '框架技术',
              resourceType: 'course',
              difficultyLevel: 'intermediate',
              duration: 180,
              rating: 4.9,
              viewCount: 980,
              isFree: false,
              price: 199,
              url: 'https://example.com/springboot-course',
              thumbnailUrl: 'https://example.com/thumbnails/springboot.jpg',
              tags: ['Spring Boot', 'Web开发', '后端', '框架'],
              author: '李工程师',
              createdAt: new Date().toISOString()
            },
            recommendationReason: '掌握Java基础后，建议学习Spring Boot框架',
            recommendationScore: 0.90,
            priorityLevel: 4,
            isViewed: false,
            isCompleted: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            resource: {
              id: 3,
              title: '数据结构与算法精讲',
              description: '系统学习常用数据结构和算法，提升编程思维和解题能力',
              category: '算法数据结构',
              resourceType: 'video',
              difficultyLevel: 'intermediate',
              duration: 200,
              rating: 4.7,
              viewCount: 1500,
              isFree: true,
              url: 'https://example.com/algorithms',
              thumbnailUrl: 'https://example.com/thumbnails/algorithm.jpg',
              tags: ['算法', '数据结构', '编程思维', '面试'],
              author: '王教授',
              createdAt: new Date().toISOString()
            },
            recommendationReason: '提升编程思维，算法和数据结构是必备技能',
            recommendationScore: 0.88,
            priorityLevel: 4,
            isViewed: false,
            isCompleted: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 4,
            resource: {
              id: 4,
              title: 'MySQL数据库设计与优化',
              description: '学习MySQL数据库设计原理，掌握性能优化技巧',
              category: '数据库',
              resourceType: 'article',
              difficultyLevel: 'intermediate',
              duration: 90,
              rating: 4.6,
              viewCount: 800,
              isFree: true,
              url: 'https://example.com/mysql-optimization',
              thumbnailUrl: 'https://example.com/thumbnails/mysql.jpg',
              tags: ['MySQL', '数据库', '优化', '设计'],
              author: '赵DBA',
              createdAt: new Date().toISOString()
            },
            recommendationReason: '后端开发必备，学习数据库设计和优化',
            recommendationScore: 0.85,
            priorityLevel: 3,
            isViewed: false,
            isCompleted: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 5,
            resource: {
              id: 5,
              title: '前端React开发实战',
              description: '掌握React框架开发现代化前端应用，包含Hooks和状态管理',
              category: '前端开发',
              resourceType: 'course',
              difficultyLevel: 'intermediate',
              duration: 150,
              rating: 4.8,
              viewCount: 1100,
              isFree: false,
              price: 299,
              url: 'https://example.com/react-course',
              thumbnailUrl: 'https://example.com/thumbnails/react.jpg',
              tags: ['React', '前端', 'JavaScript', 'Hooks'],
              author: '陈前端',
              createdAt: new Date().toISOString()
            },
            recommendationReason: '全栈开发推荐，学习前端React技术',
            recommendationScore: 0.82,
            priorityLevel: 3,
            isViewed: false,
            isCompleted: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 6,
            resource: {
              id: 6,
              title: '系统设计面试指南',
              description: '大厂系统设计面试题解析，掌握分布式系统设计思路',
              category: '系统设计',
              resourceType: 'practice',
              difficultyLevel: 'advanced',
              duration: 240,
              rating: 4.9,
              viewCount: 750,
              isFree: true,
              url: 'https://example.com/system-design',
              thumbnailUrl: 'https://example.com/thumbnails/system-design.jpg',
              tags: ['系统设计', '面试', '分布式', '架构'],
              author: '刘架构师',
              createdAt: new Date().toISOString()
            },
            recommendationReason: '面试必备，系统设计能力提升',
            recommendationScore: 0.80,
            priorityLevel: 2,
            isViewed: true,
            isCompleted: false,
            createdAt: new Date().toISOString()
          }
        ]
        setRecommendations(fixedRecommendations)
        setTotalCount(6)
      }
    } catch (error) {
      console.error('获取推荐失败:', error)
      // 如果API调用失败，也使用固定数据
      const fixedRecommendations: RecommendationDetail[] = [
        {
          id: 1,
          resource: {
            id: 1,
            title: 'Java基础编程入门',
            description: '从零开始学习Java编程语言，掌握面向对象编程思想和基本语法',
            category: '编程语言',
            resourceType: 'video',
            difficultyLevel: 'beginner',
            duration: 120,
            rating: 4.8,
            viewCount: 1250,
            isFree: true,
            url: 'https://example.com/java-basics',
            thumbnailUrl: 'https://example.com/thumbnails/java.jpg',
            tags: ['Java', '编程', '入门', '面向对象'],
            author: '张老师',
            createdAt: new Date().toISOString()
          },
          recommendationReason: '基于您的编程基础，推荐学习Java基础知识',
          recommendationScore: 0.95,
          priorityLevel: 5,
          isViewed: false,
          isCompleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          resource: {
            id: 2,
            title: 'Spring Boot实战开发',
            description: '深入学习Spring Boot框架，构建企业级Web应用程序',
            category: '框架技术',
            resourceType: 'course',
            difficultyLevel: 'intermediate',
            duration: 180,
            rating: 4.9,
            viewCount: 980,
            isFree: false,
            price: 199,
            url: 'https://example.com/springboot-course',
            thumbnailUrl: 'https://example.com/thumbnails/springboot.jpg',
            tags: ['Spring Boot', 'Web开发', '后端', '框架'],
            author: '李工程师',
            createdAt: new Date().toISOString()
          },
          recommendationReason: '掌握Java基础后，建议学习Spring Boot框架',
          recommendationScore: 0.90,
          priorityLevel: 4,
          isViewed: false,
          isCompleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 3,
          resource: {
            id: 3,
            title: '数据结构与算法精讲',
            description: '系统学习常用数据结构和算法，提升编程思维和解题能力',
            category: '算法数据结构',
            resourceType: 'video',
            difficultyLevel: 'intermediate',
            duration: 200,
            rating: 4.7,
            viewCount: 1500,
            isFree: true,
            url: 'https://example.com/algorithms',
            thumbnailUrl: 'https://example.com/thumbnails/algorithm.jpg',
            tags: ['算法', '数据结构', '编程思维', '面试'],
            author: '王教授',
            createdAt: new Date().toISOString()
          },
          recommendationReason: '提升编程思维，算法和数据结构是必备技能',
          recommendationScore: 0.88,
          priorityLevel: 4,
          isViewed: false,
          isCompleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 4,
          resource: {
            id: 4,
            title: 'MySQL数据库设计与优化',
            description: '学习MySQL数据库设计原理，掌握性能优化技巧',
            category: '数据库',
            resourceType: 'article',
            difficultyLevel: 'intermediate',
            duration: 90,
            rating: 4.6,
            viewCount: 800,
            isFree: true,
            url: 'https://example.com/mysql-optimization',
            thumbnailUrl: 'https://example.com/thumbnails/mysql.jpg',
            tags: ['MySQL', '数据库', '优化', '设计'],
            author: '赵DBA',
            createdAt: new Date().toISOString()
          },
          recommendationReason: '后端开发必备，学习数据库设计和优化',
          recommendationScore: 0.85,
          priorityLevel: 3,
          isViewed: false,
          isCompleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 5,
          resource: {
            id: 5,
            title: '前端React开发实战',
            description: '掌握React框架开发现代化前端应用，包含Hooks和状态管理',
            category: '前端开发',
            resourceType: 'course',
            difficultyLevel: 'intermediate',
            duration: 150,
            rating: 4.8,
            viewCount: 1100,
            isFree: false,
            price: 299,
            url: 'https://example.com/react-course',
            thumbnailUrl: 'https://example.com/thumbnails/react.jpg',
            tags: ['React', '前端', 'JavaScript', 'Hooks'],
            author: '陈前端',
            createdAt: new Date().toISOString()
          },
          recommendationReason: '全栈开发推荐，学习前端React技术',
          recommendationScore: 0.82,
          priorityLevel: 3,
          isViewed: false,
          isCompleted: false,
          createdAt: new Date().toISOString()
        },
        {
          id: 6,
          resource: {
            id: 6,
            title: '系统设计面试指南',
            description: '大厂系统设计面试题解析，掌握分布式系统设计思路',
            category: '系统设计',
            resourceType: 'practice',
            difficultyLevel: 'advanced',
            duration: 240,
            rating: 4.9,
            viewCount: 750,
            isFree: true,
            url: 'https://example.com/system-design',
            thumbnailUrl: 'https://example.com/thumbnails/system-design.jpg',
            tags: ['系统设计', '面试', '分布式', '架构'],
            author: '刘架构师',
            createdAt: new Date().toISOString()
          },
          recommendationReason: '面试必备，系统设计能力提升',
          recommendationScore: 0.80,
          priorityLevel: 2,
          isViewed: true,
          isCompleted: false,
          createdAt: new Date().toISOString()
        }
      ]
      setRecommendations(fixedRecommendations)
      setTotalCount(6)
    } finally {
      setLoading(false)
    }
  }

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await getResourceStats(1) // 默认用户ID为1
      if (response.success && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
    }
  }

  // 【链路3】获取收藏列表
  // 【链路3】发起HTTP请求到后端 /api/resources/favorites
  const fetchFavoritesList = async () => {
    setLoading(true)
    try {
      const response = await getFavorites(1, currentPage, pageSize) // 【链路3】调用API层getFavorites函数
      if (response.success && response.data) {
        setFavorites(response.data.resources || [])  // 【链路7】更新收藏列表状态，触发重渲染
        setTotalCount(response.data.totalCount || 0) // 【链路7】更新总数状态
      } else {
        setFavorites([])
        setTotalCount(0)
      }
    } catch (error) {
      message.error('获取收藏列表失败')
      console.error('获取收藏列表失败:', error)
      setFavorites([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }

  // 切换收藏状态
  const toggleFavorite = async (resourceId: number) => {
    try {
      if (favoriteIds.has(resourceId)) {
        // 取消收藏
        const response = await removeFavorite(1, resourceId)
        if (response.success) {
          message.success('已取消收藏')
          const newFavoriteIds = new Set(favoriteIds)
          newFavoriteIds.delete(resourceId)
          setFavoriteIds(newFavoriteIds)
          // 如果当前在收藏夹标签页，刷新收藏列表
          if (activeTab === 'favorites') {
            fetchFavoritesList()
          }
        } else {
          message.error(response.message || '取消收藏失败')
        }
      } else {
        // 添加收藏
        const response = await addFavorite(1, resourceId)
        if (response.success) {
          message.success('收藏成功')
          const newFavoriteIds = new Set(favoriteIds)
          newFavoriteIds.add(resourceId)
          setFavoriteIds(newFavoriteIds)
        } else {
          message.error(response.message || '收藏失败')
        }
      }
    } catch (error) {
      message.error('操作失败')
      console.error('切换收藏状态失败:', error)
    }
  }

  // 加载所有资源的收藏状态
  const loadFavoriteStatus = async (resourceIds: number[]) => {
    try {
      const favoriteSet = new Set<number>()
      for (const resourceId of resourceIds) {
        const response = await checkFavorite(1, resourceId)
        if (response.success && response.isFavorite === true) {
          favoriteSet.add(resourceId)
        }
      }
      setFavoriteIds(favoriteSet)
    } catch (error) {
      console.error('加载收藏状态失败:', error)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // 【链路2】监听标签页切换，触发对应数据加载
  // 【链路2】useEffect监听activeTab状态变化
  useEffect(() => {
    if (activeTab === 'all') {
      fetchAllResources()
    } else if (activeTab === 'recommendations') {
      fetchRecommendations()
    } else if (activeTab === 'favorites') {
      fetchFavoritesList() // 【链路2】检测到favorites，执行加载函数
    }
  }, [activeTab, currentPage]) // 依赖activeTab变化自动触发

  // 加载资源后获取收藏状态
  useEffect(() => {
    if (resources.length > 0 && activeTab === 'all') {
      const resourceIds = resources.map(r => r.id)
      loadFavoriteStatus(resourceIds)
    }
  }, [resources])

  // 加载收藏夹资源的收藏状态
  useEffect(() => {
    if (favorites.length > 0 && activeTab === 'favorites') {
      const resourceIds = favorites.map(r => r.id)
      loadFavoriteStatus(resourceIds)
    }
  }, [favorites])

  // 监听筛选条件变化，重新获取数据
  useEffect(() => {
    if (activeTab === 'all') {
      // 重置到第一页
      setCurrentPage(1)
      fetchAllResources()
    }
  }, [searchKeyword, selectedCategory, selectedType])

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setCurrentPage(1) // 重置到第一页
  }

  // 清除所有筛选条件
  const handleClearFilters = () => {
    setSearchKeyword('')
    setSelectedCategory('')
    setSelectedType('')
    setCurrentPage(1)
  }

  // 分页处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 资源卡片
  const renderResourceCard = (resource: ResourceDetail) => (
    <Card
      key={resource.id}
      className="h-full hover:shadow-lg transition-shadow"
      cover={
        resource.thumbnailUrl ? (
          <img
            alt={resource.title}
            src={resource.thumbnailUrl}
            className="h-48 object-cover"
          />
        ) : (
          <div className="h-48 bg-gray-100 flex items-center justify-center">
            {getResourceIcon(resource.resourceType)}
          </div>
        )
      }
      actions={[
        <Tooltip title="查看详情">
          <EyeOutlined key="view" onClick={() => window.open(resource.url, '_blank')} />
        </Tooltip>,
        <Tooltip title={favoriteIds.has(resource.id) ? "取消收藏" : "收藏"}>
          {favoriteIds.has(resource.id) ? 
            <StarFilled 
              key="star" 
              style={{ color: '#fadb14' }} 
              onClick={() => toggleFavorite(resource.id)} 
            /> : 
            <StarOutlined 
              key="star" 
              onClick={() => toggleFavorite(resource.id)} 
            />
          }
        </Tooltip>,
        <Tooltip title={`${resource.viewCount} 次浏览`}>
          <span>{resource.viewCount}</span>
        </Tooltip>
      ]}
    >
      <Card.Meta
        title={
          <div className="flex items-center justify-between">
            <span className="truncate">{resource.title}</span>
            {resource.isFree ? (
              <Tag color="green">免费</Tag>
            ) : (
              <Tag color="orange">¥{resource.price}</Tag>
            )}
          </div>
        }
        description={
          <div className="space-y-2">
            <p className="text-gray-600 text-sm line-clamp-2">{resource.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Rate disabled defaultValue={resource.rating} />
                <span className="text-sm text-gray-500">({resource.rating})</span>
              </div>
              {resource.duration && (
                <div className="flex items-center text-gray-500 text-sm">
                  <ClockCircleOutlined className="mr-1" />
                  {resource.duration}分钟
                </div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Tag color={getDifficultyColor(resource.difficultyLevel)}>
                {resource.difficultyLevel}
              </Tag>
              <div className="flex items-center text-gray-500 text-sm">
                <UserOutlined className="mr-1" />
                {resource.author}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>
          </div>
        }
      />
    </Card>
  )

  // 推荐卡片
  const renderRecommendationCard = (recommendation: RecommendationDetail) => (
    <Card
      key={recommendation.id}
      className={`h-full hover:shadow-lg transition-shadow ${
        !recommendation.isViewed ? 'border-blue-300' : ''
      }`}
      extra={
        <div className="flex items-center space-x-2">
          {!recommendation.isViewed && <Badge status="processing" text="新推荐" />}
          {recommendation.isCompleted && <CheckCircleOutlined className="text-green-500" />}
          <Tag color="blue">优先级 {recommendation.priorityLevel}</Tag>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <Avatar size={48} icon={getResourceIcon(recommendation.resource.resourceType)} />
          <div className="flex-1">
            <h4 className="font-semibold text-lg mb-1">{recommendation.resource.title}</h4>
            <p className="text-gray-600 text-sm mb-2">{recommendation.resource.description}</p>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>评分: {recommendation.resource.rating}</span>
              <span>时长: {recommendation.resource.duration}分钟</span>
              <span>作者: {recommendation.resource.author}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-sm text-blue-700">
            <strong>推荐理由:</strong> {recommendation.recommendationReason}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-blue-600">
              推荐分数: {(recommendation.recommendationScore * 100).toFixed(0)}%
            </span>
            <Button
              type="primary"
              size="small"
              onClick={() => window.open(recommendation.resource.url, '_blank')}
            >
              开始学习
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )

  return (
    <div className="p-6 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和统计 */}
        <div className="mb-8 animate-slide-in-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <BookOutlined className="mr-3 text-3xl text-yellow-500 animate-bounce" />
              学习资源中心
              <span className="text-sm text-gray-600 ml-3 bg-white bg-opacity-50 px-3 py-1 rounded-full">
                (当前显示 {resources.length} 个资源，总计 {totalCount} 个)
              </span>
            </h1>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center text-center animate-fade-in-up">
                  <div className="text-2xl font-bold text-blue-600">{stats.totalResources}</div>
                  <div className="text-sm text-gray-600 mt-1">总资源</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center text-center animate-fade-in-up delay-100">
                  <div className="text-2xl font-bold text-green-600">{stats.totalRecommendations}</div>
                  <div className="text-sm text-gray-600 mt-1">推荐资源</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center text-center animate-fade-in-up delay-200">
                  <div className="text-2xl font-bold text-orange-600">{stats.unviewedRecommendations}</div>
                  <div className="text-sm text-gray-600 mt-1">未查看</div>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex flex-col items-center justify-center text-center animate-fade-in-up delay-300">
                  <div className="text-2xl font-bold text-purple-600">{stats.completedRecommendations}</div>
                  <div className="text-sm text-gray-600 mt-1">已完成</div>
                </div>
              </div>
            )
          }
          </div>

          {/* 搜索和筛选 */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6 animate-slide-in-right">
            <Search
              placeholder="搜索资源..."
              allowClear
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              enterButton={
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />} 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                />
              }
              size="large"
              onSearch={handleSearch}
              className="flex-1 rounded-xl max-w-md"
            />
            <Select
              placeholder="选择分类"
              allowClear
              size="large"
              style={{ width: 150 }}
              value={selectedCategory || undefined}
              onChange={(value) => setSelectedCategory(value || '')}
              className="rounded-xl"
            >
              <Option value="面试技巧">面试技巧</Option>
              <Option value="技术知识">技术知识</Option>
              <Option value="软技能">软技能</Option>
              <Option value="行业知识">行业知识</Option>
              <Option value="编程语言">编程语言</Option>
              <Option value="框架技术">框架技术</Option>
              <Option value="算法数据结构">算法数据结构</Option>
              <Option value="数据库">数据库</Option>
              <Option value="前端开发">前端开发</Option>
              <Option value="系统设计">系统设计</Option>
              <Option value="操作系统">操作系统</Option>
            </Select>
            <Select
              placeholder="资源类型"
              allowClear
              size="large"
              style={{ width: 120 }}
              value={selectedType || undefined}
              onChange={(value) => setSelectedType(value || '')}
              className="rounded-xl"
            >
              <Option value="video">视频</Option>
              <Option value="article">文章</Option>
              <Option value="course">课程</Option>
              <Option value="practice">练习</Option>
            </Select>
            {(searchKeyword || selectedCategory || selectedType) && (
              <Button 
                size="large" 
                onClick={handleClearFilters}
                className="rounded-xl"
              >
                清除筛选
              </Button>
            )}
          </div>
        </div>

        {/* 【链路1】标签页组件 - 点击收藏夹按钮触发状态切换 */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab} // 【链路1】点击标签页触发onChange事件，调用setActiveTab改变状态 
          size="large"
          className="bg-white p-6 rounded-2xl shadow-xl animate-fade-in"
        >
          <TabPane 
            tab={
              <span className="flex items-center">
                <BookOutlined className="mr-2" />
                所有资源
              </span>
            } 
            key="all"
          >
            <Spin spinning={loading} tip="加载中..." size="large">
              {resources.length > 0 ? (
                <>
                  <Row gutter={[24, 24]}>
                    {resources.map((resource, index) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={resource.id} className={`animate-fade-in-up delay-${index * 50}`}>
                        {renderResourceCard(resource)}
                      </Col>
                    ))}
                  </Row>
                  <div className="mt-8 text-center animate-fade-in">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalCount}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper
                      showTotal={(total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                      }
                      className="bg-white p-4 rounded-2xl shadow-md inline-block"
                    />
                  </div>
                </>
              ) : (
                <Empty 
                  description="暂无资源" 
                  className="animate-fade-in bg-white p-12 rounded-2xl shadow-md"
                />
              )}
            </Spin>
          </TabPane>
          
          <TabPane 
            tab={
              <span className="flex items-center">
                <HeartOutlined className="mr-2 text-yellow-500" />
                个性化推荐
                {stats?.unviewedRecommendations ? (
                  <Badge 
                    count={stats?.unviewedRecommendations} 
                    size="small" 
                    className="ml-2"
                    style={{ borderRadius: '50%' }}
                  />
                ) : null}
              </span>
            } 
            key="recommendations"
          >
            <Spin spinning={loading} tip="加载中..." size="large">
              {recommendations.length > 0 ? (
                <>
                  <Row gutter={[24, 24]}>
                    {recommendations.map((recommendation, index) => (
                      <Col xs={24} lg={12} key={recommendation.id} className={`animate-fade-in-up delay-${index * 100}`}>
                        {renderRecommendationCard(recommendation)}
                      </Col>
                    ))}
                  </Row>
                  <div className="mt-8 text-center animate-fade-in">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalCount}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper
                      showTotal={(total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                      }
                      className="bg-white p-4 rounded-2xl shadow-md inline-block"
                    />
                  </div>
                </>
              ) : (
                <Empty 
                  description="暂无推荐资源" 
                  className="animate-fade-in bg-white p-12 rounded-2xl shadow-md"
                />
              )}
            </Spin>
          </TabPane>
          
          {/* 【链路1】收藏夹标签页 - key值为'favorites' */}
          <TabPane 
            tab={
              <span className="flex items-center">
                <StarFilled className="mr-2 text-yellow-500" />
                收藏夹
              </span>
            } 
            key="favorites" // 【链路1】点击时将'favorites'传给setActiveTab
          >
            {/* 【链路8】根据favorites状态渲染UI */}
            <Spin spinning={loading} tip="加载中..." size="large">
              {favorites.length > 0 ? (
                <>
                  <Row gutter={[24, 24]}>
                    {favorites.map((resource, index) => (
                      <Col xs={24} sm={12} md={8} lg={6} key={resource.id} className={`animate-fade-in-up delay-${index * 50}`}>
                        {renderResourceCard(resource)}
                      </Col>
                    ))}
                  </Row>
                  <div className="mt-8 text-center animate-fade-in">
                    <Pagination
                      current={currentPage}
                      pageSize={pageSize}
                      total={totalCount}
                      onChange={handlePageChange}
                      showSizeChanger={false}
                      showQuickJumper
                      showTotal={(total, range) =>
                        `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                      }
                      className="bg-white p-4 rounded-2xl shadow-md inline-block"
                    />
                  </div>
                </>
              ) : (
                <Empty 
                  description="暂无收藏资源" 
                  className="animate-fade-in bg-white p-12 rounded-2xl shadow-md"
                />
              )}
            </Spin>
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
}

export default Resources
