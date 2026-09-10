/**
 * 数据库统一 Schema 定义
 * 存储只有一处：浏览器本地 IndexedDB（见 utils/localdb.ts）
 */

// --- 基础枚举类型 ---
export type DeviceType = 'ios' | 'android'
export type StatusBarTheme = 'light' | 'dark'
export type PreviewTheme = 'light' | 'dark'
export type ExportRatio = 'full' | '3:4'

// --- 语料库实体 ---
export interface CorpusItem {
  id?: number       // 主键（IndexedDB 自增）
  type: 'dialogue'  // 类型标识
  content: string   // 内容
  preset?: boolean  // 是否预设 (不存入DB)
  created_at?: Date | any // 创建时间
}

// --- 昵称库实体 ---
export interface NicknameItem {
  id?: number       // 主键（IndexedDB 自增）
  type: 'nickname'  // 类型标识
  content: string   // 昵称内容
  preset?: boolean  // 是否预设 (不存入DB)
  created_at?: Date | any // 创建时间
}

// --- 消息实体 (嵌套在会话中) ---
export type MessageType = 'text' | 'system' | 'image' | 'redpacket' | 'red-packet-opened'

export interface ChatMessage {
  id: string
  type: MessageType
  content: string
  sender?: {
    name: string
    avatar: string
  }
  isMe?: boolean
  timestamp?: string
}

// --- 聊天会话实体 (单例存储) ---
export interface ChatSession {
  key: 'current'    // 固定主键，确保单例
  groupTitle: string
  memberCount: number
  backgroundImage: string
  exportRatio?: ExportRatio
  messages: ChatMessage[]
  currentUser: {
    name: string
    avatar: string
  }
  updated_at: Date | any
}

// --- 预览队列项 ---
export interface PreviewQueueItem {
  id: string
  blob: Blob
  created_at: Date | any
}

// --- 头像库实体 ---
export interface AvatarItem {
  id: string
  url: string
  created_at: Date | any
}

// --- 群聊列表项 ---
export interface ChatListItem {
  id: string
  title: string
  lastMessage: string
  lastSender: string
  time: string
  avatars: string[]
  unreadCount?: number
  isPinned?: boolean
}

// --- 朋友圈评论 ---
export interface MomentsComment {
  id: string
  userName: string
  content: string
}

// --- 朋友圈动态 ---
export interface MomentsPost {
  id: string
  userName: string
  avatar: string
  content: string
  images: string[]
  location: string
  time: string
  likes: string[]
  comments: MomentsComment[]
}

// --- 朋友圈配置 ---
export interface MomentsConfig {
  ownerName: string
  ownerAvatar: string
  postCount: number
  topics: string[]
  locations: string[]
}

// --- 朋友圈会话 ---
export interface MomentsSession {
  key: 'current'
  config: MomentsConfig
  posts: MomentsPost[]
  updated_at: Date | any
}

// --- 集合与表名常量 ---
export const DB_STORES = {
  CORPUS: 'corpus',
  NICKNAMES: 'nicknames',
  CHAT_HISTORY: 'chat_history',
  PREVIEW_QUEUE: 'preview_queue',
  AVATARS: 'avatars',
  CHAT_LIST: 'chat_list',
  MOMENTS: 'moments_feed'
} as const
