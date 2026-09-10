<script setup lang="ts">
import type { NicknameItem } from '../../stores/corpus'

defineProps<{
  items: NicknameItem[]
}>()

const emit = defineEmits<{
  (e: 'delete', item: NicknameItem): void
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <div
      v-for="item in items"
      :key="item.id"
      class="group relative inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 border border-transparent hover:border-white/10 transition-all"
    >
      <span 
        class="text-sm text-white/80"
        :class="item.preset ? 'text-white/40' : ''"
      >
        {{ item.content }}
      </span>
      <button
        v-if="!item.preset"
        @click="emit('delete', item)"
        class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-white/10 text-white/40 text-[10px] flex items-center justify-center hover:bg-red-500/80 hover:text-white transition-all opacity-0 group-hover:opacity-100"
      >
        ×
      </button>
      <span
        v-else
        class="text-[9px] text-white/20 uppercase tracking-wider"
      >
        预设
      </span>
    </div>
  </div>
</template>
