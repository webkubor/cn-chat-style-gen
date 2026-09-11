<script setup lang="ts">
/**
 * MUSE AV 素材选择器 —— 一个弹窗解决三件事：
 *   ① 连接账户（应用授权，设备码流程）
 *   ② 从「我的作品」里挑一张
 *   ③ 直接用 AI 出一张新的（花用户自己的积分）
 *
 * 三处入口共用它：藏宝库头像库、聊天背景、朋友圈配图。选中后只回传一个 URL，
 * 调用方自己决定是存进头像库还是设成背景 —— 所以这个组件不碰任何 store。
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  isAuthorized, getAccountEmail, forgetKey,
  startAuth, pollAuth, fetchMe, fetchMyWorks, generate, waitForWork,
  type MuseavWork,
} from '../utils/museav'

interface Props {
  /** 弹窗标题里的用途说明，比如「选作头像」「选作聊天背景」 */
  purpose?: string
  /** 出图时用的画幅。头像给 1:1，聊天背景给 3:4 */
  ratio?: string
}
const props = withDefaults(defineProps<Props>(), { purpose: '选一张图', ratio: '1:1' })
const emit = defineEmits<{ (e: 'pick', url: string): void; (e: 'close'): void }>()

type Phase = 'idle' | 'authorizing' | 'ready'
const phase = ref<Phase>(isAuthorized() ? 'ready' : 'idle')
const busy = ref(false)
const error = ref('')

// 授权态
const userCode = ref('')
const verifyUri = ref('')
const stopped = ref(false)

// 账户与作品
const email = ref(getAccountEmail())
const credits = ref<number | null>(null)
const works = ref<MuseavWork[]>([])
const loadingWorks = ref(false)

// 出图态
const prompt = ref('')
const generating = ref(false)
const genHint = ref('')

const canGenerate = computed(() => !!prompt.value.trim() && !generating.value)

async function connect() {
  error.value = ''
  busy.value = true
  try {
    const s = await startAuth()
    userCode.value = s.userCode
    verifyUri.value = s.verificationUri
    phase.value = 'authorizing'
    // 新开一个标签去批准。这里不用 location.href —— 跳走了用户就丢了正在编辑的聊天内容
    window.open(s.verificationUri, '_blank', 'noopener')
    const r = await pollAuth(s.deviceCode, {
      interval: s.interval,
      expiresIn: s.expiresIn,
      shouldStop: () => stopped.value,
    })
    email.value = r.email
    phase.value = 'ready'
    await loadAll()
  } catch (e: any) {
    error.value = e.message || '连接失败'
    phase.value = 'idle'
  } finally {
    busy.value = false
  }
}

async function loadAll() {
  loadingWorks.value = true
  error.value = ''
  try {
    // 两个请求并行：积分是出图前的决策信息，作品是主内容，谁先到都不该等对方
    const [me, list] = await Promise.all([fetchMe().catch(() => null), fetchMyWorks()])
    if (me) { email.value = me.email; credits.value = me.credits }
    works.value = list
  } catch (e: any) {
    error.value = e.message || '拉取失败'
    // Key 被撤销时 museav.ts 已经清掉本地 Key，界面要跟着回到未连接
    if (!isAuthorized()) phase.value = 'idle'
  } finally {
    loadingWorks.value = false
  }
}

async function runGenerate() {
  if (!canGenerate.value) return
  generating.value = true
  error.value = ''
  genHint.value = '已提交，出图通常 10~60 秒'
  try {
    const jobId = await generate(prompt.value.trim(), props.ratio)
    const work = await waitForWork(jobId, { shouldStop: () => stopped.value })
    works.value = [work, ...works.value]
    genHint.value = ''
    prompt.value = ''
    // 出完直接选中：用户点「生成」就是为了用它，不该再让他去网格里找一遍
    emit('pick', work.url)
  } catch (e: any) {
    error.value = e.message || '出图失败'
    genHint.value = ''
  } finally {
    generating.value = false
    if (credits.value !== null) fetchMe().then((m) => { credits.value = m.credits }).catch(() => {})
  }
}

function disconnect() {
  forgetKey()
  works.value = []
  credits.value = null
  email.value = ''
  phase.value = 'idle'
}

onMounted(() => { if (phase.value === 'ready') loadAll() })
onUnmounted(() => { stopped.value = true })
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="emit('close')">
    <div class="w-full max-w-2xl max-h-[86vh] flex flex-col bg-[#1a1a2e] rounded-2xl shadow-2xl overflow-hidden border border-white/10">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-white/10">
        <div class="min-w-0">
          <h3 class="text-lg font-medium text-white">MUSE AV · {{ props.purpose }}</h3>
          <p v-if="phase === 'ready'" class="text-[11px] text-white/40 truncate">
            {{ email || '已连接' }}
            <span v-if="credits !== null"> · 剩余 {{ credits }} 积分</span>
          </p>
        </div>
        <button @click="emit('close')" class="p-2 text-white/40 hover:text-white transition-colors" aria-label="关闭">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 未连接 -->
      <div v-if="phase === 'idle'" class="p-6 space-y-4">
        <p class="text-sm text-white/70 leading-relaxed">
          连接你的 MUSE AV 账户，就能把自己生成过的作品直接当素材，也能在这里直接用 AI 出图。
        </p>
        <p class="text-[11px] text-white/40 leading-relaxed">
          授权走 museav.top 的应用授权流程——本站拿到的是属于你自己的凭据，出图消耗你自己的积分，
          产出同样进你自己的作品库。随时可以在 MUSE AV 的「账户 → 已授权应用」里撤销。
        </p>
        <button
          @click="connect"
          :disabled="busy"
          class="w-full py-3 bg-[#7A9D8C] hover:bg-[#6B8E78] disabled:opacity-50 rounded-xl text-sm font-bold text-white transition-all"
        >
          {{ busy ? '正在发起…' : '连接 MUSE AV 账户' }}
        </button>
        <p v-if="error" class="text-xs text-red-300">{{ error }}</p>
      </div>

      <!-- 等待批准 -->
      <div v-else-if="phase === 'authorizing'" class="p-6 space-y-4 text-center">
        <p class="text-sm text-white/70">已在新标签打开授权页，请在那边确认</p>
        <p class="text-2xl font-mono tracking-[0.2em] text-[#7A9D8C]">{{ userCode }}</p>
        <p class="text-[11px] text-white/40">核对这串码和授权页上显示的一致，再点「同意授权」。这个窗口会自动继续。</p>
        <a :href="verifyUri" target="_blank" rel="noopener" class="inline-block text-xs text-white/50 underline underline-offset-4">
          没自动打开？点这里
        </a>
      </div>

      <!-- 已连接：出图 + 作品网格 -->
      <template v-else>
        <div class="p-4 border-b border-white/10 space-y-2">
          <div class="flex gap-2">
            <input
              v-model="prompt"
              type="text"
              placeholder="描述想要的图，例如：水墨风格的猫，侧脸特写"
              class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#7A9D8C]/50 transition-all"
              @keyup.enter="runGenerate"
            />
            <button
              @click="runGenerate"
              :disabled="!canGenerate"
              class="px-5 bg-[#7A9D8C] hover:bg-[#6B8E78] disabled:opacity-40 rounded-xl text-sm font-bold text-white transition-all whitespace-nowrap"
            >
              {{ generating ? '出图中…' : 'AI 出图' }}
            </button>
          </div>
          <p v-if="genHint" class="text-[11px] text-white/40">{{ genHint }}</p>
          <p v-if="error" class="text-[11px] text-red-300">{{ error }}</p>
        </div>

        <div class="flex-1 overflow-y-auto p-4">
          <p v-if="loadingWorks" class="text-center text-xs text-white/30 py-8">正在拉取你的作品…</p>
          <div v-else-if="works.length" class="grid grid-cols-4 gap-2">
            <button
              v-for="w in works"
              :key="w.id"
              @click="emit('pick', w.url)"
              class="group relative aspect-square rounded-lg overflow-hidden bg-white/5 hover:ring-2 hover:ring-[#7A9D8C] transition-all"
              :title="w.prompt"
            >
              <img :src="w.url" class="w-full h-full object-cover" loading="lazy" />
            </button>
          </div>
          <div v-else class="text-center py-10 space-y-2">
            <p class="text-xs text-white/40">MUSE AV 里还没有已完成的图片作品</p>
            <p class="text-[11px] text-white/25">上面输入一句描述，直接出一张</p>
          </div>
        </div>

        <div class="p-3 border-t border-white/10 flex items-center justify-between">
          <button @click="loadAll" :disabled="loadingWorks" class="text-[11px] text-white/40 hover:text-white/70 transition-colors">
            刷新作品
          </button>
          <button @click="disconnect" class="text-[11px] text-white/30 hover:text-white/60 transition-colors">
            断开连接
          </button>
        </div>
      </template>
    </div>
  </div>
</template>
