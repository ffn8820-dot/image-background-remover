# Image Background Remover - MVP 需求文档

## 项目概述

**产品定位：** 在线图片去背景工具  
**核心价值：** 快速、简单、无需注册即可使用  
**技术栈：** Cloudflare Pages + Remove.bg API + 纯内存处理（无存储）

---

## 功能需求

### 1. 核心功能

#### 1.1 图片上传
- 支持拖拽上传 / 点击选择文件
- 支持格式：JPG, PNG, WEBP
- 单次上传限制：10MB
- 前端校验：文件类型、大小
- 上传后立即在内存中处理，不落盘

#### 1.2 去背景处理
- 调用 Remove.bg API 处理图片
- 显示处理进度提示（loading 状态）
- 处理失败时显示友好错误提示
- API 调用通过 Cloudflare Workers 中转（隐藏 API Key）

#### 1.3 结果展示
- 左右对比视图：原图 | 去背景后
- 支持拖动滑块对比
- 显示处理耗时

#### 1.4 下载结果
- 一键下载 PNG 格式（透明背景）
- 文件名格式：`removed-bg-{timestamp}.png`
- 下载后自动清理内存中的图片数据

### 2. 辅助功能

#### 2.1 使用说明
- 首页简短说明（3 步：上传 → 处理 → 下载）
- 支持的格式和大小限制提示

#### 2.2 错误处理
- 文件过大提示
- 格式不支持提示
- API 调用失败提示（含重试按钮）
- 网络错误提示

---

## 技术架构

### 前端
- **框架：** Next.js (App Router) 或 Vite + React
- **UI 库：** Tailwind CSS + shadcn/ui
- **上传组件：** react-dropzone
- **对比组件：** react-compare-image 或自定义 slider

### 后端
- **部署：** Cloudflare Pages + Workers
- **API 中转：** Cloudflare Workers Function
  - 接收前端上传的图片（Base64 或 FormData）
  - 调用 Remove.bg API
  - 返回处理后的图片（Base64 或 Blob URL）
  - 全程内存处理，不写入 KV/R2

### API 集成
- **服务商：** Remove.bg
- **调用方式：** 
  - 前端 → Cloudflare Workers → Remove.bg API
  - Workers 中存储 API Key（环境变量）
- **限流策略：** 
  - 前端限制：同一用户 10 秒内最多 1 次请求
  - 后端限流：根据 Remove.bg 配额管理

---

## 页面结构

### 首页（唯一页面）

```
┌─────────────────────────────────────┐
│         Image BG Remover            │  ← Header
├─────────────────────────────────────┤
│                                     │
│   [拖拽上传区域 / 点击选择文件]      │  ← Upload Zone
│                                     │
│   支持 JPG, PNG, WEBP (最大 10MB)   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│   [原图 | 去背景后] ← 对比视图       │  ← Result (上传后显示)
│                                     │
│   [下载 PNG]                        │  ← Download Button
│                                     │
└─────────────────────────────────────┘
```

---

## 数据流

1. **用户上传图片** → 前端读取为 Base64 / Blob
2. **前端发送请求** → Cloudflare Workers (`/api/remove-bg`)
3. **Workers 调用 Remove.bg API** → 传递图片数据
4. **Remove.bg 返回结果** → Workers 转发给前端
5. **前端展示结果** → 内存中渲染，用户可下载
6. **用户下载 / 关闭页面** → 自动清理内存数据

**关键点：** 全程无存储，图片仅存在于内存和网络传输中。

---

## 非功能需求

### 性能
- 首屏加载 < 2s
- 图片处理响应 < 5s（取决于 Remove.bg API）
- 支持并发处理（多用户同时使用）

### 安全
- API Key 存储在 Cloudflare Workers 环境变量
- 前端不暴露 API Key
- 不记录用户上传的图片内容
- HTTPS 强制加密传输

### 可用性
- 移动端适配（响应式设计）
- 支持主流浏览器（Chrome, Safari, Firefox, Edge）
- 无需注册登录

---

## MVP 范围外（后续迭代）

- 批量处理
- 自定义背景颜色 / 图片
- 用户账户系统
- 历史记录
- 高级编辑功能（裁剪、调整）
- 付费套餐

---

## 开发计划

### Phase 1: 基础功能（1-2 天）
- [ ] 搭建 Next.js 项目 + Tailwind CSS
- [ ] 实现上传组件（拖拽 + 选择文件）
- [ ] 创建 Cloudflare Workers API 端点
- [ ] 集成 Remove.bg API

### Phase 2: 结果展示（1 天）
- [ ] 实现对比视图（原图 vs 去背景）
- [ ] 添加下载功能
- [ ] 错误处理和 loading 状态

### Phase 3: 优化和部署（1 天）
- [ ] 移动端适配
- [ ] 性能优化（图片压缩、懒加载）
- [ ] 部署到 Cloudflare Pages
- [ ] 配置环境变量（API Key）

---

## 成本估算

- **Remove.bg API：** 
  - 免费额度：50 次/月
  - 付费：$0.20/张起（根据分辨率）
- **Cloudflare Pages：** 免费（每月 500 次构建）
- **Cloudflare Workers：** 免费（每天 100,000 次请求）

**MVP 阶段成本：** 基本为 0（使用免费额度）

---

## 成功指标

- 用户能在 10 秒内完成一次去背景操作
- 处理成功率 > 95%
- 移动端可正常使用
- 无明显性能瓶颈

---

**文档版本：** v1.0  
**创建日期：** 2026-03-17  
**负责人：** F1001
