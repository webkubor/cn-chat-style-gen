// 项目自托管图床 —— webkubor/picx-images-hosting 的 person/ 目录
//
// 真人头像，16 张 JPG（01–16.jpg），可直接挂在 random 头像池里。
// 不再依赖 DiceBear / randomuser.me / avatars.githubusercontent.com 等公共源。
export interface RandomAvatarSource {
  name: string
  avatars: string[]
  description: string
  totalCount: number
}

function isValidRandomAvatarSource(obj: any): obj is RandomAvatarSource {
  return obj &&
         typeof obj === 'object' &&
         typeof obj.name === 'string' &&
         Array.isArray(obj.avatars) &&
         typeof obj.description === 'string' &&
         typeof obj.totalCount === 'number'
}

// picx-images-hosting /person 共 16 张（01.jpg – 16.jpg）
// URL 走 jsdelivr CDN —— 与 webkubor 生态其他项目（typora-Bloom-theme /
// dsh-bloom-theme 等）的资源引用方式一致；raw.githubusercontent.com 也可用但
// 走 jsdelivr 有全球 CDN 加速和无 CORS / 限流问题。
const PICS_PERSON_COUNT = 16
const PICS_BASE_URL = 'https://cdn.jsdelivr.net/gh/webkubor/picx-images-hosting@master/person'

const PERSON_AVATARS: string[] = Array.from({ length: PICS_PERSON_COUNT }, (_, i) => {
  const n = String(i + 1).padStart(2, '0')
  return `${PICS_BASE_URL}/${n}.jpg`
})

export const RANDOM_AVATAR_SOURCES: RandomAvatarSource[] = [
  {
    name: '项目图床',
    avatars: PERSON_AVATARS,
    description: `picx-images-hosting/person · ${PICS_PERSON_COUNT} 张`,
    totalCount: PICS_PERSON_COUNT
  }
]

export class RandomAvatarService {
  private currentSource: RandomAvatarSource = RANDOM_AVATAR_SOURCES[0]!
  private shuffledAvatars: string[] = []

  constructor() {
    const saved = localStorage.getItem('randomAvatarSource')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (isValidRandomAvatarSource(parsed)) {
          this.currentSource = parsed
        }
      } catch (e) {
        console.warn('Failed to parse saved avatar source:', e)
      }
    }
    this.shuffleAvatars()
  }

  private shuffleAvatars() {
    // Fisher-Yates 洗牌算法
    this.shuffledAvatars = [...this.currentSource.avatars]
    for (let i = this.shuffledAvatars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.shuffledAvatars[i]!, this.shuffledAvatars[j]!] = [this.shuffledAvatars[j]!, this.shuffledAvatars[i]!]
    }
  }

  setSource(source: RandomAvatarSource) {
    this.currentSource = source
    this.shuffleAvatars()
    localStorage.setItem('randomAvatarSource', JSON.stringify({
      name: source.name,
      avatars: source.avatars,
      description: source.description,
      totalCount: source.totalCount
    }))
  }

  getCurrentSource(): RandomAvatarSource {
    return this.currentSource
  }

  getSources(): RandomAvatarSource[] {
    return RANDOM_AVATAR_SOURCES
  }

  // 获取随机头像URL
  generateRandomAvatar(): string {
    if (this.shuffledAvatars.length === 0) {
      return '' // 没有头像时的fallback
    }
    return this.shuffledAvatars[Math.floor(Math.random() * this.shuffledAvatars.length)]!
  }

  // 批量获取随机头像
  generateBatch(count: number = 20): string[] {
    const avatars: string[] = []
    for (let i = 0; i < count && i < this.shuffledAvatars.length; i++) {
      const url = this.shuffledAvatars[i]
      if (url) avatars.push(url)
    }
    return avatars
  }

  // 获取所有头像（用于头像库显示）
  getAllAvatars(): string[] {
    return this.shuffledAvatars
  }

  // 重新洗牌
  reshuffle() {
    this.shuffleAvatars()
  }
}

// 创建单例实例
export const randomAvatarService = new RandomAvatarService()