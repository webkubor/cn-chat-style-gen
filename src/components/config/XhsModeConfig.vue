<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useXhsStore } from '../../stores/xhs'
import { useSound } from '../../composables/useSound'
import AvatarLibrary from '../AvatarLibrary.vue'

const xhsStore = useXhsStore()
const { playSuccess, playWater } = useSound()

const MIN_NOTE_COUNT = 1
const MAX_NOTE_COUNT = 10

const authorName = ref(xhsStore.config.authorName)
const redNoteId = ref(xhsStore.config.redNoteId)
const noteCount = ref(xhsStore.config.noteCount)
const showAvatarLibrary = ref(false)

const titlesText = computed({
  get: () => xhsStore.config.titles.join('、'),
  set: (value: string) => {
    const titles = value.split(/[、,，\s]+/).filter(Boolean)
    if (titles.length > 0) {
      xhsStore.setConfig({ titles }, true)
    }
  }
})

const hashtagsText = computed({
  get: () => xhsStore.config.hashtags.join(' '),
  set: (value: string) => {
    const hashtags = value.split(/[\s,，、]+/).filter(Boolean)
    if (hashtags.length > 0) {
      xhsStore.setConfig({ hashtags }, true)
    }
  }
})

// 区间输入：[min, max]
const likeMin = ref(xhsStore.config.likeRange[0])
const likeMax = ref(xhsStore.config.likeRange[1])
const collectMin = ref(xhsStore.config.collectRange[0])
const collectMax = ref(xhsStore.config.collectRange[1])
const commentMin = ref(xhsStore.config.commentRange[0])
const commentMax = ref(xhsStore.config.commentRange[1])

const syncRanges = () => {
  xhsStore.setConfig({
    likeRange: [Math.max(0, likeMin.value), Math.max(likeMin.value + 1, likeMax.value)],
    collectRange: [Math.max(0, collectMin.value), Math.max(collectMin.value + 1, collectMax.value)],
    commentRange: [Math.max(0, commentMin.value), Math.max(commentMin.value + 1, commentMax.value)]
  }, false)
}

onMounted(async () => {
  await xhsStore.init()
  authorName.value = xhsStore.config.authorName
  redNoteId.value = xhsStore.config.redNoteId
  noteCount.value = xhsStore.config.noteCount
  likeMin.value = xhsStore.config.likeRange[0]
  likeMax.value = xhsStore.config.likeRange[1]
  collectMin.value = xhsStore.config.collectRange[0]
  collectMax.value = xhsStore.config.collectRange[1]
  commentMin.value = xhsStore.config.commentRange[0]
  commentMax.value = xhsStore.config.commentRange[1]
})

watch(authorName, (value) => {
  xhsStore.updateAuthorName(value)
})

watch(redNoteId, (value) => {
  xhsStore.setConfig({ redNoteId: value.trim() || '小红薯' })
})

watch(noteCount, (value) => {
  if (!Number.isFinite(value)) {
    noteCount.value = MIN_NOTE_COUNT
    return
  }
  const normalized = Math.min(MAX_NOTE_COUNT, Math.max(MIN_NOTE_COUNT, Math.round(value)))
  if (normalized !== value) {
    noteCount.value = normalized
  }
  xhsStore.setConfig({ noteCount: normalized }, true)
})

watch([likeMin, likeMax, collectMin, collectMax, commentMin, commentMax], () => {
  syncRanges()
})

const handleGenerate = () => {
  xhsStore.refreshPosts()
  playSuccess()
}

const handleClear = () => {
  xhsStore.clearPosts()
  playWater()
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center gap-2 mb-2">
      <div class="w-1 h-4 bg-[#FF2442] rounded-full"></div>
      <h3 class="text-sm font-medium text-white/80 tracking-wide">小红书设置</h3>
    </div>

    <div class="group">
      <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">博主昵称</label>
      <input
        v-model="authorName"
        type="text"
        placeholder="例如：CC的私房推荐"
        class="w-full bg-white/5 hover:bg-white/10 border border-transparent focus:border-[#FF2442]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-[#FF2442]/10 transition-all"
      />
    </div>

    <div class="group">
      <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">小红书号</label>
      <input
        v-model="redNoteId"
        type="text"
        placeholder="例如：xiaojing_vlog"
        class="w-full bg-white/5 hover:bg-white/10 border border-transparent focus:border-[#FF2442]/50 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-[#FF2442]/10 transition-all"
      />
    </div>

    <div>
      <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">博主头像</label>
      <div class="flex items-center gap-3">
        <button
          @click="showAvatarLibrary = true"
          class="relative w-[46px] h-[46px] bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl cursor-pointer transition-all group hover:border-[#FF2442]/50 overflow-hidden"
        >
          <span v-if="!xhsStore.config.authorAvatar" class="text-xs text-white/40 group-hover:text-[#FF2442] transition-colors">选择</span>
          <div v-else class="w-full h-full rounded-[10px] overflow-hidden">
            <img :src="xhsStore.config.authorAvatar" class="w-full h-full object-cover object-center" />
          </div>
        </button>
        <button
          @click="showAvatarLibrary = true"
          class="text-xs text-white/40 hover:text-[#FF2442] transition-colors"
        >
          从头像库选择
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-2 items-end">
      <div>
        <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">笔记条数</label>
        <input
          v-model.number="noteCount"
          type="number"
          :min="MIN_NOTE_COUNT"
          :max="MAX_NOTE_COUNT"
          class="w-full bg-white/5 hover:bg-white/10 border border-transparent focus:border-[#FF2442]/50 rounded-xl px-4 py-3 text-sm text-white text-center focus:outline-none focus:ring-4 focus:ring-[#FF2442]/10 transition-all"
        />
      </div>
      <button
        @click="handleGenerate"
        class="h-[46px] bg-[#FF2442]/60 hover:bg-[#FF2442]/80 text-white rounded-xl text-sm font-medium transition-all active:scale-[0.98]"
      >
        重新生成
      </button>
    </div>

    <div class="group">
      <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">标题词（、或空格分隔）</label>
      <textarea
        v-model="titlesText"
        rows="2"
        placeholder="这家民宿真的绝绝子、终于找到适合拍照的咖啡店"
        class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF2442]/50 transition-colors resize-none"
      ></textarea>
    </div>

    <div class="group">
      <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">话题标签（空格分隔）</label>
      <textarea
        v-model="hashtagsText"
        rows="2"
        placeholder="#日常分享 #种草 #好物分享"
        class="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#FF2442]/50 transition-colors resize-none"
      ></textarea>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">点赞区间</label>
        <div class="flex items-center gap-1">
          <input v-model.number="likeMin" type="number" min="0" class="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-[#FF2442]/50" />
          <span class="text-white/30 text-xs">~</span>
          <input v-model.number="likeMax" type="number" min="0" class="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-[#FF2442]/50" />
        </div>
      </div>
      <div>
        <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">收藏区间</label>
        <div class="flex items-center gap-1">
          <input v-model.number="collectMin" type="number" min="0" class="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-[#FF2442]/50" />
          <span class="text-white/30 text-xs">~</span>
          <input v-model.number="collectMax" type="number" min="0" class="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-[#FF2442]/50" />
        </div>
      </div>
    </div>

    <div class="group">
      <label class="block text-[10px] font-medium text-white/40 uppercase tracking-widest mb-2">评论条数区间</label>
      <div class="flex items-center gap-2">
        <input v-model.number="commentMin" type="number" min="0" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-[#FF2442]/50" />
        <span class="text-white/30 text-xs">~</span>
        <input v-model.number="commentMax" type="number" min="0" class="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white text-center focus:outline-none focus:border-[#FF2442]/50" />
      </div>
    </div>

    <button
      @click="handleClear"
      class="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-xl font-medium text-sm border border-red-400/20 transition-all active:scale-[0.98]"
    >
      清空笔记
    </button>

    <AvatarLibrary
      v-if="showAvatarLibrary"
      :model-value="xhsStore.config.authorAvatar"
      @update:modelValue="xhsStore.updateAuthorAvatar"
      @close="showAvatarLibrary = false"
    />
  </div>
</template>