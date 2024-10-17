
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
      users: [] // ids
    }
  }
}
users: {
  // room, name
}
console.log(rooms)

io.on('connection', socket => {

  socket.on('new-user', () => {
    users[socket.id] = {name: null, room: null}
    console.log("user connect")
  })

  socket.on('disconnect', () => {
    const user = users[socket.id]
    if (user.room !== null) userLeaveRoom(socket, user.name, user.room)
    console.log("user disconnect")
    delete users[socket.id]
  })

  socket.on('set-room-and-name', (newRoom, newName) => {
    if (typeof newName != "string") return
    if (typeof newRoom != "string" && newRoom !== null) return
    if (users[socket.id] == undefined) {
      io.to(socket.id).emit('server-message', "server error - undefined user")
      console.warn("server error - undefined user")
      return
    }
    if (rooms[newRoom] == undefined && newRoom != null) {
      io.to(socket.id).emit('server-message', "invalid room")
      return
    }

    const user = users[socket.id]

    if (user.room !== newRoom || user.name !== newName) {
      if (user.room !== null) userLeaveRoom(socket, user.name, user.room)
      if (newRoom !== null) userJoinRoom(socket, newName, newRoom)
    }

    user.room = newRoom
    user.name = newName
  })

  socket.on('send-chat-message', (message) => {
    if (typeof message != "string") return
    if (users[socket.id] == undefined) {
      io.to(socket.id).emit('server-message', "server error - undefined user")
      console.warn("server error - undefined user")
      return
    }
    const user = users[socket.id]
    if (user.room === null) {
      io.to(socket.id).emit('server-message', "Cannot send message - not in any room")
      return
    }

    socket.to(user.room).broadcast.emit('chat-message', {message: message, name: user.name})
    console.log("msg - " + user.room + " - " + user.name + ": " + message)
  })
})

function userLeaveRoom(socket, userName, room) {
  rooms[room].users.splice(rooms[room].users.indexOf(socket.id), 1)
  socket.to(room).send("user-left", userName)
  socket.leave(room)
}
function userJoinRoom(socket, userName, room) {
  rooms[room].users.push(socket.id)
  socket.to(room).send("user-joined", userName)
  socket.join(room)
}

setInterval(() => {
  for (let room in rooms) {
    console.log()
    io.to(room).emit('connection-check', rooms[room].users.length)
  }
}, connectionCheckInterval)