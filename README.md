# 今天穿什么

一个使用 Vite + React + TypeScript 搭建的本地穿搭推荐网站。

## 功能

- 根据气温、天气、场合、通勤方式生成今日穿搭。
- 支持男士 / 女士穿搭区分，单品清单和随身提醒会同步变化。
- 支持 Nike、adidas、UNIQLO、ZARA、H&M、The North Face、New Balance、lululemon、Arc'teryx、Under Armour 等品牌偏好。
- 提供品牌风格库和官方页面入口。
- 一次生成多套穿搭方案，每套配本地穿搭图和单品清单。
- 提供圆形随机穿搭转盘，点击后随机抽出一套穿搭。
- 无需后端服务，推荐逻辑和展示数据都在前端本地运行。

## 本地运行

```bash
npm install
npm run dev
```

打开终端显示的本地地址，例如：

```text
http://localhost:5173/
```

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

推荐流程：

1. 在 GitHub 新建一个公开仓库。
2. 把本项目推送到仓库的 `main` 分支。
3. 进入仓库 `Settings > Pages`，将发布方式设置为 `GitHub Actions`。
4. 之后每次提交代码，GitHub 会自动运行 `npm ci`、`npm run build`，并发布 `dist` 目录。

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
