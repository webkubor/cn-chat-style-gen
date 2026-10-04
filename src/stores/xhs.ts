import { defineStore } from 'pinia'
import { localDB } from '../utils/localdb'
import { useAvatarStore } from './avatar'
import { randomAvatarService } from '../utils/randomAvatar'
import type { XhsConfig, XhsPost, XhsComment, XhsSession } from '../types/database'

// --- 预置数据：贴近小红书种草笔记的真实语境 ---

const PRESET_TITLES = [
  '这家民宿真的绝绝子',
  '终于找到适合拍照的咖啡店',
  '救命这套穿搭也太显瘦了',
  '被问了100遍的小众景点',
  '这家店我已经回购第5次了',
  '通勤包新宠｜容量大颜值高',
  '减脂期也可以吃的零食清单',
  '周末宅家也能拍出氛围感',
  '北京最值得去的5家独立书店',
  '初秋卫衣合集｜均价不过百'
]

const PRESET_HASHTAGS = [
  '#日常分享',
  '#种草',
  '#好物分享',
  '#生活方式',
  '#周末去哪儿',
  '#美食推荐',
  '#穿搭灵感',
  '#家居好物',
  '#旅行日记',
  '#摄影技巧',
  '#减脂日记',
  '#自律生活'
]

const PRESET_CONTENT_TEMPLATES = [
  '今天终于打卡了这家{topic}，从进门开始就一直在拍，根本停不下来✨',
  '{topic}｜姐妹们冲就完了！亲测踩雷率0%',
  '来交作业啦📝 {topic}全部整理好了，建议收藏慢慢看',
  '本来是随便逛逛，没想到{topic}这么惊喜，已经推荐给所有朋友了',
  '救命！{topic}也太好用了吧，后悔没早点发现😭',
  '今日份的快乐是{topic}带来的❤️ 答应我一定要去试试'
]

const PRESET_REDNOTE_IDS = [
  'xiaojing_vlog',
  'CC的私房推荐',
  '小红薯_90',
  'tiantian_daily',
  'Mango爱生活',
  'JunJun逛吃记'
]

const COMMENT_TEMPLATES = [
  '求链接求链接！！',
  '这是什么神仙好物',
  '姐妹冲就完了',
  '收藏了，回头慢慢看',
  '已下单，等我反馈',
  '你分享的东西从来不踩雷',
  '地址在哪呀求分享',
  '真的太懂我们这些人了',
  '已截图发给闺蜜',
  '这个价格也太划算了吧'
]

const randomInt = (min: number, max: number) => {
  const a = Math.max(0, Math.floor(min))
  const b = Math.max(a + 1, Math.floor(max))
  return a + Math.floor(Math.random() * (b - a))
}

const pickRandom = <T>(list: T[], fallback: T): T => {
  if (list.length === 0) return fallback
  return list[Math.floor(Math.random() * list.length)] || fallback
}

const formatTime = () => {
  const dayOffset = Math.floor(Math.random() * 5)
  const hours = Math.floor(Math.random() * 24).toString().padStart(2, '0')
  const minutes = Math.floor(Math.random() * 60).toString().padStart(2, '0')
  if (dayOffset === 0) return `今天 ${hours}:${minutes}`
  if (dayOffset === 1) return `昨天 ${hours}:${minutes}`
  if (dayOffset === 2) return `前天 ${hours}:${minutes}`
  return `${dayOffset}天前`
}

// 封面 token：渐变色块生成器
const createCoverToken = (seed: number, label: string) => {
  const hueA = (seed * 47) % 360
  const hueB = (hueA + 36) % 360
  return `${seed}|${hueA}|${hueB}|${label}`
}

const parseCoverToken = (token: string) => {
  const [seedRaw, hueARaw, hueBRaw, ...labelParts] = token.split('|')
  const seed = Number(seedRaw) || 1
  const hueA = Number(hueARaw) || 200
  const hueB = Number(hueBRaw) || 240
  const label = labelParts.join('|') || '种草笔记'
  return {
    label: label.length > 6 ? `${label.slice(0, 6)}…` : label,
    style: {
      background: `linear-gradient(135deg, hsl(${hueA} 70% 78%), hsl(${hueB} 65% 58%))`
    },
    seed
  }
}

const makeComments = (count: number): XhsComment[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: `xhs_c_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
    userName: pickRandom(PRESET_REDNOTE_IDS, '小红薯'),
    content: pickRandom(COMMENT_TEMPLATES, '赞')
  }))
}

export const useXhsStore = defineStore('xhs', {
  state: () => ({
    config: {
      authorName: '种草小达人',
      authorAvatar: '',
      redNoteId: 'xiaojing_vlog',
      noteCount: 4,
      titles: [...PRESET_TITLES].slice(0, 3),
      hashtags: [...PRESET_HASHTAGS].slice(0, 4),
      likeRange: [88, 9999] as [number, number],
      collectRange: [12, 2333] as [number, number],
      commentRange: [3, 88] as [number, number]
    } as XhsConfig,
    posts: [] as XhsPost[]
  }),

  actions: {
    async init() {
      try {
        const avatarStore = useAvatarStore()
        await avatarStore.init()

        const saved = await localDB.loadXhsSession()
        if (saved) {
          this.config = saved.config || this.config
          this.posts = saved.posts || []
        }

        if (!this.config.authorAvatar) {
          const firstAvatar = avatarStore.customAvatars[0]?.url
          this.config.authorAvatar = firstAvatar || randomAvatarService.generateRandomAvatar()
        }

        if (this.posts.length === 0) {
          this.generatePosts()
        }
      } catch (error) {
        console.error('加载小红书会话失败', error)
        this.generatePosts()
      }
    },

    async save() {
      try {
        const payload: XhsSession = {
          key: 'current',
          config: JSON.parse(JSON.stringify(this.config)),
          posts: JSON.parse(JSON.stringify(this.posts)),
          updated_at: new Date()
        }
        await localDB.saveXhsSession(payload)
      } catch (error) {
        console.error('保存小红书会话失败', error)
      }
    },

    setConfig(patch: Partial<XhsConfig>, shouldRegenerate = false) {
      this.config = { ...this.config, ...patch }
      if (shouldRegenerate) {
        this.generatePosts()
        return
      }
      this.save()
    },

    updateAuthorName(name: string) {
      const next = name.trim() || '种草小达人'
      this.config = { ...this.config, authorName: next }
      this.posts = this.posts.map((p) => ({ ...p, authorName: next }))
      this.save()
    },

    updateAuthorAvatar(url: string) {
      this.config = { ...this.config, authorAvatar: url }
      this.posts = this.posts.map((p) => ({ ...p, authorAvatar: url }))
      this.save()
    },

    updatePostTitle(id: string, title: string) {
      const post = this.posts.find((p) => p.id === id)
      if (!post) return
      post.title = title
      this.save()
    },

    updatePostContent(id: string, content: string) {
      const post = this.posts.find((p) => p.id === id)
      if (!post) return
      post.content = content
      this.save()
    },

    clearPosts() {
      this.posts = []
      this.save()
    },

    refreshPosts() {
      this.generatePosts()
    },

    generatePosts() {
      const {
        authorName,
        authorAvatar,
        redNoteId,
        noteCount,
        titles,
        hashtags,
        likeRange,
        collectRange,
        commentRange
      } = this.config

      const nextPosts: XhsPost[] = []

      for (let i = 0; i < noteCount; i++) {
        const title = pickRandom(titles, '今日份的种草分享')
        const pickedHashtags = [...hashtags]
          .sort(() => Math.random() - 0.5)
          .slice(0, Math.min(3, hashtags.length))

        const template = pickRandom(PRESET_CONTENT_TEMPLATES, '分享一个超棒的发现')
        const content = template.replace('{topic}', title.replace(/[✨❤️😭📝]/g, '').slice(0, 6))

        const imageCountPick = pickRandom([1, 3, 6, 9], 3)
        const images = Array.from({ length: imageCountPick }, (_, index) =>
          createCoverToken(i * 31 + index + 1, title)
        )

        const cover = createCoverToken(i * 17 + 1, title)

        nextPosts.push({
          id: `xhs_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 8)}`,
          title,
          cover,
          content: `${content} ${pickedHashtags.join(' ')}`,
          hashtags: pickedHashtags,
          authorName: authorName || '种草小达人',
          authorAvatar: authorAvatar || randomAvatarService.generateRandomAvatar(),
          redNoteId: redNoteId || pickRandom(PRESET_REDNOTE_IDS, '小红薯'),
          images,
          time: formatTime(),
          likes: randomInt(likeRange[0], likeRange[1] + 1),
          collects: randomInt(collectRange[0], collectRange[1] + 1),
          comments: makeComments(randomInt(commentRange[0], commentRange[1] + 1))
        })
      }

      this.posts = nextPosts
      this.save()
    }
  }
})

// 导出 cover token 解析器，方便 XhsView 复用
export { parseCoverToken }