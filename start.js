import { WechatyBuilder } from 'wechaty'
import { onMessage, roomJoin } from './bot.js'
import fs from 'fs'

const botName = '不朽堡垒守卫'
const wechaty = WechatyBuilder.build() // get a Wechaty instance
wechaty
  .on('scan', (qrcode, status) => console.log(`Scan QR Code to login: ${status}\nhttps://wechaty.js.org/qrcode/${encodeURIComponent(qrcode)}`))
  .on('login', (user) => console.log(`User ${user} logged in`))
  .on('message', onMessage)
  .on('room-join', roomJoin)

wechaty.start().catch((e) => {
  console.log('start error:', e)
})
// 以下是轮询房间成员的代码，但是目前我看没什么屌用，wechaty获取到的成员不会变，不知道怎么回事，可以在 .on("ready") 中调用 pollRoomMembers 测试
const getRoom = async (roomName) => {
  const room = await wechaty.Room.find({ topic: roomName })
  if (room) {
    console.log(`Found room: ${await room.topic()}`)
    return room
  } else {
    console.log(`Room ${roomName} not found`)
    return null
  }
}
const getRoomMembers = async (room) => {
  if (!room) return []
  const members = await room.memberAll()
  console.log(`Number of members: ${members.length}`)
  console.log(members.map((m) => m.name()))
  return members
}
const pollRoomMembers = async (roomName, interval = 2000) => {
  let previousMembers = []

  setInterval(async () => {
    const room = await getRoom(roomName)
    if (!room) return
    await room.sync()
    const currentMembers = await getRoomMembers(room)

    const previousIds = new Set(previousMembers.map((member) => member.id))
    const currentIds = new Set(currentMembers.map((member) => member.id))

    // 检查新增的成员
    const newMembers = currentMembers.filter((member) => !previousIds.has(member.id))
    if (newMembers.length > 0) {
      console.log(
        'New members:',
        newMembers.map((m) => m.name())
      )
    }

    // 检查移除的成员
    const removedMembers = previousMembers.filter((member) => !currentIds.has(member.id))
    if (removedMembers.length > 0) {
      room.say(`@${removedMembers.join('')} 离开了不朽堡垒`)
      console.log(
        'Removed members:',
        removedMembers.map((m) => m.name())
      )
    }

    // 更新记录
    previousMembers = currentMembers
  }, interval)
}
