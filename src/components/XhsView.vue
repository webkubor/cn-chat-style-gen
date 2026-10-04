<script setup lang="ts">
import { onMounted } from 'vue'
import { useXhsStore, parseCoverToken } from '../stores/xhs'

const xhsStore = useXhsStore()

onMounted(() => {
  xhsStore.init()
})

// 渲染 cover 的色块 + 标签浮层
const renderCover = (token: string) => parseCoverToken(token)

// 内容里识别 #话题词，蓝色高亮
const highlightHashtags = (text: string): Array<{ type: 'text' | 'tag'; value: string }> => {
  const tokens = text.split(/(#[\u4e00-\u9fa5A-Za-z0-9_]+)/g)
  return tokens
    .filter((t) => t.length > 0)
    .map((value) => ({
      type: value.startsWith('#') ? 'tag' : 'text',
      value
    }))
}

// 数字格式：1234 -> 1.2k, 12000 -> 1.2w
const formatCount = (n: number): string => {
  if (n < 1000) return String(n)
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}w`
}

const getImageGridClass = (count: number) => {
  if (count <= 1) return 'grid-cols-1 max-w-[180px]'
  if (count === 2 || count === 4) return 'grid-cols-2 max-w-[200px]'
  return 'grid-cols-3 max-w-[240px]'
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain')
  if (text) {
    document.execCommand('insertText', false, text)
  }
}

const onTitleBlur = (id: string, event: Event) => {
  const target = event.target as HTMLElement
  xhsStore.updatePostTitle(id, target.innerText)
}

const onContentBlur = (id: string, event: Event) => {
  const target = event.target as HTMLElement
  xhsStore.updatePostContent(id, target.innerText)
}
</script>

<template>
  <div class="min-h-full bg-white">
    <div class="px-3 py-3 space-y-4">
      <article
        v-for="post in xhsStore.posts"
        :key="post.id"
        class="bg-white rounded-2xl overflow-hidden border border-black/[0.04] shadow-[0_4px_14px_rgba(0,0,0,0.04)]"
      >
        <!-- 封面：3:4 色块 + 标题浮层 -->
        <div class="relative w-full aspect-[3/4] overflow-hidden">
          <div
            class="absolute inset-0"
            :style="renderCover(post.cover).style"
          ></div>
          <div class="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent"></div>
          <div class="absolute left-3 right-3 bottom-3">
            <div
              class="text-white text-[17px] font-bold leading-[1.35] line-clamp-2 outline-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
            contenteditable
            @blur="(event) => onTitleBlur(post.id, event)"
            @paste="handlePaste"
            >
              {{ post.title }}
            </div>
            <div class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/35 backdrop-blur-sm">
              <span class="text-[10px] text-white/90 font-semibold">{{ renderCover(post.cover).label }}</span>
            </div>
          </div>
        </div>

        <!-- 标题 + 作者 + 互动 -->
        <div class="px-3 pt-3 pb-2">
          <p class="text-[14px] font-semibold text-[#1a1a1a] leading-snug line-clamp-2">
            {{ post.title }}
          </p>

          <!-- 作者信息行 -->
          <div class="mt-2.5 flex items-center gap-2.5">
            <div class="relative shrink-0">
              <div class="w-8 h-8 rounded-full overflow-hidden bg-[#f0f0f3] border border-black/[0.04]">
                <img v-if="post.authorAvatar" :src="post.authorAvatar" class="w-full h-full object-cover" alt="avatar" />
                <div v-else class="w-full h-full bg-[#e5e5e8]"></div>
              </div>
              <!-- 小红薯徽标 -->
              <div class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#FF2442] flex items-center justify-center ring-1.5 ring-white">
                <span class="text-[7px] text-white font-black">薯</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[12px] text-[#222] font-medium truncate">{{ post.authorName }}</p>
              <p class="text-[10px] text-[#999] truncate">小红书号：{{ post.redNoteId }}</p>
            </div>
            <button class="shrink-0 px-3 py-1 rounded-full bg-[#FF2442] text-white text-[11px] font-semibold tracking-wide">
              关注
            </button>
          </div>

          <!-- 正文：识别 #话题词 蓝色 -->
          <div
            class="mt-2.5 text-[13px] leading-[1.55] text-[#333] outline-none whitespace-pre-wrap"
            @blur="(event) => onContentBlur(post.id, event)"
            @paste="handlePaste"
            contenteditable
          >
            <template v-for="(token, idx) in highlightHashtags(post.content)" :key="idx">
              <span
                v-if="token.type === 'tag'"
                class="text-[#3B82F6] font-medium"
              >{{ token.value }}</span>
              <span v-else>{{ token.value }}</span>
            </template>
          </div>

          <!-- 正文配图宫格 -->
          <div
            v-if="post.images.length > 0"
            class="grid gap-1 mt-2.5"
            :class="getImageGridClass(post.images.length)"
          >
            <div
              v-for="(imageToken, imgIdx) in post.images"
              :key="`${post.id}-img-${imgIdx}`"
              class="aspect-square rounded-lg overflow-hidden relative"
              :style="renderCover(imageToken).style"
            >
              <div class="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent"></div>
            </div>
          </div>

          <!-- 底部时间 + 互动三栏 -->
          <div class="mt-2.5 flex items-center text-[10px] text-[#a0a0a8]">
            <span>{{ post.time }}</span>
            <span class="mx-1.5">·</span>
            <span>来自小红书</span>
          </div>

          <div class="mt-2 pt-2 border-t border-black/[0.05] flex items-center justify-around text-[12px] text-[#666]">
            <span class="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>{{ formatCount(post.comments.length) }}</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <span>{{ formatCount(post.likes) }}</span>
            </span>
            <span class="inline-flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              <span>{{ formatCount(post.collects) }}</span>
            </span>
          </div>
        </div>
      </article>

      <p v-if="xhsStore.posts.length === 0" class="text-center text-[12px] text-[#949aa6] py-12">
        暂无笔记，去右侧点击生成
      </p>

      <div v-if="xhsStore.posts.length > 0" class="text-center text-[10px] text-[#c8c8cf] py-4 tracking-wide">
        — 已显示全部 {{ xhsStore.posts.length }} 条 —
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>