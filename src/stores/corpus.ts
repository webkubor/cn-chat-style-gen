import { defineStore } from 'pinia'
import { localDB } from '../utils/localdb'
import { PRESET_DIALOGUES, PRESET_NICKNAMES } from '../config/presets'
import { type CorpusItem, type NicknameItem } from '../types/database'

export type { CorpusItem, NicknameItem }

const getDialoguePresets = (): CorpusItem[] => {
  return PRESET_DIALOGUES.map((content, index) => ({
    id: -(index + 1),
    type: 'dialogue',
    content,
    preset: true
  }))
}

export const useCorpusStore = defineStore('corpus', {
  state: () => ({
    dialogues: [] as CorpusItem[],
    nicknames: [] as NicknameItem[],
    isReady: false
  }),

  actions: {
    async init() {
      await localDB.init()
      await this.loadAll()
      this.isReady = true
    },

    async loadAll() {
      const dialoguePresets = getDialoguePresets()
      const nicknamePresets = [...PRESET_NICKNAMES]

      const localDialogues = await this.fetchLocalDialogues()
      const localNicknames = await this.fetchLocalNicknames()

      this.dialogues = [...dialoguePresets, ...localDialogues]
      this.nicknames = [...nicknamePresets, ...localNicknames]
    },

    // --- 对话语料操作 ---

    async addDialogue(content: string) {
      if (!content.trim()) return
      await localDB.add({ type: 'dialogue', content, preset: false })
      await this.loadAll()
    },

    async deleteDialogue(item: CorpusItem) {
      if (item.preset) return
      if (item.id) await localDB.delete(item.id)
      await this.loadAll()
    },

    async clearDialogues() {
      await localDB.clear()
      await this.loadAll()
    },

    // --- 昵称操作 ---

    async addNickname(content: string) {
      if (!content.trim()) return
      await localDB.addNickname({ type: 'nickname', content, preset: false })
      await this.loadAll()
    },

    async deleteNickname(item: NicknameItem) {
      if (item.preset) return
      if (item.id) await localDB.deleteNickname(item.id)
      await this.loadAll()
    },

    async clearNicknames() {
      await localDB.clearNicknames()
      await this.loadAll()
    },

    // --- 导出导入 ---

    async exportAll() {
      return {
        dialogues: this.dialogues.map(i => i.content),
        nicknames: this.nicknames.map(i => i.content)
      }
    },

    async replaceAllDialogues(dialogues: string[]) {
      await this.clearDialogues()
      for (const t of dialogues) if (t.trim()) await this.addDialogue(t)
    },

    async replaceAllNicknames(nicknames: string[]) {
      await this.clearNicknames()
      for (const n of nicknames) if (n.trim()) await this.addNickname(n)
    },

    // --- 本地引擎 (IndexedDB) ---

    async fetchLocalDialogues(): Promise<CorpusItem[]> {
      const all = await localDB.getAll<CorpusItem>()
      return all.filter(i => i.type === 'dialogue')
    },

    async fetchLocalNicknames(): Promise<NicknameItem[]> {
      return await localDB.getAllNicknames()
    },
  }
})
