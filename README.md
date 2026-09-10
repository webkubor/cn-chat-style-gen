# WeChat Chat Gen

一个用于生成高质感微信聊天氛围图的前端应用，支持对话、拉人、列表、朋友圈四种模式，支持语料库管理与批量导出截图。

**在线体验 → [wechat.webkubor.online](https://wechat.webkubor.online)**（无需注册，打开即用）

## 功能亮点

- 对话 / 拉人 / 列表 / 朋友圈四模式一键切换
- 自定义群聊标题、成员数、昵称样式与系统提示样式
- 支持更换聊天背景与“我”的头像
- 语料库管理（新增、删除、清空、导入、导出）
- 一键批量生成并导出高清 PNG

## 技术栈

- Vue 3 + TypeScript + Vite
- Pinia
- Tailwind CSS
- html2canvas（截图导出）

## 本地开发

```bash
pnpm install
pnpm dev
```

如需打包：

```bash
pnpm build
pnpm preview
```

## 使用说明

1. 在右侧面板调整群聊与样式配置。
2. 选择目标模式后调整配置，点击“仅刷新预览”。
3. 点击“一键批量下载成品图”进行多张导出。
4. 语料库入口在右上角“语料库”。

## 语料占位符

拉人模式支持以下占位符：

- `{name}` 邀请人
- `{invited}` 被邀请人
- `{other}` 其他成员

## 目录结构

```
src/
  components/        # 组件（聊天视图、配置面板、设备框等）
  stores/            # Pinia 状态管理（聊天与语料）
  views/             # 页面（生成器、语料库）
  assets/            # 静态资源
```

## 数据与隐私

- 语料库数据保存在浏览器 IndexedDB 中，仅存本地。
- 预览头像会使用公开图片链接作为示例素材（可自行替换）。
- 云端同步功能保留但默认关闭，如需启用请在环境变量中设置 `VITE_CLOUD_SYNC_ENABLED=true`。
