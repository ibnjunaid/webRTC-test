
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

const mapUserToSID = (S : Socket, next: NextFunction) =>{
    console.log(`${S.handshake.query.name} mapped to ${S.id}`);
    if(! userToSocketID.has( String(S.handshake.query.name) )){
        userToSocketID.set(String(S.handshake.query.name),S.id);
    }
    next();
}

const removeUserFromMap = (S : Socket) => {
    if(userToSocketID.has( String(S.handshake.query.name) )){
        userToSocketID.delete(String(S.handshake.query.name));
    }
    console.log(`${S.handshake.query.name} unmapped to ${S.id}`);
}

io.on('connect',(socket:Socket) => {
    io.use(mapUserToSID)
    socket.on('getAvailableUsers',(...d) => {
        console.log("Hello",d);
        socket.emit('gotUsers',Array.from(userToSocketID.keys()));
    })
    socket.on("disconnect",(...r) =>{
        console.log(r);
        removeUserFromMap(socket);
    })
    socket.on('offer',(d) =>{
        console.log("Offer");
        socket.broadcast.emit("message",d);
    } );
    socket.on("answer",(d) => {
        console.log("Answer")
        socket.broadcast.emit("message",d);
    })
})


app.use(express.static(path.join(__dirname, 'public')));
app.use('/socket/',express.static(path.join(__dirname, 'node_modules/socket.io-client/dist/')));


app.set("view engine", "ejs")

app.get("/",(req,res) =>{
    res.render('index');
})

httpServer.listen(PORT,()=>{
    console.log('http://localhost:'+PORT)
})