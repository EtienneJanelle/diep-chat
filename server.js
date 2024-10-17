
const io = require('socket.io')(10000)

const users = {}

const connectionCheckInterval = 15000

const regions = {
  "atl": "Atlanta",
  "lax": "Los Angeles",
  "fra": "Frankfurt",
  "osa": "Osaka",
  "syd": "Sydney"
}
const gameModes = {
  "ffa": "FFA",
  "teams": "2TDM",
  "4teams": "4TDM",
  "event": "Event",
  "maze": "Maze"
}

let rooms = {}
for (let [regionCode, regionName] of Object.entries(regions)) {
  for (let [gameModeCode, gameModeName] of Object.entries(gameModes)) {
    rooms[regionCode+"-"+gameModeCode] = {
      name: regionName+" " +gameModeName,
      users: {}
    }
  }
}

console.log(rooms)

io.on('connection', socket => {
  socket.on('new-user', (room, name) => {
    if (typeof room != "string" || typeof name != "string") return
    if (rooms[room] == undefined) return
    socket.join(room)
    rooms[room].users[socket.id] = name
    socket.to(room).broadcast.emit('user-connected', name)
    console.log("new user", room, name)
  })
  socket.on('send-user-disconnected', (room, name) => {
    if (typeof room != "string" || typeof name != "string") return
    if (rooms[room] == undefined) return
    socket.leave(room)
    delete rooms[room].users[socket.id]
    socket.to(room).broadcast.emit('user-disconnected', name)
    console.log("room left", room, name)
  })
  socket.on('send-chat-message', (room, message) => {
    if (typeof room != "string" || typeof message != "string") return
    if (rooms[room] == undefined) return
    if (rooms[room].users[socket.id] == undefined) return
    socket.to(room).broadcast.emit('chat-message', { message: message, name: rooms[room].users[socket.id]})
    console.log("msg", room + " - " + rooms[room].users[socket.id] + ": " + message)
  })
  socket.on('send-keep-alive', (randomVal) => {
    // absolutely nothing
  })
  socket.on('disconnect', () => {
    getUserRooms(socket).forEach(room => {
      socket.to(room).broadcast.emit('user-disconnected', rooms[room].users[socket.id])
      delete rooms[room].users[socket.id]
    })
    console.log("user disconnect")
  })
})

setInterval(() => {
  for (let room in rooms) {
    console.log()
    io.to(room).emit('connection-check', Object.keys(rooms[room].users).length)
  }
}, connectionCheckInterval)

function getUserRooms(socket) {
  return Object.entries(rooms).reduce((roomIds, [roomId, room]) => {
    if (room.users[socket.id] != null) roomIds.push(roomId)
    return roomIds
  }, [])
}
