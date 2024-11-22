import config from './config.js'
import { pushTalker, getTalkers } from './recorder.js'

const replys = ['2B吧哥们', '2B', '你纯2B', '家人们谁懂啊，有2B艾特我', '行了哥们，再发癫就真2B了'] // @时的回复
const followKeyWords = ['2b', '2B', 'sb', 'Sb', 'SB'] // 跟队形关键词，还会统计到发言榜
let memberCallCds = [] // 成员@的冷却时间，6s，关键词跟队形是半小时
let keyWordsTriggerTime = {} // 关键词触发次数

const onMessage = async (message) => {
  const contact = message.talker() // 发消息人
  const text = message.text() // 消息内容
  const room = message.room() // 是否是群消息，若是，则为 Room 对象
  if (room) {
    const topic = await room.topic()
    if (config.groups.includes(topic) && config.prefix.some((prefix) => text.startsWith(prefix))) { // 是否在群聊白名单、是否符合前缀
      console.log(`Room: ${topic} Contact: ${contact.name()} Text: ${text}`)
      const index = memberCallCds.findIndex((item) => item.name === contact.name()) // 这是一种非常怪异的节流写法，不知道你这种 2B 能不能看懂
      if (index !== -1) {
        clearTimeout(memberCallCds[index].timer)
        memberCallCds[index].timer = setTimeout(() => {
          memberCallCds.splice(index, 1)
        }, 6000)
        return
      }
      memberCallCds.push({ name: contact.name(), timer: setTimeout(() => (memberCallCds = memberCallCds.filter((m) => m.name != contact.name())), 6000) }) // 6s 冷却
      await room.say(`@${contact.name()} ${replys[Math.floor(Math.random() * replys.length)]}`)
    }
    if (config.groups.includes(topic)) {
      pushTalker(contact.name(), topic)
    }
    if (config.groups.includes(topic) && text === '发言榜') {
      await room.say(talkersRank(topic))
    }
    if (config.groups.includes(topic) && followKeyWords.some((t) => text.includes(t))) {
      if (!text.startsWith('<msg>') && text.length <= 100 && !text.includes('- - - - - - - - - - -')) { // 过滤掉一些不是正常发言的消息
        const singleFollowKeyWord = followKeyWords.find((t) => text.includes(t))
        recordingKeyWords(singleFollowKeyWord) // 记录关键词
        if (memberCallCds.findIndex((item) => item.name === text) == -1) {
          await room.say(text) // 跟队形
          memberCallCds.push({ name: text, timer: setTimeout(() => (memberCallCds = memberCallCds.filter((m) => m.name != text)), 1800000) }) // 30min 冷却
        }
      }
    }
  }
}
const roomJoin = async (room, inviteeList) => {
  const topic = await room.topic()
  if (config.groups.includes(topic)) {
    for (const c of inviteeList) {
      await room.say(`@${c.name()} 欢迎来到不朽堡垒！`)
    }
  }
}

function talkersRank(topic) { // 发言榜
  const talkers = getTalkers(topic)
  let talkersArray = Object.values(talkers)
  talkersArray = talkersArray.filter((t) => t instanceof Object)
  talkersArray.sort((a, b) => b.count - a.count)
  talkersArray = talkersArray.slice(0, 10)
  let talkersString = `${new Date().toLocaleDateString()} 目前榜单：\n总发言数：${talkers.total}\n总发言人数：${talkers.people}\n\n`
  talkersString += talkersArray
    .map((t, index) => {
      let ranking = ` ${index + 1}`
      if (ranking == 1) ranking = '🥇'
      if (ranking == 2) ranking = '🥈'
      if (ranking == 3) ranking = '🥉'
      return `${ranking}. ${t.id}: ${t.count}`
    })
    .join('\n')
    .toString()
  const keyWords = getRecordingKeyWords(new Date().toLocaleDateString())
  if (keyWords) {
    talkersString += '\n\n一共说了：\n'
    talkersString += Object.keys(keyWords)
      .map((k) => {
        return `${keyWords[k]}个${k}`
      })
      .join('、')
      .toString()
  }
  return talkersString
}
function recordingKeyWords(text) {
  const today = new Date().toLocaleDateString()
  if (!keyWordsTriggerTime[today]) {
    keyWordsTriggerTime[today] = {}
  }
  if (!keyWordsTriggerTime[today][text]) {
    keyWordsTriggerTime[today][text] = 0
  }
  keyWordsTriggerTime[today][text]++
  if (Object.keys(keyWordsTriggerTime).length > 7) {
    delete keyWordsTriggerTime[Object.keys(keyWordsTriggerTime)[0]]
  }
}
function getRecordingKeyWords(date) {
  return keyWordsTriggerTime[date]
}
export { onMessage, roomJoin }
