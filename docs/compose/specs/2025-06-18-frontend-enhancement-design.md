# 前端 UI 增强设计方案

> 关联计划：`docs/compose/plans/YYYY-MM-DD-frontend-enhancement.md`

**目标：** 在现有 Ant Design 5 + pro-components 基础上，增加数据可视化、动态交互和视觉美化。

**架构：** 新增 `@ant-design/charts` 依赖，对 Dashboard、AuditResult、Layout 三个模块做结构性增强。每个模块独立改造，互不依赖。

**技术栈：** React 18, Ant Design 5, @ant-design/pro-components, @ant-design/charts, dayjs

---

## [S1] 新增依赖

在 `frontend/package.json` 新增：

```json
"@ant-design/charts": "^2.1.0"
```

@ant-design/charts 基于 G2，提供 Pie/Bar/Progress/Ring 等统计图表，与 antd 风格统一。

---

## [S2] 工作台 Dashboard 增强

### [S2.1] 统计卡片动态数字

将 4 个 `Statistic` 卡片改为 Ant Design 的 `Statistic` 组件带 `valueStyle` + 数字递增动画（通过 `useEffect` + `requestAnimationFrame` 实现）。

### [S2.2] 风险分布饼图

在统计卡片下方新增一行，包含：
- 左侧：饼图（Pie Chart）展示高/中/低风险占比
- 右侧：审核状态分布柱状图（Bar Chart）展示 completed/failed/in_progress 数量

### [S2.3] 审核记录表格增强

现有表格新增列：审核耗时（completed_at - created_at）、风险等级改为彩色进度条（Progress）。

### 文件

- 修改：`frontend/src/pages/Dashboard.tsx`

---

## [S3] 审核报告页 AuditResult 增强

### [S3.1] 风险概览卡片

顶部增加 `ProCard` 的 `StatisticCard` 类型：
- 差异总数、高/中/低风险数量
- 每个带对应颜色和图标
- 环形进度图表示高中低占比

### [S3.2] 差异对比视图

差异表格的行展开内容改为左右对比卡片：
- 左侧：模板内容（蓝底）
- 右侧：项目内容（绿底）
- 描述和建议在下方

### [S3.3] 报告导出增强

- 保留 TXT 下载
- 新增"复制报告到剪贴板"按钮
- 报告预览区增加语法高亮（关键字着色：高/中/低风险用对应颜色）

### [S3.4] 返回按钮优化

使用 `Breadcrumb` 替代普通按钮

### 文件

- 修改：`frontend/src/pages/AuditResult.tsx`

---

## [S4] 全局交互体验

### [S4.1] 骨架屏加载

- Dashboard 统计卡片区域：`Skeleton` + `Skeleton.Input` 占位
- 审核报告页：`Skeleton` 段落占位
- 表格加载：使用 Table 的 `loading` 属性（已有）

### [S4.2] 页面过渡

在 `MainLayout` 的 `<Content>` 区域增加淡入动画（CSS `@keyframes`），路由切换时触发。

### [S4.3] 审核进度提示

在 Audit 页面的审核等待区增加：
- `Steps` 组件展示审核阶段（解析文档 → 对比分析 → 合规检查 → 生成报告）
- 当前阶段闪烁动画

### [S4.4] 通知动效

登录成功后使用 antd `notification` 替代 `message`，增加欢迎信息。

### 文件

- 修改：`frontend/src/components/Layout.tsx`
- 修改：`frontend/src/pages/Login.tsx`
- 修改：`frontend/src/pages/Audit.tsx`

---

## [S5] 验证标准

1. `npm run build` 编译成功，无新增 TS 错误
2. 所有页面正常渲染，图表数据正确
3. 骨架屏在数据加载前显示，数据到达后自动切换
4. 数字动画完成且不卡顿

---

## [S6] 不做的内容

- 不引入重型图表库（ECharts）
- 不做暗色模式（需全局主题改造）
- 不做 PDF 在线预览（需 pdf.js，太重）
- 不改造模板/项目管理页面（留到后续）
