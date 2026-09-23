<script setup lang="ts">
import { ref, watch } from 'vue'
import { useChatStore } from '../stores/chat'
import { useChatListStore } from '../stores/chatList'
import { useMomentsStore } from '../stores/moments'
import { useXhsStore } from '../stores/xhs'
import { useExport } from '../composables/useExport'

// 子组件导入
import BasicConfig from './config/BasicConfig.vue'
import ExportConfig from './config/ExportConfig.vue'
import ChatModeConfig from './config/ChatModeConfig.vue'
import JoinModeConfig from './config/JoinModeConfig.vue'
import ChatListModeConfig from './config/ChatListModeConfig.vue'
import MomentsModeConfig from './config/MomentsModeConfig.vue'
import XhsModeConfig from './config/XhsModeConfig.vue'

const chatStore = useChatStore()
const chatListStore = useChatListStore()
const momentsStore = useMomentsStore()
const xhsStore = useXhsStore()

const emit = defineEmits<{
  modeChange: [mode: 'chat' | 'join' | 'list' | 'moments' | 'xhs']
}>()

const currentMode = ref<'chat' | 'join' | 'list' | 'moments' | 'xhs'>('chat')

// 逻辑逻辑抽离 (现在不需要 showToast 了，由全局 window.$message 处理)
const { isDownloading, isQueueing, exportIndex, queue, handleQuickDownload, addToQueue, removeFromQueue, clearQueue, handleBatchDownload } = useExport()

// 监听模式切换
watch(currentMode, (newMode) => {
  emit('modeChange', newMode)
  if (newMode === 'list') {
    chatListStore.init()
  } else if (newMode === 'moments') {
    momentsStore.init()
  } else if (newMode === 'xhs') {
    xhsStore.init()
  } else {
    chatStore.clearMessages()
    if (newMode === 'join') {
      chatStore.batchAddJoinMessages(10)
    } else {
      chatStore.batchAddRandomDialog(10)
    }
  }
})
</script>

<template>
  <div class="space-y-8 relative">
    <!-- 模式切换 -->
    <div class="group">
      <div class="bg-black/20 p-1.5 rounded-2xl flex relative overflow-hidden backdrop-blur-sm">
        <button @click="currentMode = 'chat'" class="flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all duration-500 relative z-10" :class="currentMode === 'chat' ? 'text-white shadow-lg' : 'text-white/40 hover:text-white/60'">对话</button>
        <button @click="currentMode = 'join'" class="flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all duration-500 relative z-10" :class="currentMode === 'join' ? 'text-white shadow-lg' : 'text-white/40 hover:text-white/60'">拉人</button>
        <button @click="currentMode = 'list'" class="flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all duration-500 relative z-10" :class="currentMode === 'list' ? 'text-white shadow-lg' : 'text-white/40 hover:text-white/60'">列表</button>
        <button @click="currentMode = 'moments'" class="flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all duration-500 relative z-10" :class="currentMode === 'moments' ? 'text-white shadow-lg' : 'text-white/40 hover:text-white/60'">朋友圈</button>
        <button @click="currentMode = 'xhs'" class="flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all duration-500 relative z-10" :class="currentMode === 'xhs' ? 'text-white shadow-lg' : 'text-white/40 hover:text-white/60'">小红书</button>
        <div class="absolute top-1.5 bottom-1.5 w-[calc(20%-4.8px)] rounded-xl transition-all duration-500 ease-spring"
             :class="[
               currentMode === 'xhs' ? 'bg-[#FF2442]' : 'bg-[#7A9D8C]',
               currentMode === 'chat' ? 'left-1.5' :
               currentMode === 'join' ? 'left-[calc(20%+1.5px)]' :
               currentMode === 'list' ? 'left-[calc(40%+1.2px)]' :
               currentMode === 'moments' ? 'left-[calc(60%+0.9px)]' :
               'left-[calc(80%+0.6px)]'
             ]"></div>
      </div>
    </div>

    <!-- 1. 内容设置模块 -->
    <ChatModeConfig v-if="currentMode === 'chat'" />
    <JoinModeConfig v-if="currentMode === 'join'" />
    <ChatListModeConfig v-if="currentMode === 'list'" />
    <MomentsModeConfig v-if="currentMode === 'moments'" />
    <XhsModeConfig v-if="currentMode === 'xhs'" />

    <!-- 2. 外观设置模块 -->
    <BasicConfig />

    <!-- 3. 导出与操作模块 -->
    <ExportConfig
      v-model:exportIndex="exportIndex"
      v-model:isDownloading="isDownloading"
      v-model:isQueueing="isQueueing"
      v-model:queue="queue"
      @quick-download="handleQuickDownload"
      @add-to-queue="addToQueue"
      @remove-from-queue="removeFromQueue"
      @clear-queue="clearQueue"
      @batch-download="handleBatchDownload"
    />
  </div>
</template>

<style scoped>
.ease-spring {
  transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>
