# 今天穿什么

一个使用 Vite + React + TypeScript 搭建的本地穿搭推荐网站。

功能包含：

- 根据气温、天气、场合、出行方式生成今日穿搭
- 支持 Nike、adidas、UNIQLO、ZARA、H&M、The North Face、New Balance、lululemon、Arc'teryx、Under Armour 等品牌偏好
- 品牌风格库和官方页面入口
- 一次生成多套穿搭方案，每套配本地穿搭图和单品清单
- 无需后端服务，推荐逻辑全部在前端本地运行

## 关于品牌商品图片

当前版本使用项目内的原创穿搭图，避免未经授权抓取或盗链品牌官网图片。

如果后续要接真实商品照片，推荐使用：

- 品牌官方 API 或授权商品 feed
- 联盟营销平台提供的 product feed
- 自己维护的商品数据表，字段包含 `brand`、`name`、`imageUrl`、`productUrl`

不建议直接爬取并复制品牌官网图片用于公开部署。

## 本地开发

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

打包结果会生成到 `dist` 目录。

## 预览打包版本

```bash
npm run preview
```

## 常见 Windows 提示

如果 PowerShell 提示 `npm.ps1 cannot be loaded`，使用 `npm.cmd` 运行命令即可，例如：

```bash
npm.cmd run dev
```
