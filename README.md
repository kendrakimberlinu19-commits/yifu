# 今天穿什么

一个使用 Vite + React + TypeScript 搭建的本地穿搭推荐网站。

线上地址：

```text
https://kendrakimberlinu19-commits.github.io/yifu/
```

## 功能

- 根据气温、天气、场合、通勤方式生成今日穿搭。
- 支持浏览器定位自动读取当地气温和天气，减少手动填写。
- 支持男士 / 女士穿搭区分，单品清单和随身提醒会同步变化。
- 支持 Nike、adidas、UNIQLO、ZARA、H&M、The North Face、New Balance、lululemon、Arc'teryx、Under Armour 等品牌偏好。
- 提供品牌风格库和官方页面入口。
- 一次生成多套穿搭方案，每套配本地穿搭图和单品清单。
- 提供圆形随机穿搭转盘，点击后随机抽出一套穿搭。
- 内置本地匿名访问数据采集和看板。

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，例如：

```text
http://localhost:5173/
```

## 本地访问数据看板

先启动本地采集服务：

```bash
npm run analytics
```

看板地址：

```text
http://localhost:4174/
```

采集接口：

```text
http://localhost:4174/collect
```

本地开发时，网站会自动把匿名访问事件发送到这个本地服务。记录文件保存在：

```text
data/analytics-events.jsonl
```

不会保存原始 IP，只保存匿名会话、页面、来源、设备类型、浏览器语言、屏幕尺寸和站内交互事件。

## 在 Trae 里看数据

用 Trae 打开这个项目文件夹：

```text
C:\Users\22642\Desktop\test
```

然后在 Trae 的文件列表里打开：

```text
data/analytics-report.md
```

这是适合直接阅读的 Markdown 报告。需要原始结构化数据时，打开：

```text
data/analytics-summary.json
```

只要 `npm run analytics` 还在运行，新的访问记录会自动刷新到这两个文件里。

公开部署到 GitHub Pages 时，如果没有配置公网采集地址，线上网站不会把数据发回你的电脑。要收集公网访客数据，需要把 `VITE_ANALYTICS_ENDPOINT` 配成一个公网可访问的采集接口，例如后续部署到 Cloudflare Worker、Vercel Function 或你自己的服务器。

## 本地打包

```bash
npm run build
```

打包结果会生成到 `dist` 目录，可以用来部署到静态网站平台。

## 预览打包版本

```bash
npm run preview
```

## 免费部署到网上

项目已经配置好 GitHub Pages 自动部署文件：

```text
.github/workflows/deploy.yml
```

之后每次提交并推送到 `main` 分支，GitHub 会自动运行 `npm ci`、`npm run build`，并发布 `dist` 目录。

`vite.config.ts` 已经设置 `base: './'`，因此同一份 `dist` 也可以部署到 Netlify、Vercel、Cloudflare Pages 等免费静态站点平台。

## 关于品牌商品图片

当前版本使用项目内原创穿搭图，避免未经授权抓取或盗链品牌官网图片。

如果后续要接真实商品照片，推荐使用：

- 品牌官方 API 或授权商品 feed。
- 联盟营销平台提供的 product feed。
- 自己维护的商品数据表，字段包含 `brand`、`name`、`imageUrl`、`productUrl`。

不建议直接爬取并复制品牌官网图片用于公开部署。

## Windows 提示

如果 PowerShell 提示 `npm.ps1 cannot be loaded`，可以使用 `npm.cmd` 运行命令，例如：

```bash
npm.cmd run dev
```
