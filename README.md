# 智能报修小助手（smart-repair）

练习四「协作开发之 AI 版」交付项目：报修表单、列表 / 详情、状态流转、状态筛选、AI 排查建议生成与持久保存。

## 技术栈
- 前端：静态页面 + Tailwind CDN
- 后端：Vercel Node 函数（`api/` 目录）
- 数据库：Supabase（`repairs`、`repair_suggestions`）
- AI：火山方舟豆包（OpenAI 兼容协议，服务端调用）

## 本地运行
```bash
npm install
cp .env.example .env   # 填入 Supabase 与 AI 密钥
npm run dev             # http://localhost:3100
```

## 测试账号（由 TEST_USERS 环境变量配置）
| 账号 | 密码 | 说明 |
|---|---|---|
| studentA | repair2026A | A 同学 |
| studentB | repair2026B | B 同学 |

## 目录说明
- `index.html`：页面与交互
- `api/_lib/`：会话鉴权、Supabase 客户端、AI 调用、HTTP 工具
- `api/repairs/`：报修单列表 / 详情 / 状态更新
- `api/suggestions/`：AI 建议生成与保存
- `docs/`：分工卡、AI 约定卡、测试记录、最终报告
- `supabase/schema.sql`：建表与 RLS 策略
