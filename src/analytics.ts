type AnalyticsProperties = Record<string, string | number | boolean | null | undefined>

const sessionKey = 'today-outfit-analytics-session'
const localEndpoint = 'http://localhost:4174/collect'

function getEndpoint() {
  const configuredEndpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT?.trim()

  if (configuredEndpoint) {
    return configuredEndpoint
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return localEndpoint
  }

  return ''
}

function getSessionId() {
  const existingSession = window.localStorage.getItem(sessionKey)

  if (existingSession) {
    return existingSession
  }

  const nextSession =
    window.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(sessionKey, nextSession)
  return nextSession
}

export function trackEvent(name: string, properties: AnalyticsProperties = {}) {
  const endpoint = getEndpoint()

  if (!endpoint) {
    return
  }

  const payload = {
    name,
    properties,
    sessionId: getSessionId(),
    url: window.location.href,
    path: `${window.location.pathname}${window.location.hash}`,
    referrer: document.referrer,
    title: document.title,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: navigator.userAgent,
    sentAt: new Date().toISOString(),
  }

  const body = JSON.stringify(payload)

  void fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
    body,
    keepalive: true,
  }).catch(() => {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, body)
    }
  })
}
