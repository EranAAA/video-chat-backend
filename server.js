const express = require('express')
const app = express()
const http = require('http').createServer(app)

const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')

const io = require("socket.io")(http, {
   cors: {
      origin: "*",
      methods: ["GET", "POST"]
   }
});

// Express App Config
app.use(cookieParser())
app.use(express.json())

if (process.env.NODE_ENV === 'production') {
   // in production the backend serve the frontend after build from public directory. so no problem there
   // Express serve static files on production environment
   app.use(express.static(path.resolve(__dirname, 'public')))
} else {
   // Configuring CORS
   // in development the server need to approve the different port the frontend on. 
   const corsOptions = {
      origin: ['http://127.0.0.1:8080', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://localhost:3000',],
      credentials: true,
   }
   app.use(cors(corsOptions))
}

app.get('/', (req, res) => {
   res.send('Running');
});

io.on("connection", (socket) => {
   console.log('connection');
   console.log('All connections', io.sockets.sockets.keys());

   socket.emit("me", socket.id);
   
   socket.on("disconnect", () => {
      console.log(`**** ${socket.id} was disconnect ****`);
      socket.broadcast.emit("callEnded")
   });

   socket.on("callUser", ({ userToCall, signalData, from, name }) => {
      io.to(userToCall).emit("callUser", { signal: signalData, from, name });
   });

   socket.on("answerCall", (data) => {
      console.log('***********answerCall***********');
      console.log('data.to', data.to);
      io.to(data.to).emit("callAccepted", data.signal)
   });

   socket.on("notifyImOnline", (data) => {
      console.log('user id: ', data.id);
      socket.broadcast.emit("onlineUser", { data })
   });

   socket.on("sendUserName", (username) => {
      console.log('username: ', username);
      const sockets = [ ...io.sockets.sockets.keys()]
      const filterdSockets = sockets.filter(soc => soc === socket.id)
      console.log('socket id', socket.id);
      console.log('filterdSockets', filterdSockets);
      socket.broadcast.emit("onlineUsername", { username, id: filterdSockets },)
   });

});

// Last fallback
app.get('/**', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const port = process.env.PORT || 3030
http.listen(port, () => {
   console.log('Server is running on port: ' + port)
})
