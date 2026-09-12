// 系统预设语料库与资源库 (不可删除)

// 好易美（HYM）晒单专用语料 —— 内置预设，打开即用（2026-09-12）
const HYM_DIALOGUES = [
  // 下单确认
  '6号北京李宇春1888【已下单】', '8号上海孙燕姿980×2【已下单】', '11.8长沙孙燕姿980×2【已下单】',
  '发我身份信息', '收到，这就安排', '好的',
  // 抢票中
  '稍等哈~还在抢票中', '已经让抢手盯着了', '别急，稳的',
  // 出票交付
  '一会就出票~', '已交付 ✓', '座位已出，您看下', '票已到，截图给您',
  // 客户客返
  '哇塞 感谢老师 下次还找你', '好啵~谢谢宝子', '太靠谱了，谢谢！',
  '抢到了！！开心', '谢谢老板，位置很好', '明年还找你代拍',
  // 成功话术
  '这单拿下了', '稳稳下车', '今日战绩可查~',
]

const HYM_NICKNAMES = [
  '好易美票务', '好易美客服', '派单助理（不收款）', '好易美-小林',
  '客户王女士', '客户李先生', '客户小张', '客户刘姐',
]

export const PRESET_DIALOGUES = [
  '终于等到这一天了！', '有人出本场的票吗？求两张！', '我在场馆门口了，人超多！',
  '前排兜售瓜子饮料矿泉水~', '谁有歌单啊？求分享', '激动得睡不着觉',
  '今晚会有新歌吗？', '必须有啊！全场大合唱预定', '为了看演出特意请了假',
  '听说今晚有神秘嘉宾？', '真的假的？是谁啊？', '大家要注意防诈骗哦',
  '舞台效果太顶了！', '已经在检票口排队了', '天气不错，适合听演唱会',
  '有没有组队入场的？', '刚才在门口看到保姆车了！', '心跳已经120了',
  ...HYM_DIALOGUES
]

export const PRESET_SYSTEMS = [
  '你邀请 {invited} 加入了群聊  <span class="system-link">撤销</span>',
  '你邀请 {invited}、{other} 加入了群聊  <span class="system-link">撤销</span>',
  '你邀请 {invited}、{other} 等 5 人加入了群聊  <span class="system-link">撤销</span>',
  '{inviter} 邀请 {invited} 加入了群聊',
  '{inviter} 邀请 {invited}、{other} 加入了群聊',
  '{invited} 通过扫描 {inviter} 分享的二维码加入群聊',
  '{invited} 通过扫描你分享的二维码加入群聊',
  '{inviter} 将 {invited} 移出了群聊',
  '{inviter} 修改群名为 "{groupName}"'
]

export const PRESET_RED_PACKETS = [
  '{sender} 发了一个红包',
  '{sender} 发了一个拼手气红包',
  '{sender} 发了一个普通红包'
]

const NICKNAME_LIST = [
  'AAA建材王总', '水晶女孩', '追光者', '晚风', '向日葵',
  '简单快乐', '星光收集者', '小幸运', '纸飞机', '晴空',
  '夜行者', '以梦为马', '搁浅的鲸', '东篱', '发光体',
  '快乐小狗', 'momo', '用户88291', '卡布奇诺', '往事随风',
  '花开富贵', '除了帅一无所有', '只是近黄昏', '小仙女', '大魔王',
  '我的奶茶', '山川与海', '半岛来信', '风筝与猫', '龙卷风',
  '淡泊人生', '云淡风轻', '往事如烟', '奋斗中的小李', '逆流而上',
  'Cc', 'David', 'Lisa', 'Mike', 'Tom', 'Jerry',
  ...HYM_NICKNAMES
]

export const PRESET_NAMES = NICKNAME_LIST

export const PRESET_NICKNAMES: Array<{
  type: 'nickname'
  content: string
  preset: true
  id: number
}> = NICKNAME_LIST.map((name, index) => ({
  type: 'nickname' as const,
  content: name,
  preset: true as const,
  id: -(index + 1)
}))

export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=100&h=100&fit=crop',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=100&h=100&fit=crop'
]

export const PRESET_QUOTES = [
  "每一个普通的日子，都值得被认真记录。",
  "在这个喧嚣的世界，总有一些温柔在角落悄悄生长。",
  "所谓浪漫，就是从平淡生活里打捞星星。",
  "慢慢来，好戏都在烟火里。",
  "与其向往，不如出发。",
  "心之所向，便是阳光。",
  "保持热爱，奔赴山海。",
  "愿你眼里有光，心中有爱。",
  "生活虽平淡，但也要活得热气腾腾。",
  "那些看似不起眼的日复一日，会在某天让你看到坚持的意义。"
]
