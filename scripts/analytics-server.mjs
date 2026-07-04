import { createHash, randomUUID } from 'node:crypto'
import { createServer } from 'node:http'
import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = path.join(rootDir, 'data')
const eventFile = path.join(dataDir, 'analytics-events.jsonl')
const summaryFile = path.join(dataDir, 'analytics-summary.json')
const reportFile = path.join(dataDir, 'analytics-report.md')
const port = Number(process.env.ANALYTICS_PORT ?? 4174)
const maxBodyBytes = 64 * 1024

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...corsHeaders(), ...headers })
  res.end(body)
}

function sendJson(res, status, value) {
  send(res, status, JSON.stringify(value), { 'Content-Type': 'application/json; charset=utf-8' })
}

function cleanText(value, maxLength = 500) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.replace(/\s+/g, ' ').trim().slice(0, maxLength)
}

function cleanProperties(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const output = {}

  for (const [key, item] of Object.entries(value).slice(0, 30)) {
    const safeKey = cleanText(key, 80)

    if (!safeKey) {
      continue
    }

    if (typeof item === 'string') {
      output[safeKey] = cleanText(item, 300)
    } else if (typeof item === 'number' || typeof item === 'boolean' || item === null) {
      output[safeKey] = item
    }
  }

  return output
}

function getDevice(userAgent, viewport) {
  if (/mobile|android|iphone|ipod/i.test(userAgent)) {
    return 'mobile'
  }

  if (/ipad|tablet/i.test(userAgent)) {
    return 'tablet'
  }

  const width = Number(String(viewport).split('x')[0])

  if (Number.isFinite(width) && width > 0 && width < 760) {
    return 'mobile'
  }

  return 'desktop'
}

function getDailyVisitorHash(req) {
  const ip = req.socket.remoteAddress ?? ''
  const day = new Date().toISOString().slice(0, 10)
  return createHash('sha256').update(`${day}:${ip}`).digest('hex').slice(0, 16)
}

function normalizeEvent(raw, req) {
  const userAgent = cleanText(raw.userAgent, 500)
  const viewport = cleanText(raw.viewport, 40)

  return {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    sentAt: cleanText(raw.sentAt, 40),
    name: cleanText(raw.name, 80) || 'event',
    sessionId: cleanText(raw.sessionId, 120),
    path: cleanText(raw.path, 300) || '/',
    url: cleanText(raw.url, 1000),
    referrer: cleanText(raw.referrer, 1000),
    title: cleanText(raw.title, 200),
    language: cleanText(raw.language, 40),
    timezone: cleanText(raw.timezone, 80),
    viewport,
    userAgent,
    device: getDevice(userAgent, viewport),
    visitorHash: getDailyVisitorHash(req),
    properties: cleanProperties(raw.properties),
  }
}

async function readBody(req) {
  let body = ''

  for await (const chunk of req) {
    body += chunk

    if (body.length > maxBodyBytes) {
      throw new Error('Payload too large')
    }
  }

  return body
}

async function readEvents() {
  if (!existsSync(eventFile)) {
    return []
  }

  const content = await readFile(eventFile, 'utf8')
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line)
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function topCounts(items, key, limit = 8) {
  const counts = new Map()

  for (const item of items) {
    const value = item[key] || '(unknown)'
    counts.set(value, (counts.get(value) ?? 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }))
}

function getReferrerName(referrer) {
  if (!referrer) {
    return 'direct'
  }

  try {
    return new URL(referrer).hostname.replace(/^www\./, '')
  } catch {
    return 'other'
  }
}

function summarize(events) {
  const now = Date.now()
  const dayAgo = now - 24 * 60 * 60 * 1000
  const pageViews = events.filter((event) => event.name === 'page_view')
  const recent24h = events.filter((event) => Date.parse(event.receivedAt) >= dayAgo)
  const sessions = new Set(events.map((event) => event.sessionId).filter(Boolean))
  const dailyVisitors = new Set(events.map((event) => event.visitorHash).filter(Boolean))

  return {
    generatedAt: new Date().toISOString(),
    totals: {
      events: events.length,
      pageViews: pageViews.length,
      sessions: sessions.size,
      dailyVisitors: dailyVisitors.size,
      last24h: recent24h.length,
    },
    byDevice: topCounts(events, 'device'),
    byPath: topCounts(pageViews.length ? pageViews : events, 'path'),
    byEvent: topCounts(events, 'name'),
    byReferrer: topCounts(
      events.map((event) => ({ referrerName: getReferrerName(event.referrer) })),
      'referrerName',
    ),
    recent: [...events].reverse().slice(0, 60),
  }
}

function markdownTable(headers, rows) {
  if (!rows.length) {
    return '暂无数据。\n'
  }

  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n')
}

function renderReport(summary) {
  const totals = summary.totals
  const recentRows = summary.recent.slice(0, 20).map((event) => [
    event.receivedAt,
    event.name,
    event.path,
    event.device,
    JSON.stringify(event.properties ?? {}),
  ])

  return `# 今天穿什么 - 本地访问数据

更新时间：${summary.generatedAt}

## 总览

| 指标 | 数值 |
| --- | ---: |
| 总事件 | ${totals.events} |
| 页面访问 | ${totals.pageViews} |
| 访客会话 | ${totals.sessions} |
| 今日匿名访客 | ${totals.dailyVisitors} |
| 近 24 小时事件 | ${totals.last24h} |

## 页面访问排行

${markdownTable(['页面', '次数'], summary.byPath.map((row) => [row.name, String(row.count)]))}

## 设备类型

${markdownTable(['设备', '次数'], summary.byDevice.map((row) => [row.name, String(row.count)]))}

## 来源

${markdownTable(['来源', '次数'], summary.byReferrer.map((row) => [row.name, String(row.count)]))}

## 事件类型

${markdownTable(['事件', '次数'], summary.byEvent.map((row) => [row.name, String(row.count)]))}

## 最近访问记录

${markdownTable(['时间', '事件', '页面', '设备', '参数'], recentRows)}
`
}

async function writeReports(events) {
  await mkdir(dataDir, { recursive: true })
  const summary = summarize(events)
  await writeFile(summaryFile, `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
  await writeFile(reportFile, renderReport(summary), 'utf8')
  return summary
}

async function handleCollect(req, res) {
  try {
    const body = await readBody(req)
    const raw = JSON.parse(body || '{}')
    const event = normalizeEvent(raw, req)

    await mkdir(dataDir, { recursive: true })
    await appendFile(eventFile, `${JSON.stringify(event)}\n`, 'utf8')
    await writeReports(await readEvents())

    sendJson(res, 202, { ok: true, report: 'data/analytics-report.md', summary: 'data/analytics-summary.json' })
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message })
  }
}

function dashboardHtml() {
  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>今天穿什么 - 本地访问数据</title>
    <style>
      :root {
        color-scheme: light;
        font-family: Inter, "Microsoft YaHei", system-ui, sans-serif;
        color: #17191c;
        background: #f5f2ec;
      }

      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at 20% 10%, rgba(120, 148, 135, 0.28), transparent 32%),
          linear-gradient(135deg, #fbfaf6 0%, #edf3f1 100%);
      }

      main {
        width: min(1120px, calc(100% - 32px));
        margin: 0 auto;
        padding: 32px 0 44px;
      }

      header {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 22px;
      }

      h1 {
        margin: 0 0 8px;
        font-size: clamp(28px, 4vw, 52px);
      }

      p {
        margin: 0;
        color: #626b70;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        min-height: 38px;
        padding: 0 14px;
        border: 1px solid #d7dfdf;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.78);
        font-weight: 700;
      }

      .cards {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 12px;
        margin: 24px 0;
      }

      .card,
      .panel {
        border: 1px solid #d7dfdf;
        border-radius: 8px;
        background: rgba(255, 253, 250, 0.9);
        box-shadow: 0 18px 40px rgba(33, 42, 45, 0.08);
      }

      .card {
        padding: 18px;
      }

      .card span {
        color: #626b70;
        font-size: 13px;
        font-weight: 700;
      }

      .card strong {
        display: block;
        margin-top: 8px;
        font-size: 30px;
      }

      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }

      .panel {
        padding: 20px;
      }

      .panel h2 {
        margin: 0 0 14px;
        font-size: 19px;
      }

      .bar {
        display: grid;
        grid-template-columns: minmax(100px, 1fr) 4fr auto;
        align-items: center;
        gap: 10px;
        margin: 10px 0;
      }

      .track {
        height: 9px;
        overflow: hidden;
        border-radius: 999px;
        background: #e7ecea;
      }

      .fill {
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #203a5f, #e9694d);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }

      th,
      td {
        padding: 12px 8px;
        border-bottom: 1px solid #d7dfdf;
        text-align: left;
        vertical-align: top;
      }

      th {
        color: #626b70;
        font-size: 12px;
        text-transform: uppercase;
      }

      code {
        display: inline-block;
        padding: 4px 7px;
        border-radius: 6px;
        background: #edf3f1;
      }

      @media (max-width: 860px) {
        header,
        .grid {
          grid-template-columns: 1fr;
          display: grid;
        }

        .cards {
          grid-template-columns: repeat(2, 1fr);
        }
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div>
          <h1>本地访问数据</h1>
          <p>匿名统计今天穿什么网站的访问、来源、设备和最近行为。</p>
        </div>
        <span class="pill" id="status">读取中</span>
      </header>

      <section class="cards" id="cards"></section>

      <section class="grid">
        <article class="panel">
          <h2>访问页面</h2>
          <div id="paths"></div>
        </article>
        <article class="panel">
          <h2>设备类型</h2>
          <div id="devices"></div>
        </article>
        <article class="panel">
          <h2>来源</h2>
          <div id="referrers"></div>
        </article>
        <article class="panel">
          <h2>事件类型</h2>
          <div id="events"></div>
        </article>
      </section>

      <section class="panel" style="margin-top: 16px">
        <h2>最近访问记录</h2>
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>事件</th>
              <th>页面</th>
              <th>设备</th>
              <th>参数</th>
            </tr>
          </thead>
          <tbody id="recent"></tbody>
        </table>
      </section>
    </main>

    <script>
      const formatTime = (value) => new Intl.DateTimeFormat('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(new Date(value))

      function renderBars(id, rows) {
        const max = Math.max(...rows.map((row) => row.count), 1)
        document.getElementById(id).innerHTML = rows.length
          ? rows.map((row) => '<div class="bar"><strong>' + row.name + '</strong><span class="track"><span class="fill" style="width:' + Math.round((row.count / max) * 100) + '%"></span></span><span>' + row.count + '</span></div>').join('')
          : '<p>暂无数据</p>'
      }

      async function refresh() {
        const res = await fetch('/api/summary')
        const data = await res.json()
        const totals = data.totals

        document.getElementById('status').textContent = '最后更新 ' + formatTime(data.generatedAt)
        document.getElementById('cards').innerHTML = [
          ['总事件', totals.events],
          ['页面访问', totals.pageViews],
          ['访客会话', totals.sessions],
          ['今日访客', totals.dailyVisitors],
          ['近 24 小时', totals.last24h],
        ].map(([label, value]) => '<article class="card"><span>' + label + '</span><strong>' + value + '</strong></article>').join('')

        renderBars('paths', data.byPath)
        renderBars('devices', data.byDevice)
        renderBars('referrers', data.byReferrer)
        renderBars('events', data.byEvent)

        document.getElementById('recent').innerHTML = data.recent.length
          ? data.recent.map((event) => '<tr><td>' + formatTime(event.receivedAt) + '</td><td><code>' + event.name + '</code></td><td>' + event.path + '</td><td>' + event.device + '<br />' + event.viewport + '</td><td><code>' + JSON.stringify(event.properties) + '</code></td></tr>').join('')
          : '<tr><td colspan="5">暂无访问记录。先运行网站并刷新一次页面。</td></tr>'
      }

      refresh()
      setInterval(refresh, 10000)
    </script>
  </body>
</html>`
}

const server = createServer(async (req, res) => {
  const requestUrl = new URL(req.url ?? '/', `http://${req.headers.host}`)

  if (req.method === 'OPTIONS') {
    send(res, 204, '')
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/collect') {
    await handleCollect(req, res)
    return
  }

  if (req.method === 'GET' && requestUrl.pathname === '/api/summary') {
    sendJson(res, 200, await writeReports(await readEvents()))
    return
  }

  if (req.method === 'POST' && requestUrl.pathname === '/api/export') {
    sendJson(res, 200, await writeReports(await readEvents()))
    return
  }

  if (req.method === 'GET' && (requestUrl.pathname === '/' || requestUrl.pathname === '/dashboard')) {
    send(res, 200, dashboardHtml(), { 'Content-Type': 'text/html; charset=utf-8' })
    return
  }

  sendJson(res, 404, { ok: false, error: 'Not found' })
})

server.listen(port, () => {
  console.log(`Analytics collector: http://localhost:${port}/collect`)
  console.log(`Analytics dashboard:  http://localhost:${port}/`)
  console.log('Trae report file:    data/analytics-report.md')
})

writeReports(await readEvents()).catch((error) => {
  console.warn(`Failed to write analytics report: ${error.message}`)
})
