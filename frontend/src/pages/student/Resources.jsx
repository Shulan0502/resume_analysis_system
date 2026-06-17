"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var antd_1 = require("antd");
var icons_1 = require("@ant-design/icons");
var api_1 = require("../../services/api");
var Search = antd_1.Input.Search;
var Option = antd_1.Select.Option;
var TabPane = antd_1.Tabs.TabPane;
var Resources = function () {
    var _a = (0, react_1.useState)(false), loading = _a[0], setLoading = _a[1];
    var _b = (0, react_1.useState)([]), resources = _b[0], setResources = _b[1];
    var _c = (0, react_1.useState)([]), recommendations = _c[0], setRecommendations = _c[1];
    var _d = (0, react_1.useState)([]), favorites = _d[0], setFavorites = _d[1];
    var _e = (0, react_1.useState)(new Set()), favoriteIds = _e[0], setFavoriteIds = _e[1];
    var _f = (0, react_1.useState)(null), stats = _f[0], setStats = _f[1];
    var _g = (0, react_1.useState)(1), currentPage = _g[0], setCurrentPage = _g[1];
    var pageSize = (0, react_1.useState)(12)[0];
    var _h = (0, react_1.useState)(0), totalCount = _h[0], setTotalCount = _h[1];
    var _j = (0, react_1.useState)(''), searchKeyword = _j[0], setSearchKeyword = _j[1];
    var _k = (0, react_1.useState)(''), selectedCategory = _k[0], setSelectedCategory = _k[1];
    var _l = (0, react_1.useState)(''), selectedType = _l[0], setSelectedType = _l[1];
    var _m = (0, react_1.useState)('all'), activeTab = _m[0], setActiveTab = _m[1];
    // 资源类型图标映射
    var getResourceIcon = function (type) {
        switch (type) {
            case 'video':
                return <icons_1.PlayCircleOutlined className="text-red-500"/>;
            case 'article':
                return <icons_1.FileTextOutlined className="text-blue-500"/>;
            case 'course':
                return <icons_1.BookOutlined className="text-green-500"/>;
            case 'practice':
                return <icons_1.TrophyOutlined className="text-yellow-500"/>;
            default:
                return <icons_1.BookOutlined className="text-gray-500"/>;
        }
    };
    // 难度级别颜色映射
    var getDifficultyColor = function (level) {
        switch (level) {
            case 'beginner':
                return 'green';
            case 'intermediate':
                return 'orange';
            case 'advanced':
                return 'red';
            default:
                return 'default';
        }
    };
    // 获取所有资源（支持搜索和筛选）
    var fetchAllResources = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, filteredResources, total, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 12, 13, 14]);
                    response = void 0;
                    filteredResources = [];
                    total = 0;
                    if (!searchKeyword.trim()) return [3 /*break*/, 3];
                    console.log('使用搜索接口:', searchKeyword);
                    return [4 /*yield*/, (0, api_1.searchResources)(searchKeyword)];
                case 2:
                    response = _a.sent();
                    console.log('搜索结果:', response);
                    if (response.success && response.data) {
                        filteredResources = Array.isArray(response.data) ? response.data : (response.data.resources || []);
                        total = filteredResources.length;
                    }
                    return [3 /*break*/, 11];
                case 3:
                    if (!(selectedCategory && selectedType)) return [3 /*break*/, 5];
                    // 如果同时有分类和类型筛选，先调用分类接口，再在前端筛选类型
                    console.log('使用分类接口:', selectedCategory);
                    return [4 /*yield*/, (0, api_1.getResourcesByCategory)(selectedCategory)];
                case 4:
                    response = _a.sent();
                    console.log('分类结果:', response);
                    if (response.success && response.data) {
                        filteredResources = Array.isArray(response.data) ? response.data : (response.data.resources || []);
                        // 前端筛选类型
                        filteredResources = filteredResources.filter(function (resource) { return resource.resourceType === selectedType; });
                        total = filteredResources.length;
                    }
                    return [3 /*break*/, 11];
                case 5:
                    if (!selectedCategory) return [3 /*break*/, 7];
                    // 如果只有分类筛选，直接调用后端分类接口
                    console.log('使用分类接口:', selectedCategory);
                    return [4 /*yield*/, (0, api_1.getResourcesByCategory)(selectedCategory)];
                case 6:
                    response = _a.sent();
                    console.log('分类结果:', response);
                    if (response.success && response.data) {
                        filteredResources = Array.isArray(response.data) ? response.data : (response.data.resources || []);
                        total = filteredResources.length;
                    }
                    return [3 /*break*/, 11];
                case 7:
                    if (!selectedType) return [3 /*break*/, 9];
                    // 如果只有类型筛选，直接调用后端类型接口
                    console.log('使用类型接口:', selectedType);
                    return [4 /*yield*/, (0, api_1.getResourcesByType)(selectedType)];
                case 8:
                    response = _a.sent();
                    console.log('类型结果:', response);
                    if (response.success && response.data) {
                        filteredResources = Array.isArray(response.data) ? response.data : (response.data.resources || []);
                        total = filteredResources.length;
                    }
                    return [3 /*break*/, 11];
                case 9:
                    // 否则获取所有资源（分页）
                    console.log('获取所有资源, page:', currentPage, 'size:', pageSize);
                    return [4 /*yield*/, (0, api_1.getLearningResources)(currentPage, pageSize)];
                case 10:
                    response = _a.sent();
                    console.log('API响应:', response);
                    if (response.success && response.data && response.data.resources) {
                        filteredResources = response.data.resources;
                        total = response.data.totalCount || 0; // 使用后端返回的总数
                        console.log('获取到的资源数量:', filteredResources.length, '总数:', total);
                    }
                    else {
                        console.log('API响应无数据或结构不正确');
                    }
                    _a.label = 11;
                case 11:
                    console.log('最终资源数量:', filteredResources.length, '总数:', total);
                    setResources(filteredResources);
                    setTotalCount(total);
                    return [3 /*break*/, 14];
                case 12:
                    error_1 = _a.sent();
                    antd_1.message.error('获取资源失败');
                    console.error('获取资源失败:', error_1);
                    return [3 /*break*/, 14];
                case 13:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 14: return [2 /*return*/];
            }
        });
    }); };
    // 获取用户推荐
    var fetchRecommendations = function () { return __awaiter(void 0, void 0, void 0, function () {
        var recommendationPageSize, response, fixedRecommendations, error_2, fixedRecommendations;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    recommendationPageSize = 6;
                    return [4 /*yield*/, (0, api_1.getUserRecommendations)(1, currentPage, recommendationPageSize)]; // 默认用户ID为1
                case 2:
                    response = _a.sent() // 默认用户ID为1
                    ;
                    if (response.success && response.data && response.data.recommendations && response.data.recommendations.length > 0) {
                        setRecommendations(response.data.recommendations);
                        setTotalCount(response.data.totalCount || 0);
                    }
                    else {
                        fixedRecommendations = [
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
                        ];
                        setRecommendations(fixedRecommendations);
                        setTotalCount(6);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_2 = _a.sent();
                    console.error('获取推荐失败:', error_2);
                    fixedRecommendations = [
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
                    ];
                    setRecommendations(fixedRecommendations);
                    setTotalCount(6);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // 获取统计信息
    var fetchStats = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, (0, api_1.getResourceStats)(1)]; // 默认用户ID为1
                case 1:
                    response = _a.sent() // 默认用户ID为1
                    ;
                    if (response.success && response.data) {
                        setStats(response.data);
                    }
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error('获取统计信息失败:', error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // 获取收藏列表
    var fetchFavoritesList = function () { return __awaiter(void 0, void 0, void 0, function () {
        var response, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, (0, api_1.getFavorites)(1, currentPage, pageSize)]; // 默认用户ID为1
                case 2:
                    response = _a.sent() // 默认用户ID为1
                    ;
                    if (response.success && response.data) {
                        setFavorites(response.data.resources || []);
                        setTotalCount(response.data.totalCount || 0);
                    }
                    else {
                        setFavorites([]);
                        setTotalCount(0);
                    }
                    return [3 /*break*/, 5];
                case 3:
                    error_4 = _a.sent();
                    antd_1.message.error('获取收藏列表失败');
                    console.error('获取收藏列表失败:', error_4);
                    setFavorites([]);
                    setTotalCount(0);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // 切换收藏状态
    var toggleFavorite = function (resourceId) { return __awaiter(void 0, void 0, void 0, function () {
        var response, newFavoriteIds, response, newFavoriteIds, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!favoriteIds.has(resourceId)) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, api_1.removeFavorite)(1, resourceId)];
                case 1:
                    response = _a.sent();
                    if (response.success) {
                        antd_1.message.success('已取消收藏');
                        newFavoriteIds = new Set(favoriteIds);
                        newFavoriteIds.delete(resourceId);
                        setFavoriteIds(newFavoriteIds);
                        // 如果当前在收藏夹标签页，刷新收藏列表
                        if (activeTab === 'favorites') {
                            fetchFavoritesList();
                        }
                    }
                    else {
                        antd_1.message.error(response.message || '取消收藏失败');
                    }
                    return [3 /*break*/, 4];
                case 2: return [4 /*yield*/, (0, api_1.addFavorite)(1, resourceId)];
                case 3:
                    response = _a.sent();
                    if (response.success) {
                        antd_1.message.success('收藏成功');
                        newFavoriteIds = new Set(favoriteIds);
                        newFavoriteIds.add(resourceId);
                        setFavoriteIds(newFavoriteIds);
                    }
                    else {
                        antd_1.message.error(response.message || '收藏失败');
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    error_5 = _a.sent();
                    antd_1.message.error('操作失败');
                    console.error('切换收藏状态失败:', error_5);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // 加载所有资源的收藏状态
    var loadFavoriteStatus = function (resourceIds) { return __awaiter(void 0, void 0, void 0, function () {
        var favoriteSet, _i, resourceIds_1, resourceId, response, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    favoriteSet = new Set();
                    _i = 0, resourceIds_1 = resourceIds;
                    _a.label = 1;
                case 1:
                    if (!(_i < resourceIds_1.length)) return [3 /*break*/, 4];
                    resourceId = resourceIds_1[_i];
                    return [4 /*yield*/, (0, api_1.checkFavorite)(1, resourceId)];
                case 2:
                    response = _a.sent();
                    if (response.success && response.data === true) {
                        favoriteSet.add(resourceId);
                    }
                    _a.label = 3;
                case 3:
                    _i++;
                    return [3 /*break*/, 1];
                case 4:
                    setFavoriteIds(favoriteSet);
                    return [3 /*break*/, 6];
                case 5:
                    error_6 = _a.sent();
                    console.error('加载收藏状态失败:', error_6);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    (0, react_1.useEffect)(function () {
        fetchStats();
    }, []);
    (0, react_1.useEffect)(function () {
        if (activeTab === 'all') {
            fetchAllResources();
        }
        else if (activeTab === 'recommendations') {
            fetchRecommendations();
        }
        else if (activeTab === 'favorites') {
            fetchFavoritesList();
        }
    }, [activeTab, currentPage]);
    // 加载资源后获取收藏状态
    (0, react_1.useEffect)(function () {
        if (resources.length > 0 && activeTab === 'all') {
            var resourceIds = resources.map(function (r) { return r.id; });
            loadFavoriteStatus(resourceIds);
        }
    }, [resources]);
    // 加载收藏夹资源的收藏状态
    (0, react_1.useEffect)(function () {
        if (favorites.length > 0 && activeTab === 'favorites') {
            var resourceIds = favorites.map(function (r) { return r.id; });
            loadFavoriteStatus(resourceIds);
        }
    }, [favorites]);
    // 监听筛选条件变化，重新获取数据
    (0, react_1.useEffect)(function () {
        if (activeTab === 'all') {
            // 重置到第一页
            setCurrentPage(1);
            fetchAllResources();
        }
    }, [searchKeyword, selectedCategory, selectedType]);
    // 搜索处理
    var handleSearch = function (value) {
        setSearchKeyword(value);
        setCurrentPage(1); // 重置到第一页
    };
    // 清除所有筛选条件
    var handleClearFilters = function () {
        setSearchKeyword('');
        setSelectedCategory('');
        setSelectedType('');
        setCurrentPage(1);
    };
    // 分页处理
    var handlePageChange = function (page) {
        setCurrentPage(page);
    };
    // 资源卡片
    var renderResourceCard = function (resource) { return (<antd_1.Card key={resource.id} className="h-full hover:shadow-lg transition-shadow" cover={resource.thumbnailUrl ? (<img alt={resource.title} src={resource.thumbnailUrl} className="h-48 object-cover"/>) : (<div className="h-48 bg-gray-100 flex items-center justify-center">
            {getResourceIcon(resource.resourceType)}
          </div>)} actions={[
            <antd_1.Tooltip title="查看详情">
          <icons_1.EyeOutlined key="view" onClick={function () { return window.open(resource.url, '_blank'); }}/>
        </antd_1.Tooltip>,
            <antd_1.Tooltip title={favoriteIds.has(resource.id) ? "取消收藏" : "收藏"}>
          {favoriteIds.has(resource.id) ?
                    <icons_1.StarFilled key="star" style={{ color: '#fadb14' }} onClick={function () { return toggleFavorite(resource.id); }}/> :
                    <icons_1.StarOutlined key="star" onClick={function () { return toggleFavorite(resource.id); }}/>}
        </antd_1.Tooltip>,
            <antd_1.Tooltip title={"".concat(resource.viewCount, " \u6B21\u6D4F\u89C8")}>
          <span>{resource.viewCount}</span>
        </antd_1.Tooltip>
        ]}>
      <antd_1.Card.Meta title={<div className="flex items-center justify-between">
            <span className="truncate">{resource.title}</span>
            {resource.isFree ? (<antd_1.Tag color="green">免费</antd_1.Tag>) : (<antd_1.Tag color="orange">¥{resource.price}</antd_1.Tag>)}
          </div>} description={<div className="space-y-2">
            <p className="text-gray-600 text-sm line-clamp-2">{resource.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <antd_1.Rate disabled defaultValue={resource.rating}/>
                <span className="text-sm text-gray-500">({resource.rating})</span>
              </div>
              {resource.duration && (<div className="flex items-center text-gray-500 text-sm">
                  <icons_1.ClockCircleOutlined className="mr-1"/>
                  {resource.duration}分钟
                </div>)}
            </div>
            <div className="flex items-center justify-between">
              <antd_1.Tag color={getDifficultyColor(resource.difficultyLevel)}>
                {resource.difficultyLevel}
              </antd_1.Tag>
              <div className="flex items-center text-gray-500 text-sm">
                <icons_1.UserOutlined className="mr-1"/>
                {resource.author}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map(function (tag) { return (<antd_1.Tag key={tag}>{tag}</antd_1.Tag>); })}
            </div>
          </div>}/>
    </antd_1.Card>); };
    // 推荐卡片
    var renderRecommendationCard = function (recommendation) { return (<antd_1.Card key={recommendation.id} className={"h-full hover:shadow-lg transition-shadow ".concat(!recommendation.isViewed ? 'border-blue-300' : '')} extra={<div className="flex items-center space-x-2">
          {!recommendation.isViewed && <antd_1.Badge status="processing" text="新推荐"/>}
          {recommendation.isCompleted && <icons_1.CheckCircleOutlined className="text-green-500"/>}
          <antd_1.Tag color="blue">优先级 {recommendation.priorityLevel}</antd_1.Tag>
        </div>}>
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <antd_1.Avatar size={48} icon={getResourceIcon(recommendation.resource.resourceType)}/>
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
            <antd_1.Button type="primary" size="small" onClick={function () { return window.open(recommendation.resource.url, '_blank'); }}>
              开始学习
            </antd_1.Button>
          </div>
        </div>
      </div>
    </antd_1.Card>); };
    return (<div className="p-6 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 min-h-screen animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题和统计 */}
        <div className="mb-8 animate-slide-in-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <icons_1.BookOutlined className="mr-3 text-3xl text-yellow-500 animate-bounce"/>
              学习资源中心
              <span className="text-sm text-gray-600 ml-3 bg-white bg-opacity-50 px-3 py-1 rounded-full">
                (当前显示 {resources.length} 个资源，总计 {totalCount} 个)
              </span>
            </h1>
            {stats && (<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              </div>)}
          </div>

          {/* 搜索和筛选 */}
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6 animate-slide-in-right">
            <Search placeholder="搜索资源..." allowClear value={searchKeyword} onChange={function (e) { return setSearchKeyword(e.target.value); }} enterButton={<antd_1.Button type="primary" icon={<icons_1.SearchOutlined />} className="bg-gradient-to-r from-blue-500 to-purple-600 border-none hover:from-blue-600 hover:to-purple-700 transition-all duration-300"/>} size="large" onSearch={handleSearch} className="flex-1 rounded-xl max-w-md"/>
            <antd_1.Select placeholder="选择分类" allowClear size="large" style={{ width: 150 }} value={selectedCategory || undefined} onChange={function (value) { return setSelectedCategory(value || ''); }} className="rounded-xl">
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
            </antd_1.Select>
            <antd_1.Select placeholder="资源类型" allowClear size="large" style={{ width: 120 }} value={selectedType || undefined} onChange={function (value) { return setSelectedType(value || ''); }} className="rounded-xl">
              <Option value="video">视频</Option>
              <Option value="article">文章</Option>
              <Option value="course">课程</Option>
              <Option value="practice">练习</Option>
            </antd_1.Select>
            {(searchKeyword || selectedCategory || selectedType) && (<antd_1.Button size="large" onClick={handleClearFilters} className="rounded-xl">
                清除筛选
              </antd_1.Button>)}
          </div>
        </div>

        {/* 标签页 */}
        <antd_1.Tabs activeKey={activeTab} onChange={setActiveTab} size="large" className="bg-white p-6 rounded-2xl shadow-xl animate-fade-in">
          <TabPane tab={<span className="flex items-center">
                <icons_1.BookOutlined className="mr-2"/>
                所有资源
              </span>} key="all">
            <antd_1.Spin spinning={loading} tip="加载中..." size="large">
              {resources.length > 0 ? (<>
                  <antd_1.Row gutter={[24, 24]}>
                    {resources.map(function (resource, index) { return (<antd_1.Col xs={24} sm={12} md={8} lg={6} key={resource.id} className={"animate-fade-in-up delay-".concat(index * 50)}>
                        {renderResourceCard(resource)}
                      </antd_1.Col>); })}
                  </antd_1.Row>
                  <div className="mt-8 text-center animate-fade-in">
                    <antd_1.Pagination current={currentPage} pageSize={pageSize} total={totalCount} onChange={handlePageChange} showSizeChanger={false} showQuickJumper showTotal={function (total, range) {
                return "\u7B2C ".concat(range[0], "-").concat(range[1], " \u6761\uFF0C\u5171 ").concat(total, " \u6761");
            }} className="bg-white p-4 rounded-2xl shadow-md inline-block"/>
                  </div>
                </>) : (<antd_1.Empty description="暂无资源" className="animate-fade-in bg-white p-12 rounded-2xl shadow-md"/>)}
            </antd_1.Spin>
          </TabPane>
          
          <TabPane tab={<span className="flex items-center">
                <icons_1.HeartOutlined className="mr-2 text-yellow-500"/>
                个性化推荐
                {(stats === null || stats === void 0 ? void 0 : stats.unviewedRecommendations) ? (<antd_1.Badge count={stats === null || stats === void 0 ? void 0 : stats.unviewedRecommendations} size="small" className="ml-2 bg-gradient-to-r from-red-500 to-orange-500"/>) : null}
              </span>} key="recommendations">
            <antd_1.Spin spinning={loading} tip="加载中..." size="large">
              {recommendations.length > 0 ? (<>
                  <antd_1.Row gutter={[24, 24]}>
                    {recommendations.map(function (recommendation, index) { return (<antd_1.Col xs={24} lg={12} key={recommendation.id} className={"animate-fade-in-up delay-".concat(index * 100)}>
                        {renderRecommendationCard(recommendation)}
                      </antd_1.Col>); })}
                  </antd_1.Row>
                  <div className="mt-8 text-center animate-fade-in">
                    <antd_1.Pagination current={currentPage} pageSize={pageSize} total={totalCount} onChange={handlePageChange} showSizeChanger={false} showQuickJumper showTotal={function (total, range) {
                return "\u7B2C ".concat(range[0], "-").concat(range[1], " \u6761\uFF0C\u5171 ").concat(total, " \u6761");
            }} className="bg-white p-4 rounded-2xl shadow-md inline-block"/>
                  </div>
                </>) : (<antd_1.Empty description="暂无推荐资源" className="animate-fade-in bg-white p-12 rounded-2xl shadow-md"/>)}
            </antd_1.Spin>
          </TabPane>
          
          <TabPane tab={<span className="flex items-center">
                <icons_1.StarFilled className="mr-2 text-yellow-500"/>
                收藏夹
              </span>} key="favorites">
            <antd_1.Spin spinning={loading} tip="加载中..." size="large">
              {favorites.length > 0 ? (<>
                  <antd_1.Row gutter={[24, 24]}>
                    {favorites.map(function (resource, index) { return (<antd_1.Col xs={24} sm={12} md={8} lg={6} key={resource.id} className={"animate-fade-in-up delay-".concat(index * 50)}>
                        {renderResourceCard(resource)}
                      </antd_1.Col>); })}
                  </antd_1.Row>
                  <div className="mt-8 text-center animate-fade-in">
                    <antd_1.Pagination current={currentPage} pageSize={pageSize} total={totalCount} onChange={handlePageChange} showSizeChanger={false} showQuickJumper showTotal={function (total, range) {
                return "\u7B2C ".concat(range[0], "-").concat(range[1], " \u6761\uFF0C\u5171 ").concat(total, " \u6761");
            }} className="bg-white p-4 rounded-2xl shadow-md inline-block"/>
                  </div>
                </>) : (<antd_1.Empty description="暂无收藏资源" className="animate-fade-in bg-white p-12 rounded-2xl shadow-md"/>)}
            </antd_1.Spin>
          </TabPane>
        </antd_1.Tabs>
      </div>
    </div>);
};
exports.default = Resources;
