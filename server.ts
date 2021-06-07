import express from 'express';
import path from "path";
import { Socket } from 'socket.io';
const app = express();

const PORT = process.env.PORT || 8080;

app.use(express.json());

const httpServer = require("http").createServer(app)
import socket from 'socket.io';
import { NextFunction } from 'connect';

const io = new socket.Server(httpServer)

const userToSocketID = new Map<string,string>();


const mapUsersToRooms = (S :Socket, next : NextFunction) =>{
    if(S.handshake.query.name === 'streamer'){
        S.join(S.handshake.query.missionID || '');
        console.log(S.id, ' Joined room ', S.handshake.query.name);
    }
    next();
}

io.on('connect',(socket:Socket) => {
    io.use(mapUsersToRooms);

    socket.on('view',(client) =>{
        console.log('view',client,'-------------')
        io.to(client.missionID).emit('start_RTC',client);
    })

    socket.on("offer",({client,offer}) =>{
        console.log('offer','------------------')
        io.to(client.missionID).emit('offer',{client,offer});
    })

    socket.on('answer',({client,answer}) =>{
        console.log('answer------------------')
        console.log(client);
        io.to(client.sid).emit('answer',{client,answer})
    })
    socket.on('candidate',(d) =>{
        console.log('candidate found');
        socket.broadcast.emit('message',d);
    })

    socket.on('c_offer',({client,offer}) =>{
        socket.broadcast.emit('message',{client,offer});
    })

    socket.on('c_answer', ({answer}) =>{
        socket.broadcast.emit('message',{answer});
    })

})


app.use(express.static(path.join(__dirname, 'public')));
app.use('/socket/',express.static(path.join(__dirname, 'node_modules/socket.io-client/dist/')));


app.set("view engine", "ejs")

app.get("/",(req,res) =>{
    res.render('index');
})

app.get('/stream',(req,res) => {
    res.render("stream");
})


app.get('/view',(req,res) => {
    res.render("view");
})


httpServer.listen(PORT,()=>{
    console.log('http://localhost:'+PORT)
})