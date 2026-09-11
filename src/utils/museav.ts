/**
 * MUSE AV 业务中台客户端 —— 用用户自己的账户，拿自己的作品、花自己的积分出图。
 *
 * ## 为什么是「应用授权」而不是内置一把 Key
 *
 * 本站是纯静态站，没有任何能藏密钥的服务端 —— 内置 Key 会随 bundle 公开，
 * 任何人都能拿去刷额度。所以走 MUSE AV 的应用授权（设备码流程）：用户在
 * museav.top 上批准后，这里拿到的是**属于该用户本人**的一把 Key，花的是他自己
 * 的积分、产出归他自己的作品库，而且他随时能在「账户 → 已授权应用」单方面撤销。
 *
 * Key 只存在本机 localStorage，除 manager.museav.top 外不会发给任何地方。
 */

const API_BASE = 'https://manager.museav.top/api'
const APP_SLUG = 'wechat-chat-gen'
const KEY_STORAGE = 'museav_app_key'
const EMAIL_STORAGE = 'museav_account_email'

export interface MuseavWork {
  id: string
  url: string
  ratio: string
  prompt: string
  createdAt: string
}

export interface StartAuthResult {
  deviceCode: string
  userCode: string
  verificationUri: string
  /** 轮询间隔（秒），服务端给的节奏，别自己拍一个更短的 */
  interval: number
  expiresIn: number
  appName: string
}

export function getKey(): string {
  try { return localStorage.getItem(KEY_STORAGE) || '' } catch { return '' }
}

export function getAccountEmail(): string {
  try { return localStorage.getItem(EMAIL_STORAGE) || '' } catch { return '' }
}

export function isAuthorized(): boolean {
  return !!getKey()
}

/** 本地断开。**不等于**在 MUSE AV 那边撤销——真撤销要去「账户 → 已授权应用」。 */
export function forgetKey(): void {
  try {
    localStorage.removeItem(KEY_STORAGE)
    localStorage.removeItem(EMAIL_STORAGE)
  } catch { /* 隐私模式写不了，忽略 */ }
}

async function callJson(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_BASE}${path}`, init)
  // 非 2xx 也常带 JSON 错误体（中台的 401/403 都写了具体原因），优先读它
  const text = await res.text()
  let data: any = null
  try { data = JSON.parse(text) } catch { /* 可能是 Cloudflare 的 HTML 错误页 */ }
  if (!res.ok) {
    // 401 = Key 已被撤销或失效。本地留着一把废 Key 只会让后面每次调用都失败，
    // 直接清掉，让界面回到「未连接」状态引导重新授权。
    if (res.status === 401) forgetKey()
    throw new Error(data?.error || `请求失败（HTTP ${res.status}）`)
  }
  if (!data) throw new Error('服务返回了非预期内容，稍后再试')
  return data
}

function authHeaders(): Record<string, string> {
  const key = getKey()
  if (!key) throw new Error('还没有连接 MUSE AV 账户')
  return { 'X-API-Key': key }
}

/** 第一步：拿授权码与审批页地址 */
export async function startAuth(): Promise<StartAuthResult> {
  const d = await callJson('/app-auth/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_slug: APP_SLUG }),
  })
  return {
    deviceCode: d.device_code,
    userCode: d.user_code,
    verificationUri: d.verification_uri,
    interval: d.interval || 3,
    expiresIn: d.expires_in || 600,
    appName: d.app?.name || APP_SLUG,
  }
}

/**
 * 第二步：轮询等用户批准，成功后把 Key 落到 localStorage。
 * 按服务端给的 interval 走，别自己缩短 —— 那只是白打请求。
 */
export async function pollAuth(
  deviceCode: string,
  opts: { interval: number; expiresIn: number; shouldStop?: () => boolean },
): Promise<{ email: string }> {
  const deadline = Date.now() + opts.expiresIn * 1000
  while (Date.now() < deadline) {
    if (opts.shouldStop?.()) throw new Error('已取消')
    const d = await callJson('/app-auth/poll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_code: deviceCode }),
    })
    if (d.status === 'approved') {
      localStorage.setItem(KEY_STORAGE, d.api_key)
      if (d.account_email) localStorage.setItem(EMAIL_STORAGE, d.account_email)
      return { email: d.account_email || '' }
    }
    if (d.status === 'expired') throw new Error('授权码已过期，请重新发起')
    await new Promise((r) => setTimeout(r, opts.interval * 1000))
  }
  throw new Error('等待授权超时，请重新发起')
}

/** 当前账户 + 剩余积分（出图前要让人知道还能出几张） */
export async function fetchMe(): Promise<{ email: string; nickname: string; credits: number }> {
  const d = await callJson('/me', { headers: authHeaders() })
  return { email: d.email || '', nickname: d.nickname || '', credits: Number(d.credits ?? 0) }
}

/**
 * 我在 MUSE AV 的作品。
 *
 * 走 /jobs 而不是 /gallery：gallery 不按账户过滤（`prefix=''` 就是全库最新），
 * 拿它会列出别人的图；jobs 是服务端按 account_id 过滤的，才是「我自己的」。
 * 应用授权的 scope 也只给了 jobs，调 gallery 会被中台 403 挡掉。
 */
export async function fetchMyWorks(limit = 60): Promise<MuseavWork[]> {
  const rows = await callJson(`/jobs?media_type=image&status=done&limit=${limit}`, { headers: authHeaders() })
  return (Array.isArray(rows) ? rows : [])
    .filter((r: any) => r.cdn_url)
    .map((r: any) => ({
      id: r.id,
      url: r.cdn_url,
      ratio: r.ratio || '',
      prompt: r.prompt || '',
      createdAt: r.created_at || '',
    }))
}

/** 提交出图，秒返 jobId；产出靠 waitForWork 轮询 */
export async function generate(prompt: string, ratio = '1:1'): Promise<string> {
  const d = await callJson('/generate', {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ratio }),
  })
  if (!d.jobId) throw new Error(d.error || '提交失败')
  return d.jobId
}

/** 等出图完成。中台的单任务 SSE 不对应用开放，这里按固定间隔轮询 /jobs?id=。 */
export async function waitForWork(
  jobId: string,
  opts: { intervalMs?: number; timeoutMs?: number; shouldStop?: () => boolean } = {},
): Promise<MuseavWork> {
  const interval = opts.intervalMs ?? 3000
  const deadline = Date.now() + (opts.timeoutMs ?? 180_000)
  while (Date.now() < deadline) {
    if (opts.shouldStop?.()) throw new Error('已取消')
    await new Promise((r) => setTimeout(r, interval))
    const rows = await callJson(`/jobs?id=${encodeURIComponent(jobId)}`, { headers: authHeaders() })
    const job = Array.isArray(rows) ? rows[0] : rows
    if (!job) continue
    if (job.status === 'done' && job.cdn_url) {
      return { id: job.id, url: job.cdn_url, ratio: job.ratio || '', prompt: job.prompt || '', createdAt: job.created_at || '' }
    }
    // 失败要把上游原因带出来：「出图失败」四个字没法让人判断该改提示词还是充积分
    if (job.status === 'failed' || job.error) throw new Error(job.error || '出图失败')
  }
  throw new Error('出图超时，可以去 museav.top 的「我的作品」里看这一单的结果')
}
