<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { PRESET_QUOTES } from '../../config/presets'

const version = ref('...')
const currentQuote = ref('')

const fetchVersion = async () => {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`)
    const data = await res.json()
    version.value = data?.changelog?.[0]?.version ?? data?.version ?? __APP_VERSION__
  } catch (e) {
    // 降级使用编译时定义的版本
    version.value = __APP_VERSION__
  }
}

onMounted(() => {
  fetchVersion()
  currentQuote.value = PRESET_QUOTES[Math.floor(Math.random() * PRESET_QUOTES.length)] || ''
})
</script>

<template>
  <footer class="mt-16 pt-10 pb-16 border-t border-white/5 flex flex-col items-center">
    <!-- Daily Inspiration (鸡汤逻辑回归) -->
    <div v-if="currentQuote" class="mb-12 px-6 max-w-[280px] text-center group">
      <div class="inline-flex items-center gap-2 mb-3 text-[#7A9D8C]/40 group-hover:text-[#7A9D8C]/60 transition-colors">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        <span class="text-[10px] uppercase tracking-[0.3em] font-black">Daily Inspiration</span>
      </div>
      <p class="text-[11px] text-white/30 leading-relaxed italic font-light tracking-wider leading-relaxed">
        “{{ currentQuote }}”
      </p>
    </div>

    <!-- 核心信息区 -->
    <div class="flex items-center gap-3 mb-5">
      <span class="text-[10px] px-2 py-0.5 rounded bg-[#7A9D8C]/10 text-[#7A9D8C] font-mono border border-[#7A9D8C]/20 shadow-sm">
        Build v{{ version }}
      </span>
      <span class="w-1 h-1 rounded-full bg-white/10"></span>
      <router-link to="/changelog" class="text-[10px] text-white/35 hover:text-[#7A9D8C] tracking-[0.2em] font-medium transition-colors">更新日志</router-link>
      <span class="w-1 h-1 rounded-full bg-white/10"></span>
      <p class="text-[10px] text-white/40 tracking-[0.2em] font-medium">好易美票务公司</p>
    </div>

    <!-- 业务中台入口：本站的素材与出图能力后续接 MUSE AV，先把入口露出来 -->
    <a
      href="https://museav.top"
      target="_blank"
      rel="noopener"
      class="group mb-6 inline-flex items-center gap-2 rounded-full border border-[#7A9D8C]/20 bg-[#7A9D8C]/5 px-4 py-1.5 transition-colors hover:border-[#7A9D8C]/40 hover:bg-[#7A9D8C]/10"
    >
      <span class="text-[10px] font-black uppercase tracking-[0.25em] text-[#7A9D8C]">MUSE AV</span>
      <span class="h-2.5 w-px bg-[#7A9D8C]/25"></span>
      <span class="text-[10px] tracking-wider text-white/40 transition-colors group-hover:text-white/60">业务中台 · 声影成诗</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-[#7A9D8C]/50 transition-transform group-hover:translate-x-0.5"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
    </a>
    
    <div class="flex flex-col items-center gap-2.5">
      <p class="text-[10px] text-white/15 uppercase tracking-[0.2em]">© 2026 Design by WebKubor</p>
      <a href="mailto:webkubor@163.com" class="text-[11px] font-medium text-white/20 hover:text-[#7A9D8C] transition-colors tracking-wide underline underline-offset-4 decoration-white/5">
        webkubor@163.com
      </a>
    </div>
  </footer>
</template>
