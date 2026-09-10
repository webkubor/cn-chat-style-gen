<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useCorpusStore, type CorpusItem, type NicknameItem } from '../stores/corpus'
import { useAvatarStore } from '../stores/avatar'
import NicknameGrid from '../components/ui/NicknameGrid.vue'
import { useSound } from '../composables/useSound'
import { useUpload } from '../composables/useUpload'

type TabType = 'dialogues' | 'nicknames' | 'avatars'


const corpusStore = useCorpusStore()
const avatarStore = useAvatarStore()
const { playSuccess, playClick, playWater } = useSound()
const { isUploading, processFile } = useUpload()
const newContent = ref('')
const isBusy = ref(false)
const importInput = ref<HTMLInputElement | null>(null)
const avatarUploadInput = ref<HTMLInputElement | null>(null)
const currentTab = ref<TabType>('dialogues')
const dialogueItems = computed(() => corpusStore.dialogues)
const nicknameItems = computed(() => corpusStore.nicknames)
const customAvatars = computed(() => avatarStore.customAvatars)
const customAvatarCount = computed(() => avatarStore.totalCustomCount)
const canUploadMore = computed(() => avatarStore.canAddMore)
const canDeleteAvatar = computed(() => customAvatarCount.value >= 10)
// 语料只存本机 IndexedDB，没有第二个存储位置，所以这个标签是常量而非状态
const currentModeLabel = '本地私享'

const MAX_AVATAR_SIZE_MB = 5

onMounted(() => {
  corpusStore.init()
  avatarStore.init()
})

const handleAdd = async () => {
  if (!newContent.value) return
  if (currentTab.value === 'dialogues') {
    await corpusStore.addDialogue(newContent.value)
  } else if (currentTab.value === 'nicknames') {
    await corpusStore.addNickname(newContent.value)
  }
  newContent.value = ''
}

const handleDelete = async (item: CorpusItem | NicknameItem) => {
  if (item.preset) return
  const typeLabel = currentTab.value === 'dialogues' ? '语料' : '昵称'
  const confirmed = window.$confirm
    ? await window.$confirm({
        title: '确认删除？',
        message: `确定要从【${currentModeLabel}】删除这条${typeLabel}吗？`,
        confirmText: '删除',
        cancelText: '取消',
        confirmType: 'danger'
      })
    : false

  if (!confirmed) return
  
  if (currentTab.value === 'dialogues') {
    await corpusStore.deleteDialogue(item as CorpusItem)
  } else if (currentTab.value === 'nicknames') {
    await corpusStore.deleteNickname(item as NicknameItem)
  }
}

const handleDeleteAvatar = async (id: string) => {
  if (!canDeleteAvatar.value) {
    window.$message?.info('头像少于 10 个时不允许删除')
    return
  }

  const confirmed = window.$confirm
    ? await window.$confirm({
        title: '确认删除？',
        message: '确定要删除这个头像吗？',
        confirmText: '删除',
        cancelText: '取消',
        confirmType: 'danger'
      })
    : false

  if (!confirmed) return

  const removed = await avatarStore.removeCustomAvatar(id)
  if (!removed) {
    window.$message?.info('头像少于 10 个时不允许删除')
    return
  }

  window.$message?.success('删除成功')
}


const handleClearAll = async () => {
  const typeLabel = currentTab.value === 'dialogues'
    ? '语料'
    : currentTab.value === 'nicknames'
      ? '昵称'
      : '头像'
  const msg = currentTab.value === 'avatars'
    ? '确定要清空所有自定义头像吗？'
    : `确定要清空本机所有自定义${typeLabel}吗？`
  
  const confirmed = window.$confirm
    ? await window.$confirm({
        title: '确认清空？',
        message: msg,
        confirmText: '清空',
        cancelText: '取消',
        confirmType: 'danger'
      })
    : false

  if (!confirmed) return
  
  isBusy.value = true
  try {
    if (currentTab.value === 'dialogues') {
      await corpusStore.clearDialogues()
    } else if (currentTab.value === 'nicknames') {
      await corpusStore.clearNicknames()
    } else {
      await avatarStore.clearCustomAvatars()
    }
  } finally {
    isBusy.value = false
  }
}

const handleExport = async () => {
  if (currentTab.value === 'avatars') return
  isBusy.value = true
  try {
    const data = await corpusStore.exportAll()
    const exportData = currentTab.value === 'dialogues' 
      ? { dialogues: data.dialogues }
      : { nicknames: data.nicknames }
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const link = document.createElement('a')
    link.download = `wechat-${currentTab.value}-${Date.now()}.json`
    link.href = URL.createObjectURL(blob)
    link.click()
    URL.revokeObjectURL(link.href)
  } finally {
    isBusy.value = false
  }
}

const handleImportClick = () => {
  importInput.value?.click()
}

const handleImport = async (e: Event) => {
  if (currentTab.value === 'avatars') return
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  isBusy.value = true
  try {
    const text = await file.text()
    const parsed = JSON.parse(text)
    const list = Array.isArray(parsed) ? parsed : (parsed.dialogues || parsed.nicknames || [])
    
    if (currentTab.value === 'dialogues') {
      await corpusStore.replaceAllDialogues(list)
    } else {
      await corpusStore.replaceAllNicknames(list)
    }
    window.$message.success(`成功导入到【${currentModeLabel}】`)
  } catch (err) {
    window.$message.error('导入失败：请确认文件格式为 JSON 数组')
  } finally {
    isBusy.value = false
    if (importInput.value) importInput.value.value = ''
  }
}

const placeholderText = computed(() => {
  if (currentTab.value === 'dialogues') return '输入新的对话语料...'
  if (currentTab.value === 'nicknames') return '输入新的昵称...'
  return '头像库不需要手动添加'
})

const onClearAllClick = async () => {
  await handleClearAll()
  playWater()
}

const onExportClick = async () => {
  await handleExport()
  playSuccess()
}

const onImportClick = () => {
  handleImportClick()
  playClick()
}

const triggerAvatarUpload = () => {
  if (!avatarStore.canAddMore) {
    window.$message?.error('头像库已满（最多 100 个）')
    return
  }
  avatarUploadInput.value?.click()
}

const handleAvatarUpload = async (e: Event) => {
  if (!avatarStore.canAddMore) {
    window.$message?.error('头像库已满（最多 100 个）')
    return
  }

  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const url = await processFile(file, MAX_AVATAR_SIZE_MB)
  if (url) {
    const added = await avatarStore.addCustomAvatar(url)
    if (!added) {
      window.$message?.error('头像库已满（最多 100 个）')
    }
  }
  input.value = ''
}

const onAddClick = async () => {
  if (currentTab.value === 'avatars') {
    window.$message?.info('头像库请通过上传添加')
    return
  }
  await handleAdd()
  playSuccess()
}
</script>

<template>
  <div class="flex flex-col h-screen overflow-hidden p-6 lg:p-10 max-w-5xl mx-auto w-full">
    
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <div class="flex items-center gap-4 mb-1">
          <h1 class="text-3xl font-light text-[#E8F1F2] tracking-wide">
            藏宝<span class="font-bold text-[#7A9D8C]">库</span>
          </h1>
          <span class="bg-black/20 px-3 py-1 rounded-lg text-[10px] font-medium backdrop-blur-sm border border-white/5 text-[#7A9D8C]">本地私享</span>
        </div>
        <p class="text-white/40 text-sm tracking-widest flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-[#7A9D8C]"></span>
          数据只存在这台设备上，不上传
        </p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="onClearAllClick" :disabled="isBusy" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white transition-all disabled:opacity-50">清空</button>
        <button @click="onExportClick" :disabled="isBusy || currentTab === 'avatars'" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white transition-all disabled:opacity-50">导出</button>
        <button @click="onImportClick" :disabled="isBusy || currentTab === 'avatars'" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs text-white transition-all disabled:opacity-50">导入</button>
        <input ref="importInput" type="file" accept="application/json" class="hidden" @change="handleImport" />
        <router-link to="/" class="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm text-white transition-all flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"></path></svg>
          返回
        </router-link>
      </div>
    </div>

    <!-- Tab Switcher -->
    <div class="flex gap-2 mb-4">
      <button
        @click="currentTab = 'dialogues'"
        class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
        :class="currentTab === 'dialogues' ? 'bg-[#7A9D8C] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'"
      >
        语料库
      </button>
      <button
        @click="currentTab = 'nicknames'"
        class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
        :class="currentTab === 'nicknames' ? 'bg-[#7A9D8C] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'"
      >
        昵称库
      </button>
      <button
        @click="currentTab = 'avatars'"
        class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
        :class="currentTab === 'avatars' ? 'bg-[#7A9D8C] text-white' : 'bg-white/5 text-white/60 hover:bg-white/10'"
      >
        头像库
      </button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden flex flex-col shadow-2xl relative transition-colors duration-500">
      
      <!-- Add Input -->
       <div class="p-6 border-b border-white/10 bg-black/10 relative z-10">
        <div v-if="currentTab !== 'avatars'" class="flex gap-4">
          <input 
            v-model="newContent"
            @keyup.enter="onAddClick"
            type="text" 
            :placeholder="placeholderText"
            class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none transition-all"
            :class="'focus:border-[#7A9D8C]/50'"
          />
          <button 
            @click="onAddClick"
            class="px-6 py-2 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 bg-[#7A9D8C] hover:bg-[#6B8E78]"
          >
            添加
          </button>
        </div>
        <div v-else class="flex items-center justify-between gap-4">
          <div>
            <p class="text-sm text-white/80">头像库管理</p>
            <p class="text-xs text-white/30">自定义头像最多 100 个，单张不超过 5MB</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-white/40">{{ customAvatarCount }}/100</span>
            <button 
              @click="triggerAvatarUpload"
              :disabled="isUploading || !canUploadMore"
              class="px-4 py-2 text-white rounded-xl text-xs font-semibold shadow-lg transition-all disabled:opacity-50"
              :class="canUploadMore ? 'bg-[#7A9D8C] hover:bg-[#6B8E78]' : 'bg-white/10'
              "
            >
              {{ isUploading ? '上传中...' : '上传头像' }}
            </button>
            <input
              ref="avatarUploadInput"
              type="file"
              accept="image/*"
              @change="handleAvatarUpload"
              class="hidden"
            />
          </div>
        </div>
      </div>

      <!-- List -->
      <div class="flex-1 overflow-y-auto p-6 scrollbar-hide relative z-10">
        <!-- 语料库：列表形式 -->
        <div v-if="currentTab === 'dialogues'" class="space-y-3">

          <div 
            v-for="item in dialogueItems" 
            :key="item.id"
            class="group flex items-center justify-between p-4 bg-white/5 rounded-xl border border-transparent hover:border-white/10 transition-all"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span 
                class="px-2 py-0.5 text-[10px] rounded-full border uppercase tracking-widest"
                :class="item.preset ? 'border-white/20 text-white/40' : 'border-[#7A9D8C]/50 text-[#7A9D8C]'"
              >
                {{ item.preset ? '系统' : '用户' }}
              </span>
              <p class="text-sm text-white/80 font-light tracking-wide select-all truncate">{{ item.content }}</p>
            </div>
            <button 
              v-if="!item.preset"
              @click="handleDelete(item)"
              class="text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 p-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
          
          <div v-if="dialogueItems.length === 0" class="text-center py-20 text-white/20 text-sm">
            暂无语料，请添加
          </div>
        </div>

        <!-- 昵称库：标签形式 -->
        <div v-else-if="currentTab === 'nicknames'" class="pb-4">
          <NicknameGrid 
            :items="nicknameItems" 
            @delete="handleDelete"
          />
          <div v-if="nicknameItems.length === 0" class="text-center py-20 text-white/20 text-sm">
            暂无昵称，请添加
          </div>
        </div>

        <!-- 头像库 -->
        <div v-else class="space-y-6">
          <div class="flex items-center justify-between">
            <span class="text-xs text-white/30">当前 {{ customAvatarCount }} 个</span>
          </div>

          <div v-if="customAvatars.length" class="grid grid-cols-6 gap-4">
            <div
              v-for="avatar in customAvatars"
              :key="avatar.id"
              class="group relative aspect-square rounded-2xl overflow-hidden border border-white/10"
            >
              <img :src="avatar.url" class="w-full h-full object-cover" />
              <button
                @click="handleDeleteAvatar(avatar.id)"
                :disabled="!canDeleteAvatar"
                class="absolute top-2 right-2 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18M8 6v12m8-12v12M5 6l1-2h12l1 2"></path>
                </svg>
              </button>
            </div>
          </div>
          <div v-else class="text-center py-20 text-white/20 text-sm">
            暂无头像，请上传
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
