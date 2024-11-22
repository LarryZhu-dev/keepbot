import fs from 'fs'
const cacheTalkers = fs.readFileSync('./talkers.json')

const talkers = JSON.parse(cacheTalkers)

const pushTalker = (talker, room) => {
  if(!talker || !room) return
  const date = new Date().toLocaleDateString()
  if (!talkers[date]) {
    talkers[date] = {}
  }
  if (!talkers[date][room]) {
    talkers[date][room] = {
      total: 0,
      people: 0
    }
  }
  if (!talkers[date][room][talker]) {
    talkers[date][room][talker] = {
      id: talker,
      time: new Date().getTime(),
      count: 1
    }
    talkers[date][room].people++
  } else {
    talkers[date][room][talker].count++
  }
  talkers[date][room].total++
  if (Object.keys(talkers).length > 7) {
    delete talkers[Object.keys(talkers)[0]]
  }
  // 写入到 JSON 文件
  fs.writeFileSync('./talkers.json', JSON.stringify(talkers))
}

const getTalkers = (room) => {
  return talkers[new Date().toLocaleDateString()][room]
}

export { pushTalker, getTalkers }
