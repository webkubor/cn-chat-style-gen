<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

interface LogItem {
  version: string
  date: string
  lines?: string
  features: string[]
}

interface VersionData {
  version?: string
  current?: string
  changelog: LogItem[]
}

const router = useRouter()
const logs = ref<LogItem[]>([])
const currentVersion = ref('')

type FeatureType = 'new' | 'improve' | 'remove' | 'fix' | 'other'

const getFeatureType = (text: string): FeatureType => {
  if (text.startsWith('新增') || text.startsWith('【')) return 'new'
  if (text.startsWith('优化') || text.startsWith('分区') || text.startsWith('UI') || text.startsWith('交互')) return 'improve'
  if (text.startsWith('修复') || text.startsWith('Fixed')) return 'fix'
  if (text.startsWith('移除') || text.startsWith('删除') || text.startsWith('去掉')) return 'remove'
  return 'other'
}

const getFeatureIcon = (type: FeatureType) => {
  switch (type) {
    case 'new': return { icon: '+', class: 'bg-green-500/20 text-green-400', dot: 'bg-green-500' }
    case 'improve': return { icon: '~', class: 'bg-blue-500/20 text-blue-400', dot: 'bg-blue-500' }
    case 'fix': return { icon: '✓', class: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-500' }
    case 'remove': return { icon: '-', class: 'bg-red-500/20 text-red-400', dot: 'bg-red-500' }
    default: return { icon: '·', class: 'bg-white/10 text-white/40', dot: 'bg-white/30' }
  }
}

onMounted(async () => {
  try {
    // changelog 数组来自 /changelog.json（构建期由 vite.config 里的 changelogJson 插件从
    // public/version.json 抽出）。/version.json 已被 vite-plugin-refresh-guard 覆盖成构建清单
    // （version/buildId/commit/time），不含 changelog —— 读它会让本页拿到空数组。
    const res = await fetch(`/changelog.json?t=${Date.now()}`)
    const data: VersionData = await res.json()
    logs.value = Array.isArray(data.changelog) ? data.changelog : []
    currentVersion.value = data?.current ?? data?.changelog?.[0]?.version ?? data?.version ?? ''
  } catch (e) {
    console.error('Failed to load changelog', e)
  }
})
</script>

<template>
  <div class="min-h-screen bg-[#2C3639] text-white/90 font-sans selection:bg-[#7A9D8C] selection:text-white flex flex-col items-center py-12 px-6">
    
    <!-- Header -->
    <div class="w-full max-w-2xl mb-12 flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-light tracking-wide text-[#E8F1F2] mb-2">
          Update<span class="font-bold text-[#7A9D8C]">Log</span>
        </h1>
        <p class="text-white/40 text-xs tracking-wider uppercase">Project Changelog & History</p>
      </div>
      <button 
        @click="router.back()"
        class="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm font-medium border border-white/10 transition-all flex items-center gap-2 text-white/60 hover:text-white"
      >
        <span>← 返回</span>
      </button>
    </div>

    <!-- Timeline -->
    <div class="w-full max-w-2xl space-y-8 relative">
      <!-- Vertical Line -->
      <div class="absolute left-[19px] top-4 bottom-4 w-[2px] bg-white/5 z-0"></div>

      <div 
        v-for="(log, index) in logs" 
        :key="log.version"
        class="relative z-10 pl-10 group"
      >
        <!-- Dot -->
        <div 
          class="absolute left-0 top-1.5 w-10 h-10 flex items-center justify-center"
        >
          <div 
            class="w-2.5 h-2.5 rounded-full border-2 transition-colors duration-300 bg-[#2C3639]"
            :class="index === 0 ? 'border-[#7A9D8C] scale-125' : 'border-white/20 group-hover:border-white/40'"
          ></div>
        </div>

        <!-- Content Card -->
        <div class="bg-white/5 hover:bg-white/[0.07] border border-white/5 rounded-2xl p-6 transition-all duration-300">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <span class="text-xl font-bold tracking-tight">v{{ log.version }}</span>
              <span v-if="index === 0" class="px-2 py-0.5 bg-[#7A9D8C]/20 text-[#7A9D8C] text-[10px] font-bold rounded uppercase tracking-wider">Latest</span>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="log.lines" class="flex items-center gap-1.5 text-xs text-white/40 bg-white/5 px-2 py-1 rounded font-mono">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#7A9D8C]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                {{ log.lines }}
              </span>
              <span class="text-sm text-white/30 font-mono">{{ log.date }}</span>
            </div>
          </div>

          <ul class="space-y-2.5">
            <li 
              v-for="(feature, fIndex) in log.features" 
              :key="fIndex"
              class="flex items-start gap-3 text-sm leading-relaxed"
            >
              <span 
                class="mt-1 w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold shrink-0"
                :class="getFeatureIcon(getFeatureType(feature)).class"
              >
                {{ getFeatureIcon(getFeatureType(feature)).icon }}
              </span>
              <span :class="getFeatureType(feature) === 'remove' ? 'text-white/30 line-through' : 'text-white/70'">{{ feature }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="mt-20 text-center">
      <p class="text-[10px] text-white/20 tracking-[0.2em] uppercase">© 2026 WeChat Gen</p>
    </footer>

  </div>
</template>
