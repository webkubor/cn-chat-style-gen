<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useChatStore } from '../stores/chat'
import { useChatListStore } from '../stores/chatList'
import DeviceFrame from '../components/DeviceFrame.vue'
import MomentsFrame from '../components/MomentsFrame.vue'
import XhsFrame from '../components/XhsFrame.vue'
import ChatView from '../components/ChatView.vue'
import ChatListView from '../components/ChatListView.vue'
import MomentsView from '../components/MomentsView.vue'
import XhsView from '../components/XhsView.vue'
import ConfigPanel from '../components/ConfigPanel.vue'
import ConfigFooter from '../components/config/ConfigFooter.vue'

const chatStore = useChatStore()
const chatListStore = useChatListStore()
const isEditorOpen = ref(false) // 移动端控制编辑器展开/收起

// 当前模式由 ConfigPanel 控制，这里需要获取它
const currentMode = ref<'chat' | 'join' | 'list' | 'moments' | 'xhs'>('chat')

// 是否显示列表视图
const isListMode = computed(() => currentMode.value === 'list')
const isMomentsMode = computed(() => currentMode.value === 'moments')
const isXhsMode = computed(() => currentMode.value === 'xhs')

const toggleEditor = () => {
  isEditorOpen.value = !isEditorOpen.value
}

onMounted(() => {
  chatStore.init()
  chatListStore.init()
})

// 监听模式变化（通过事件从 ConfigPanel 传递）
const handleModeChange = (mode: 'chat' | 'join' | 'list' | 'moments' | 'xhs') => {
  currentMode.value = mode
}
</script>

<template>
  <div class="flex flex-col lg:flex-row h-screen overflow-hidden bg-[#2C3639]">
    <!-- Left: Preview Area -->
    <div class="flex-1 flex items-center justify-center relative transition-all duration-500 ease-out overflow-hidden">
      <!-- 预览容器：移动端全屏铺满，不使用 scale；PC端保持 1:1 或微调 -->
      <div class="w-full h-full lg:w-auto lg:h-auto flex items-center justify-center transition-all duration-500">
        <div class="w-full h-full lg:w-auto lg:h-auto lg:transform lg:scale-95 xl:scale-100 drop-shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
          <MomentsFrame v-if="isMomentsMode">
            <MomentsView />
          </MomentsFrame>
          <XhsFrame v-else-if="isXhsMode">
            <XhsView />
          </XhsFrame>
          <DeviceFrame v-else>
            <ChatListView v-if="isListMode" />
            <ChatView v-else />
          </DeviceFrame>
        </div>
      </div>
      
      <!-- Mobile Toggle Button (莫兰迪玻璃拟态风格) -->
      <button 
        @click="toggleEditor"
        class="lg:hidden fixed bottom-8 right-8 z-[60] w-16 h-16 rounded-2xl bg-[#7A9D8C]/80 backdrop-blur-xl text-white shadow-[0_8px_32px_rgba(122,157,140,0.4)] flex items-center justify-center transition-all active:scale-90 border border-white/20 group"
      >
        <div class="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <svg v-if="!isEditorOpen" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="relative z-10">
          <path d="M12 20h9"></path>
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
        </svg>
        <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="relative z-10">
          <path d="M18 6L6 18M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Right: Control Panel (PC: Static, Mobile: Elegant Bottom Sheet) -->
    <div 
      :class="[
        'fixed lg:relative bottom-0 left-0 w-full lg:w-[440px] bg-[#2C3639]/95 backdrop-blur-3xl border-t lg:border-l border-white/10 shadow-[-20px_0_60px_rgba(0,0,0,0.5)] transition-all duration-500 z-50 flex flex-col',
        isEditorOpen ? 'h-[88vh] rounded-t-[3rem]' : 'h-0 lg:h-full overflow-hidden lg:overflow-visible'
      ]"
    >
      <!-- Mobile Handle Bar (增加可交互感) -->
      <div @click="toggleEditor" class="lg:hidden w-full h-10 flex items-center justify-center cursor-pointer shrink-0">
        <div class="w-16 h-1.5 bg-white/10 rounded-full hover:bg-white/20 transition-colors"></div>
      </div>
      
      <!-- Header (移动端更紧凑) -->
      <div class="px-10 py-5 lg:py-8 border-b border-white/5 flex justify-between items-center shrink-0">
        <div>
          <h1 class="text-xl lg:text-2xl font-light tracking-wide text-[#E8F1F2]">
            WeChat<span class="font-bold text-[#7A9D8C]">Gen</span>
          </h1>
          <p class="text-white/40 text-[10px] tracking-wider mt-0.5 uppercase">Atmosphere Generator</p>
        </div>
        <router-link to="/treasure" class="text-xs text-[#7A9D8C] hover:text-white transition-colors flex items-center gap-1">
          <span>💎 藏宝库</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </router-link>
      </div>
      
      <!-- Scrollable Content -->
      <div class="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-hide">
        <ConfigPanel @modeChange="handleModeChange" />
        <ConfigFooter />
      </div>
    </div>
    
    <!-- Mobile Backdrop -->
    <div 
      v-if="isEditorOpen" 
      @click="toggleEditor"
      class="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
    ></div>
  </div>
</template>
