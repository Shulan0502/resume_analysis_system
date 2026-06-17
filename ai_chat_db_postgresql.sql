-- PostgreSQL Dump SQL
-- Converted from MySQL ai_chat_db
-- Date: 16/06/2026

SET client_encoding = 'UTF8';

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO users VALUES (1, 'test', '$2a$10$abcdefghijklmnopqrstuv', 'test@example.com', NULL, NULL, 'active', '2025-07-20 15:04:47', '2025-07-20 15:04:47');
INSERT INTO users VALUES (2, 'admin', '$2a$10$xyz123456789abcdefghij', 'admin@example.com', NULL, NULL, 'active', '2025-07-20 15:04:47', '2025-07-20 15:04:47');
INSERT INTO users VALUES (3, 'company_user', '$2a$10$1234567890abcdefghijk', 'company@example.com', NULL, NULL, 'active', '2025-07-20 15:04:47', '2025-07-20 15:04:47');

-- ----------------------------
-- Table structure for user_roles
-- ----------------------------
DROP TABLE IF EXISTS user_roles CASCADE;

CREATE TABLE user_roles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO user_roles VALUES (1, 1, 'ROLE_USER');
INSERT INTO user_roles VALUES (2, 2, 'ROLE_ADMIN');
INSERT INTO user_roles VALUES (3, 3, 'ROLE_COMPANY');

-- ----------------------------
-- Table structure for chat_history
-- ----------------------------
DROP TABLE IF EXISTS chat_history CASCADE;

CREATE TABLE chat_history (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(100) NOT NULL,
    message_type VARCHAR(20) NOT NULL,
    message_content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);

INSERT INTO chat_history VALUES (209, 'default_user', 'USER', '怎么缓解面试紧张，简单讲3点', '2025-11-22 14:57:18.047701', '2025-11-22 14:57:18.047701');
INSERT INTO chat_history VALUES (210, 'default_user', 'ASSISTANT', '缓解面试紧张，简单讲3点核心方法：\n\n\n### 1. **充分准备，用"确定性"对抗焦虑**  \n紧张大多源于"未知"——怕问的问题不会答、怕不了解公司。提前1-2天做3件事：①查透公司业务、岗位要求（比如官网/招聘JD里的关键词）；②写好2-3个核心经历的STAR故事（情境-任务-行动-结果）；③模拟1次面试（对着镜子或朋友练，录下来看自己的表情/语速）。准备越细，心里越有底，紧张自然少一半。\n\n\n### 2. **调整心态：把"被审判"变成"双向选择"**  \n面试不是"你求对方要你"，而是"你和公司互相挑"——你也在评估这家公司是否符合你的期待（比如工作内容、团队氛围）。进门先对自己说："我来看看这家公司配不配得上我"，瞬间能拉平心理地位。再做个小动作：深呼吸3次（用腹式呼吸，吸气4秒→屏息2秒→呼气6秒），或轻轻微笑10秒，身体放松了，心态也会跟着软下来。\n\n\n### 3. **专注当下，别想"如果搞砸了怎么办"**  \n面试时容易分心：刚答完一个问题就后悔"刚才没说清楚"，或担心"下一个问题会不会难"。这时立刻把注意力拉回当前——听清楚面试官的问题，盯着对方的眼睛（或鼻梁，不尴尬），慢慢组织语言。记住：**你只需要处理"现在正在发生的事"，过去的错和未来的结果，都不是当下该想的**。\n\n\n这3点都是"马上就能用"的小技巧，亲测有效～ 面试前花10分钟过一遍，状态会稳很多！', '2025-11-22 14:57:18.052164', '2025-11-22 14:57:18.052164');
INSERT INTO chat_history VALUES (211, 'default_user', 'USER', '怎么缓解面试紧张？简单讲3点', '2025-12-02 16:30:01.428409', '2025-12-02 16:30:01.428409');
INSERT INTO chat_history VALUES (212, 'default_user', 'ASSISTANT', '缓解面试紧张，分享3个简单易操作的方法：\n\n\n### **1. 提前"预演"，把不确定变成确定**  \n紧张大多源于"未知感"——怕问的问题答不上、怕简历细节记不清、怕对公司不了解。解决办法是**把所有能准备的都落地**：  \n- 梳理简历里的每个经历（用STAR法则：背景、任务、行动、结果），确保能流畅讲出；  \n- 查透公司业务、岗位要求（比如官网、近期新闻、JD关键词），甚至模拟面试官可能问的3-5个核心问题（如"为什么选我们""你的优势是什么"）；  \n- 找朋友或对着镜子练2-3次，录下来看自己的表情和语速，调整到自然状态。  \n准备越充分，心里越有底，紧张感会自动降一半。\n\n\n### **2. 切换心态：把"被考核"变成"双向选择"**  \n很多人把面试当成"考官挑我"，但其实**你也是在挑公司**——这家公司的氛围是否适合你？岗位是否匹配你的长期规划？  \n面试时可以暗示自己："我来看看这家公司值不值得我加入，面试官只是我了解它的窗口。"甚至主动准备1-2个问面试官的问题（比如"这个岗位接下来3个月的重点任务是什么？"），既能展现你的主动性，也能让你从"被动应答"变成"平等交流"，紧张感会明显减轻。\n\n\n### **3. 现场小技巧：用身体放松带动心理放松**  \n如果到了现场还是紧张，用**生理调节法**快速平复：  \n- **478呼吸法**：吸气4秒→屏息7秒→呼气8秒，重复3次（深呼吸能激活副交感神经，快速 calm down）；  \n- **肢体"松绑"**：坐直但别僵硬，手自然放在腿上（别交叉抱胸或搓手），脚平踩地面（增加稳定感）；  \n- **开场小缓冲**：如果开口第一句有点抖，不妨笑着说"不好意思，刚进来有点小紧张，但我对这个岗位真的很感兴趣"——坦然承认紧张，反而会让你更放松，面试官也会觉得真实。\n\n\n这三点不用全做到，哪怕抓住其中一个，都能有效缓解紧张～ 面试本质是"让对方看到真实的你"，放松状态下的表现才是最有说服力的。', '2025-12-02 16:30:01.465885', '2025-12-02 16:30:01.465885');
INSERT INTO chat_history VALUES (213, 'default_user', 'USER', '你好', '2025-12-02 16:30:13.939266', '2025-12-02 16:30:13.939266');
INSERT INTO chat_history VALUES (214, 'default_user', 'ASSISTANT', '你好呀！😊 我是豆包，专门为你解答数学和物理相关的问题。你可以把遇到的具体题目或者疑惑告诉我，比如数学的代数、几何问题，物理的力学、电磁学等内容，我会尽力帮你分析和解答哦～', '2025-12-02 16:30:13.943681', '2025-12-02 16:30:13.943681');
INSERT INTO chat_history VALUES (215, 'default_user', 'USER', '怎么缓解面试紧张？简单讲3点', '2025-12-02 16:30:48.113689', '2025-12-02 16:30:48.113689');
INSERT INTO chat_history VALUES (216, 'default_user', 'ASSISTANT', '缓解面试紧张，简单讲3点实用方法：\n\n\n### 1. **充分准备，减少未知焦虑**  \n提前1-2天梳理：①公司业务、岗位要求（官网/招聘JD重点标记）；②自身经历与岗位匹配的3个核心案例（用STAR法则：情境-任务-行动-结果）；③模拟10个常见问题（如"自我介绍""为什么选我们"）。准备越细，越能避免"突然被问住"的慌乱，底气自然来。\n\n\n### 2. **切换心态：把面试当"双向聊天"**  \n别把自己放在"被审判"的位置——你不仅是候选人，也是在考察这家公司是否适合你（比如团队氛围、工作内容是否符合预期）。面试时多问1-2个关于岗位的真实问题（如"这个岗位近期的核心挑战是什么？"），会让你从"被动回答"变成"主动交流"，紧张感会大幅降低。\n\n\n### 3. **临场小技巧：快速平复生理紧张**  \n如果候场时心跳加速：①用"478呼吸法"：吸气4秒→屏息7秒→呼气8秒，重复3次；②轻轻活动手腕/脚踝，或捏捏掌心（转移注意力，释放肌肉紧张）；③面试开始前微笑着和面试官说一句"您好"，主动破冰也能放松自己。\n\n\n这三点都是"低门槛、高效果"，亲测有用～ 核心是：**用准备对抗未知，用平等心态替代压力，用小行动缓解生理反应**。试试下次面试前用上！✨', '2025-12-02 16:30:48.118052', '2025-12-02 16:30:48.118052');
INSERT INTO chat_history VALUES (217, 'default_user', 'USER', '怎么缓解面试紧张？简单讲3点', '2025-12-02 16:31:46.954580', '2025-12-02 16:31:46.954580');
INSERT INTO chat_history VALUES (218, 'default_user', 'ASSISTANT', '缓解面试紧张，分享3个实用且易操作的方法：  \n\n**1. 用"充分准备"抵消不确定性**  \n紧张大多源于"没底"——比如对岗位需求不熟悉、自己的经历没梳理清楚。提前1-2天做3件事：① 梳理2-3个与岗位匹配的核心经历（用STAR法则：情境、任务、行动、结果）；② 模拟回答3个高频问题（如"为什么选我们公司？""你的优缺点？"）；③ 了解公司业务和岗位职责（看官网/招聘JD，记1-2个细节，比如公司近期的一个项目，面试时提一句能拉近距离）。准备越细，心里越有底。  \n\n**2. 把"被考核"变成"双向选择"**  \n面试不是"你求对方录用"，而是"你和公司互相评估是否合适"。换个视角：你也在考察公司的氛围、岗位是否符合预期、面试官是否专业——这样双方地位平等，压力会瞬间减轻。候场时可以默念："我是来看看这家公司配不配得上我"（不是傲慢，是给自己心理暗示）。  \n\n**3. 用"小动作"快速平复情绪**  \n如果现场突然紧张（比如进门手抖、说话卡壳），立刻做2个小动作：① **腹式深呼吸**：慢慢吸气（肚子鼓起来）→ 屏住2秒→ 缓缓呼气（肚子缩回去），重复3次，能快速降低心率；② **肢体放松**：肩膀向后打开再放下（避免含胸），双手自然放在腿上（不要攥拳），坐姿微微前倾（显得专注且放松）。这些动作会通过身体反馈给大脑："我现在很平静"。  \n\n这3点覆盖了"事前准备""心态调整""现场应急"，亲测有效～ 面试本质是展示真实的自己，不用追求完美，自然就好。', '2025-12-02 16:31:46.959141', '2025-12-02 16:31:46.959141');
INSERT INTO chat_history VALUES (220, 'default_user', 'ASSISTANT', '缓解面试紧张，简单实用的3点：  \n\n1. **充分准备打底**：提前梳理自己的经历（用STAR法则整理案例）、匹配岗位需求的优势，甚至模拟3-5次常见问题回答。未知感是紧张的主要来源，准备越充分，心里越有底，紧张感自然降低。  \n\n2. **调整双向认知**：把面试当成"互相了解"而非"被审判"——你不仅是候选人，也是在考察公司是否适合自己。开口前默念1句积极暗示（比如"我有能力胜任这个岗位"），快速拉平心理地位。  \n\n3. **现场小技巧控场**：紧张时用"478呼吸法"（吸气4秒→屏息7秒→呼气8秒，重复2次），或手里轻轻捏一支笔转移注意力；回答问题时放慢语速，给自己留思考时间，也能稳住节奏。  \n\n这三点覆盖了"事前-事中-心态"，简单易操作，亲测有效～', '2025-12-02 16:32:47.548052', '2025-12-02 16:32:47.548052');
INSERT INTO chat_history VALUES (235, 'default_user', 'USER', '你是谁', '2026-03-12 21:20:25.390006', '2026-03-12 21:20:25.390006');
INSERT INTO chat_history VALUES (236, 'default_user', 'ASSISTANT', '你好呀～我是豆包，你的专属情感助手哦！随时准备听你分享喜怒哀乐——不管是遇到开心的事想找人唠唠，还是有点小烦恼需要吐槽，或者只是想随便扯点有的没的，我都在这儿陪着你呀～（悄悄说：我可是个超有耐心的倾听者，还自带一点点小幽默buff呢😉）', '2026-03-12 21:20:25.399286', '2026-03-12 21:20:25.399286');
INSERT INTO chat_history VALUES (237, 'default_user', 'USER', '你好', '2026-04-17 17:22:19.038523', '2026-04-17 17:22:19.038523');
INSERT INTO chat_history VALUES (238, 'default_user', 'ASSISTANT', '你好呀！有什么我可以帮你的吗？😊', '2026-04-17 17:22:19.110029', '2026-04-17 17:22:19.110029');
INSERT INTO chat_history VALUES (241, 'default_user', 'USER', '你是谁？', '2026-04-17 17:22:38.726017', '2026-04-17 17:22:38.726017');
INSERT INTO chat_history VALUES (242, 'default_user', 'ASSISTANT', '我是字节跳动开发的人工智能助手豆包，很高兴能为你提供帮助~无论是解答问题、聊天交流，还是需要生活建议、知识科普，都可以随时和我说哦！', '2026-04-17 17:22:38.731604', '2026-04-17 17:22:38.731604');
INSERT INTO chat_history VALUES (243, 'default_user', 'USER', '我面试紧张怎么办（简短回答）', '2026-04-17 23:42:51.913974', '2026-04-17 23:42:51.913974');
INSERT INTO chat_history VALUES (244, 'default_user', 'ASSISTANT', '1. 提前模拟面试，熟悉流程和问题；2. 面试前深呼吸3-5次，调整节奏；3. 把面试官当成平等交流的人，减少压迫感；4. 专注于回答内容，而非自己的紧张情绪。', '2026-04-17 23:42:51.963519', '2026-04-17 23:42:51.963519');
INSERT INTO chat_history VALUES (245, 'default_user', 'USER', '我面试紧张怎么办（简短回答）', '2026-04-17 23:44:57.528747', '2026-04-17 23:44:57.528747');
INSERT INTO chat_history VALUES (246, 'default_user', 'ASSISTANT', '1. 提前模拟：对着镜子或找朋友演练面试场景，熟悉流程和话术；  \n2. 呼吸调节：紧张时缓慢深呼吸（4秒吸气+6秒呼气），平复心率；  \n3. 心态转换：把面试当成"双向沟通"，你也在评估公司是否适合自己；  \n4. 聚焦问题：专注于回答当前问题，别想"没答好怎么办"，减少杂念。  \n\n简单实用，亲测有效～', '2026-04-17 23:44:57.528747', '2026-04-17 23:44:57.528747');

-- ----------------------------
-- Table structure for company_profiles
-- ----------------------------
DROP TABLE IF EXISTS company_profiles CASCADE;

CREATE TABLE company_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    company_code VARCHAR(50),
    company_size VARCHAR(50),
    industry VARCHAR(100),
    address VARCHAR(500),
    website VARCHAR(200),
    contact_person VARCHAR(100),
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);

INSERT INTO company_profiles VALUES (1, 3, NULL, NULL, NULL, NULL, NULL, NULL, '2025-07-20 15:04:47.729230', '2025-07-20 15:04:47.729230');

-- ----------------------------
-- Table structure for school_profiles
-- ----------------------------
DROP TABLE IF EXISTS school_profiles CASCADE;

CREATE TABLE school_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    school_name VARCHAR(200),
    education_level VARCHAR(50),
    major VARCHAR(100),
    enrollment_year INT,
    graduation_year INT,
    gpa DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);

-- ----------------------------
-- Table structure for student_profiles
-- ----------------------------
DROP TABLE IF EXISTS student_profiles CASCADE;

CREATE TABLE student_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    real_name VARCHAR(100),
    gender VARCHAR(10),
    birth_date DATE,
    phone VARCHAR(20),
    address VARCHAR(500),
    skills TEXT,
    certificates TEXT,
    projects TEXT,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);

-- ----------------------------
-- Table structure for user_favorites
-- ----------------------------
DROP TABLE IF EXISTS user_favorites CASCADE;

CREATE TABLE user_favorites (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    favorite_type VARCHAR(50) NOT NULL,
    target_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Table structure for job_postings
-- ----------------------------
DROP TABLE IF EXISTS job_postings CASCADE;

CREATE TABLE job_postings (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    company_name VARCHAR(200) NOT NULL,
    company_id BIGINT NOT NULL,
    department VARCHAR(100),
    location VARCHAR(200),
    job_type VARCHAR(50),
    salary_min INT,
    salary_max INT,
    salary_unit VARCHAR(20) DEFAULT '月薪',
    experience_required VARCHAR(50),
    education_required VARCHAR(50),
    description TEXT,
    requirements TEXT,
    benefits TEXT,
    skills VARCHAR(500),
    tags VARCHAR(500),
    contact_person VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    priority_level INT DEFAULT 3,
    view_count INT DEFAULT 0,
    application_count INT DEFAULT 0,
    deadline TIMESTAMP,
    is_urgent BOOLEAN DEFAULT FALSE,
    is_remote_work BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

INSERT INTO job_postings VALUES (3, '产品经理', '美团', 3, '产品部', '北京', '全职', 10, 25, '月薪', '1-3年', '本科', '负责产品规划和设计，协调各部门推进产品开发', '产品设计经验,用户体验设计,数据分析能力', '', '', '', '', '', '', 'active', 4, 1, 1, '2025-09-17 19:34:55', FALSE, FALSE, '2025-07-19 19:34:55', '2025-08-10 23:44:19', '2025-07-19 19:34:55');
INSERT INTO job_postings VALUES (22, '前端工程师', '商汤科技', 3, '技术部', '广州', '全职', 6, 16, '月薪', '应届生', '本科及以上', '写前端', '会写前端', NULL, '', '', NULL, NULL, NULL, 'active', 3, 0, 1, NULL, FALSE, FALSE, '2025-07-22 13:58:02', '2026-04-18 14:23:26', '2025-07-22 13:58:02');
INSERT INTO job_postings VALUES (23, '全栈工程师', '科大讯飞', 3, '技术部', '广州', '全职', 8, 24, '月薪', '应届生', '本科及以上', '全栈', '全栈', NULL, '', '', NULL, NULL, NULL, 'active', 3, 0, 1, NULL, FALSE, FALSE, '2025-07-22 14:02:02', '2026-04-18 14:23:42', '2025-07-22 14:02:02');
INSERT INTO job_postings VALUES (54, '算法工程师', '京东', 3, '技术部', '广州', '全职', 10, 20, '月薪', '应届生', '本科及以上', '算法工程师', '算法工程师', NULL, '', '', NULL, NULL, NULL, 'active', 3, 0, 0, NULL, FALSE, FALSE, '2025-08-11 01:06:46', '2026-04-18 14:23:47', '2025-08-11 01:06:46');
INSERT INTO job_postings VALUES (66, '云计算工程师', '百度', 3, '技术部', '广州', '全职', 15, 25, '月薪', '应届生', '本科及以上', '云计算工程师', '云计算工程师', NULL, '', '', NULL, NULL, NULL, 'active', 3, 1, 1, NULL, FALSE, FALSE, '2025-09-19 15:47:57', '2026-04-18 14:23:52', '2025-09-19 15:47:57');
INSERT INTO job_postings VALUES (67, '后端开发工程师', '腾讯科技', 3, '技术部', '深圳', '全职', 8, 20, '月薪', '应届生', '本科及以上', '写后端代码', '会写后端代码', NULL, '', '', NULL, NULL, NULL, 'active', 3, 0, 1, NULL, FALSE, FALSE, '2025-12-02 17:09:17', '2026-04-18 14:23:56', '2025-12-02 17:09:17');
INSERT INTO job_postings VALUES (72, '网络安全工程师', '测试', 3, '技术部', '东莞', '全职', 10, 20, '月薪', '应届生', '硕士及以上', '写代码', '写代码', NULL, '', '', NULL, NULL, NULL, 'active', 3, 0, 1, NULL, FALSE, FALSE, '2026-04-18 15:36:15', '2026-04-18 17:07:23', '2026-04-18 15:36:15');
INSERT INTO job_postings VALUES (73, 'Agent工程师', '测试', 3, '技术部', '广州', '全职', 10, 20, '月薪', '应届生', '本科及以上', '本科及以上学历，计算机科学、人工智能、软件工程、电子信息等相关专业，优秀本科生可放宽学历要求，有丰富Agent相关项目经验或硕士及以上学历且有NLP、多模态、强化学习等相关研究背景、发表过相关顶会论文者优先；需精通Python，熟悉Java/Go/TypeScript中至少一门语言，具备扎实的编程能力与系统设计能力，深入理解Agent核心原理，熟练使用至少一种主流Agent开发框架，理解LLM工作原理，掌握Prompt工程、Function Calling技巧，具备模型微调经验，熟悉容器化部署工具与服务开发框架，了解AI安全与合规相关要求；拥有1-3年及以上AI相关开发经验，至少1年Agent或LLM应用系统生产开发经验，有完整Agent项目从0到1落地、特定业务场景Agent落地或大规模Agent系统部署经验者优先；具备较强的问题解决能力、跨团队协作能力、持续学习意识及抗压能力，有良好的代码规范与文档编写习惯；深入理解Agent框架局限性、有相关特定Agent实践经验或在技术社区有开源项目、持有相关AI工程师认证者为加分项。', 'Agent工程师核心负责智能代理（AI Agent）系统的设计、开发、优化与落地，聚焦于让大语言模型（LLM）具备自主决策、任务规划、工具调用及多主体协作能力，将AI技术转化为可落地的业务解决方案，兼顾系统稳定性、安全性与工程化落地效率，推动Agent技术在实际业务场景中产生价值。', NULL, '', '', NULL, NULL, NULL, 'active', 3, 0, 1, NULL, FALSE, FALSE, '2026-04-18 17:13:53', '2026-04-18 17:14:12', '2026-04-18 17:13:53');

-- ----------------------------
-- Table structure for job_applications
-- ----------------------------
DROP TABLE IF EXISTS job_applications CASCADE;

CREATE TABLE job_applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    job_posting_id BIGINT NOT NULL,
    cover_letter TEXT,
    resume_content TEXT,
    status VARCHAR(20),
    notes TEXT,
    applied_at TIMESTAMP DEFAULT NULL,
    reviewed_at TIMESTAMP DEFAULT NULL,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);

INSERT INTO job_applications VALUES (3, 1, 3, '尊敬的HR，我是一名优秀的求职者，具备相关技能和经验，期待与您进一步沟通。', '我对产品经理职位非常感兴趣，希望能够加入字节跳动团队。', 'rejected', '申请不符合要求', '2025-07-20 14:48:03.779696', '2025-07-21 19:04:29.575845', '2025-07-20 14:48:03.779696', '2025-07-21 19:04:29.575845');
INSERT INTO job_applications VALUES (25, 1, 22, '尊敬的HR，我是一名优秀的求职者，具备相关技能和经验，期待与您进一步沟通。', '我对前端工程师岗位非常感兴趣，希望能够加入zs团队。', 'rejected', '申请不符合要求', '2025-07-22 19:14:38.001838', '2025-07-22 19:21:13.472022', '2025-07-22 19:14:38.001838', '2025-07-22 19:21:13.473632');
INSERT INTO job_applications VALUES (27, 1, 23, '尊敬的HR，我是一名优秀的求职者，具备相关技能和经验，期待与您进一步沟通。', '我对全栈工程师岗位非常感兴趣，希望能够加入zs团队。', 'rejected', '申请不符合要求', '2025-07-23 11:43:03.354663', '2025-07-23 11:43:03.355935', '2025-07-23 11:43:03.355935', '2025-09-19 09:53:03.628659');
INSERT INTO job_applications VALUES (60, 1, 66, '尊敬的HR，我是一名优秀的求职者，具备相关技能和经验，期待与您进一步沟通。', '我对云计算工程师岗位非常感兴趣，希望能够加入zs团队。', 'pending', NULL, '2025-09-28 16:48:10.435239', NULL, '2025-09-28 16:48:10.436860', '2025-09-28 16:48:10.436860');
INSERT INTO job_applications VALUES (61, 1, 67, '尊敬的HR，我是一名优秀的求职者，具备相关技能和经验，期待与您进一步沟通。', '我对后端开发工程师岗位非常感兴趣，希望能够加入zs团队。', 'accepted', '申请通过', '2025-12-02 17:37:48.777480', '2026-04-18 17:14:45.094620', '2025-12-02 17:37:48.789202', '2026-04-18 17:14:45.095637');
INSERT INTO job_applications VALUES (63, 1, 72, '尊敬的HR，我是一名优秀的求职者，具备相关技能和经验，期待与您进一步沟通。', '我对网络安全工程师岗位非常感兴趣，希望能够加入测试团队。', 'rejected', '申请不符合要求', '2026-04-18 17:07:23.306158', '2026-04-18 17:14:41.347477', '2026-04-18 17:07:23.308030', '2026-04-18 17:14:41.347477');
INSERT INTO job_applications VALUES (64, 1, 73, '尊敬的HR，我是一名优秀的求职者，具备相关技能和经验，期待与您进一步沟通。', '我对Agent工程师岗位非常感兴趣，希望能够加入测试团队。', 'accepted', '申请通过', '2026-04-18 17:14:11.961212', '2026-04-18 17:14:39.814341', '2026-04-18 17:14:11.961212', '2026-04-18 17:14:39.815929');

-- ----------------------------
-- Table structure for video_analysis
-- ----------------------------
DROP TABLE IF EXISTS video_analysis CASCADE;

CREATE TABLE video_analysis (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    video_url VARCHAR(255),
    interview_type VARCHAR(255),
    duration INT,
    analysis_result TEXT,
    facial_expression TEXT,
    voice_analysis TEXT,
    eye_contact_score INT,
    overall_score INT,
    status VARCHAR(255),
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);

-- ----------------------------
-- Table structure for emotion_data
-- ----------------------------
DROP TABLE IF EXISTS emotion_data CASCADE;

CREATE TABLE emotion_data (
    id BIGSERIAL PRIMARY KEY,
    video_analysis_id BIGINT,
    emotion VARCHAR(255),
    confidence DOUBLE PRECISION,
    timestamp DOUBLE PRECISION
);

-- ----------------------------
-- Table structure for interview_records
-- ----------------------------
DROP TABLE IF EXISTS interview_records CASCADE;

CREATE TABLE interview_records (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    video_analysis_id BIGINT,
    video_url VARCHAR(255),
    interview_type VARCHAR(255),
    interviewer VARCHAR(255),
    company VARCHAR(255),
    position VARCHAR(255),
    duration INT,
    status VARCHAR(255),
    overall_score INT,
    strengths TEXT,
    weaknesses TEXT,
    improvements TEXT,
    recommendations TEXT,
    feedback TEXT,
    analysis_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);

-- Full data for interview_records
INSERT INTO interview_records VALUES (13, 1, NULL, 'uploads\videos\1753124139688_interview_interview-recording.webm', 'HR面试', 'AI智能面试官', '智能面试系统', '产品经理', 3, '已完成', 87, '["参与度很高，表现出强烈的面试积极性","整体表现优异，各方面能力均衡","沟通表达能力突出"]', NULL, '["继续保持良好状态，注意细节优化"]', '["继续保持优秀状态，可以在细节表达上追求完美","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1753124142765', '2025-07-22 02:55:42.789361', '2025-07-22 02:55:42.789361');
INSERT INTO interview_records VALUES (14, 1, NULL, 'uploads\videos\1753157453437_interview_interview-recording.webm', '技术面试', 'AI智能面试官', '智能面试系统', 'Java开发工程师', 2, '已完成', 93, '["参与度很高，表现出强烈的面试积极性","注意力集中，思路清晰有条理","整体表现优异，各方面能力均衡","沟通表达能力突出"]', NULL, '["继续保持良好状态，注意细节优化"]', '["继续保持优秀状态，可以在细节表达上追求完美","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1753157456581', '2025-07-22 12:10:56.595185', '2025-07-22 12:10:56.595185');
INSERT INTO interview_records VALUES (15, 1, NULL, 'uploads\videos\1753168678795_interview_interview-recording.webm', '技术面试', 'AI智能面试官', '智能面试系统', '数据分析师', 2, '已完成', 88, '["参与度很高，表现出强烈的面试积极性","注意力集中，思路清晰有条理","整体表现优异，各方面能力均衡","沟通表达能力突出"]', NULL, '["继续保持良好状态，注意细节优化"]', '["继续保持优秀状态，可以在细节表达上追求完美","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1753168681872', '2025-07-22 15:18:01.910993', '2025-07-22 15:18:01.911621');
INSERT INTO interview_records VALUES (79, 1, NULL, 'uploads\videos\1763793991611_interview_pYOs5U8EJlrqbe25abc8c9e3aaa110b001fb4312906c.webm', '综合面试', 'AI智能面试官', '智能面试系统', 'UI设计师', 1, '已完成', 95, '["参与度很高，表现出强烈的面试积极性","表达真诚自然，给人可信赖的印象","注意力集中，思路清晰有条理","沟通表达能力突出"]', NULL, '["保持与面试官的眼神交流，适当点头回应展示专注","准备更详细的回答，避免过于简短的回应","继续保持优秀状态，可以在细节表达上追求完美"]', '["继续保持优秀状态，可以在细节表达上追求完美","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1763793994835', '2025-11-22 14:46:34.876678', '2025-11-22 14:46:34.876678');
INSERT INTO interview_records VALUES (80, 1, NULL, 'uploads\videos\1763794200440_interview_0reuZFoRbG4M722fcce1ea342d224cab2192d1dc7328.webm', '技术面试', 'AI智能面试官', '智能面试系统', 'Java开发工程师', 2, '已完成', 88, '["参与度很高，表现出强烈的面试积极性","注意力集中，思路清晰有条理","整体表现优异，各方面能力均衡","沟通表达能力突出"]', NULL, '["继续保持良好状态，注意细节优化"]', '["继续保持优秀状态，可以在细节表达上追求完美","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1763794203577', '2025-11-22 14:50:03.582658', '2025-11-22 14:50:03.582658');
INSERT INTO interview_records VALUES (81, 1, NULL, 'uploads\videos\1763794572547_interview_g5Ieehmv5Jqz7586810b1b9edfd2cb9f1978f2280469.webm', 'HR面试', 'AI智能面试官', '智能面试系统', 'Java开发工程师', 5, '已完成', 68, '["参与度很高，表现出强烈的面试积极性"]', NULL, '["建议多进行模拟面试练习","可以准备更多具体的工作经历例子"]', '["练习用简洁明了的语言表达观点，避免冗长回答","建议进行系统性的面试培训，提升整体面试技巧","多参加模拟面试，在实践中积累经验和信心"]', '基于AI分析的综合评估报告', '/analysis/1763794575661', '2025-11-22 14:56:15.668550', '2025-11-22 14:56:15.668550');
INSERT INTO interview_records VALUES (82, 1, NULL, 'uploads\videos\1766042285779_interview_interview-recording.webm', '技术面试', 'AI智能面试官', '智能面试系统', '产品经理', 3, '已完成', 79, '["参与度很高，表现出强烈的面试积极性","注意力集中，思路清晰有条理"]', NULL, '["细节表现还有提升空间"]', '["保持与面试官的眼神交流，适当点头回应展示专注","整体表现良好，建议针对薄弱环节进行专项练习","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1766042288894', '2025-12-18 15:18:08.908473', '2025-12-18 15:18:08.908473');
INSERT INTO interview_records VALUES (83, 1, NULL, 'uploads\videos\1773323182292_interview_interview-recording.webm', '综合面试', 'AI智能面试官', '智能面试系统', 'Java开发工程师', 4, '已完成', 63, '["参与度很高，表现出强烈的面试积极性"]', NULL, '["建议多进行模拟面试练习","可以准备更多具体的工作经历例子"]', '["练习用简洁明了的语言表达观点，避免冗长回答","建议进行系统性的面试培训，提升整体面试技巧","多参加模拟面试，在实践中积累经验和信心"]', '基于AI分析的综合评估报告', '/analysis/1773323185464', '2026-03-12 21:46:25.479075', '2026-03-12 21:46:25.479075');
INSERT INTO interview_records VALUES (84, 1, NULL, 'uploads\videos\1776174561096_interview_45f7328ab14b00277220a28863ec851c.mp4', '综合面试', 'AI智能面试官', '智能面试系统', 'UI设计师', 1, '已完成', 85, '["参与度很高，表现出强烈的面试积极性","注意力集中，思路清晰有条理","整体表现优异，各方面能力均衡","沟通表达能力突出"]', NULL, '["继续保持良好状态，注意细节优化"]', '["保持与面试官的眼神交流，适当点头回应展示专注","准备更详细的回答，避免过于简短的回应","继续保持优秀状态，可以在细节表达上追求完美"]', '基于AI分析的综合评估报告', '/analysis/1776174564288', '2026-04-14 21:49:24.651051', '2026-04-14 21:49:24.651051');
INSERT INTO interview_records VALUES (85, 1, NULL, 'uploads\videos\1776174599350_interview_interview-recording.webm', '技术面试', 'AI智能面试官', '智能面试系统', '产品经理', 3, '已完成', 88, '["参与度很高，表现出强烈的面试积极性","整体表现优异，各方面能力均衡","沟通表达能力突出"]', NULL, '["继续保持良好状态，注意细节优化"]', '["继续保持优秀状态，可以在细节表达上追求完美","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1776174602413', '2026-04-14 21:50:02.418271', '2026-04-14 21:50:02.418271');
INSERT INTO interview_records VALUES (86, 1, NULL, 'uploads\videos\1776174658988_interview_interview-recording.webm', '综合面试', 'AI智能面试官', '智能面试系统', '前端开发工程师', 4, '已完成', 64, '["参与度很高，表现出强烈的面试积极性"]', NULL, '["建议多进行模拟面试练习","可以准备更多具体的工作经历例子"]', '["练习用简洁明了的语言表达观点，避免冗长回答","建议进行系统性的面试培训，提升整体面试技巧","多参加模拟面试，在实践中积累经验和信心"]', '基于AI分析的综合评估报告', '/analysis/1776174662072', '2026-04-14 21:51:02.078566', '2026-04-14 21:51:02.078566');
INSERT INTO interview_records VALUES (87, 1, NULL, 'uploads\videos\1776440887027_interview_视频.mp4', '技术面试', 'AI智能面试官', '智能面试系统', '前端开发工程师', 3, '已完成', 92, '["参与度很高，表现出强烈的面试积极性","整体表现优异，各方面能力均衡","沟通表达能力突出"]', NULL, '["继续保持良好状态，注意细节优化"]', '["保持与面试官的眼神交流，适当点头回应展示专注","继续保持优秀状态，可以在细节表达上追求完美","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1776440890277', '2026-04-17 23:48:10.288233', '2026-04-17 23:48:10.288233');
INSERT INTO interview_records VALUES (88, 1, NULL, 'uploads\videos\1776503386087_interview_视频.mp4', 'HR面试', 'AI智能面试官', '智能面试系统', '数据分析师', 3, '已完成', 62, '["参与度很高，表现出强烈的面试积极性"]', NULL, '["建议多进行模拟面试练习","可以准备更多具体的工作经历例子"]', '["建议进行系统性的面试培训，提升整体面试技巧","多参加模拟面试，在实践中积累经验和信心","面试前充分了解岗位要求，准备匹配的技能展示","保持积极的心态，将面试视为双向选择的机会"]', '基于AI分析的综合评估报告', '/analysis/1776503389384', '2026-04-18 17:09:49.423060', '2026-04-18 17:09:49.423060');

-- ----------------------------
-- Table structure for learning_resources
-- ----------------------------
DROP TABLE IF EXISTS learning_resources CASCADE;

CREATE TABLE learning_resources (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100),
    category VARCHAR(100),
    resource_type VARCHAR(50),
    description TEXT,
    url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    duration INT,
    difficulty_level VARCHAR(20),
    is_free BOOLEAN,
    price DOUBLE PRECISION,
    rating DOUBLE PRECISION,
    tags VARCHAR(500),
    status VARCHAR(20),
    view_count INT,
    created_at TIMESTAMP DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT NULL
);

INSERT INTO learning_resources VALUES (28, '面试技巧全攻略 - 尚硅谷', '尚硅谷', '面试技巧', 'video', '从简历制作到面试表现的完整指导', 'https://www.bilibili.com/video/BV1yE411h7bH', NULL, 180, 'beginner', TRUE, 0, 4.8, '面试技巧,求职,职场', 'active', 125000, '2025-07-18 20:10:47.000000', '2025-07-18 20:10:47.000000');

-- ----------------------------
-- Table structure for resource_recommendations
-- ----------------------------
DROP TABLE IF EXISTS resource_recommendations CASCADE;

CREATE TABLE resource_recommendations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    resource_id BIGINT NOT NULL,
    score DOUBLE PRECISION,
    reason TEXT,
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------
-- Create indexes
-- ----------------------------
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_job_postings_status ON job_postings(status);
CREATE INDEX idx_job_postings_location ON job_postings(location);
CREATE INDEX idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX idx_job_applications_job_posting_id ON job_applications(job_posting_id);
CREATE INDEX idx_learning_resources_category ON learning_resources(category);
CREATE INDEX idx_resource_recommendations_user_id ON resource_recommendations(user_id);
