# 智能考试系统 · 前端

> 在线考试平台前端，基于 Vue 3 + Vite + TypeScript 构建，支持 **AI 出题**、**AI 批阅**、试卷管理、在线答题、视频学习与排行榜等功能。

配套后端仓库：[exam-system](https://github.com/ziyi28/exam-system)

---

## 技术栈

| 类别 | 技术 | 版本 |
| --- | --- | --- |
| 框架 | Vue | ^3.5.13 |
| 构建工具 | Vite | ^8.0.4 |
| 语言 | TypeScript | ~6.0.2 |
| UI 组件库 | Element Plus | ^2.13.7 |
| 状态管理 | Pinia | ^3.0.4 |
| 路由 | Vue Router | ^4.6.4 |
| HTTP | Axios | ^1.15.0 |
| 图表 | ECharts | ^6.0.0 |
| 图标 | @element-plus/icons-vue | ^2.3.2 |

---

## 功能模块

### 管理端（`/admin`，角色：ADMIN / TEACHER）

- **仪表盘** — 数据概览与可视化（ECharts）
- **题库管理** — 题目增删改查、批量导入、**AI 自动出题**
- **分类管理** — 题目 / 视频分类维护
- **试卷管理** — 手动组卷 / 自动组卷、试卷详情预览
- **考试记录** — 全员考试记录查看、**AI 批阅**结果与详情
- **公告管理 / 轮播图管理** — 运营内容维护
- **视频管理 / 视频分类** — 学习视频上传与分类
- **用户管理** — 仅 ADMIN 可见，账号与角色管理

### 学生端（`/student`，角色：STUDENT / ADMIN / TEACHER）

- **首页** — 公告、轮播图、推荐内容
- **在线考试** — 考试列表、参加考试、答题卡、提交
- **我的成绩** — 历史考试记录与答卷回顾
- **排行榜** — 全站 / 分类排行
- **视频学习** — 视频分类浏览、播放器

### 公共

- **登录** — 统一登录入口（`/login`）
- **个人中心** — 资料查看与修改

---

## 环境要求

- **Node.js** ≥ 20.19（或 ≥ 22.12）— Vite 8 要求
- **npm** ≥ 10
- **后端服务** 启动并监听 `http://localhost:8080`

---

## 快速开始

```bash
# 1. 克隆仓库
git clone https://github.com/ziyi28/exam-system-ui.git
cd exam-system-ui

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

浏览器访问 [http://localhost:5173](http://localhost:5173) 即可。

构建生产包：

```bash
npm run build      # 输出到 dist/
npm run preview    # 本地预览生产包
```

类型检查：

```bash
npm run typecheck
```

---

## 后端依赖

前端通过 Vite Proxy 将以下路径转发到后端：

| 前端路径 | 转发目标 | 用途 |
| --- | --- | --- |
| `/api/*` | `http://localhost:8080` | 业务接口 |
| `/files/*` | `http://localhost:8080` | MinIO 文件（图片 / 视频） |

如需修改后端地址，请编辑 [`vite.config.ts`](./vite.config.ts) 中的 `server.proxy` 配置。

> ⚠️ 启动前端前请确保后端服务已运行，否则接口请求会失败。详见后端仓库：[exam-system](https://github.com/ziyi28/exam-system)

业务返回结构统一为 `{ code, message, data }`：

- `code === 200`：成功，`data` 即为业务数据
- `code === 401`：未登录或登录已过期，前端会自动跳转登录页
- 其他：弹出错误提示

---

## 项目结构

```
src/
├── api/          # 接口封装（每个领域一个文件，统一通过 request.ts）
├── layouts/      # 布局组件（AdminLayout / StudentLayout）
├── router/       # 路由 + 角色守卫
├── stores/       # Pinia 状态（user 等）
├── styles/       # 全局样式
├── types/        # TypeScript 类型定义（含 Result 业务结构）
├── utils/        # 工具方法
├── views/        # 页面
│   ├── admin/    # 管理端页面（按业务分子目录）
│   ├── student/  # 学生端页面
│   ├── common/   # 公共页面（个人中心等）
│   └── login/    # 登录页
├── App.vue
├── main.ts
└── env.d.ts
```

路径别名 `@` → `src/`。

---

## 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器（默认 5173 端口） |
| `npm run build` | 生产构建，输出至 `dist/` |
| `npm run preview` | 本地预览生产构建产物 |
| `npm run typecheck` | 运行 `vue-tsc` 进行 TypeScript 类型检查 |

---

## 角色与路由

系统基于 `meta.roles` 实现路由级权限控制：

| 角色 | 默认入口 | 主要范围 |
| --- | --- | --- |
| `ADMIN` | `/admin/dashboard` | 管理端全部 + 学生端 |
| `TEACHER` | `/admin/dashboard` | 管理端（除用户管理外）+ 学生端 |
| `STUDENT` | `/student/home` | 学生端 |

未登录访问任何受保护路由都会被重定向到 `/login`，并在登录后跳回原页面。

---

## 浏览器兼容

推荐使用现代浏览器的最新两个主版本：

- Chrome / Edge ≥ 110
- Firefox ≥ 110
- Safari ≥ 16

---

## 许可

本仓库为个人 / 团队项目，当前未声明开源许可证，如需复用请与作者联系。