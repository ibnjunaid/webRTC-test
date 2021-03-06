import express from 'express';
import path from "path";
import { Socket } from 'socket.io';
const webrtc = require('wrtc');

const app = express();

let senderStreams = new Map<string,any>();


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

app.get('/stream', (req,res) =>{
    res.render('streamer')
})

app.get('/view', (req,res) =>{
    res.render('viewer')
})

app.post("/consumer", async ({ body }, res) => {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "turn:14.97.37.70:3478",
                username : "test",
                credential : "test123"
            }
        ]
    });
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const senderStream = senderStreams.get(body.missionId)
    if(senderStream == null){
        console.log(`No mission with missionId ${body.missionId}`);
        res.status(404).json({
            message : "No stream found with the missionId"
        })
        return;
    }
    senderStream.getTracks().forEach((track: any) => peer.addTrack(track, senderStream));
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);
});

app.post('/broadcast', async ({ body }, res) => {
    console.log(body);
    const peer : RTCPeerConnection = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "turn:14.97.37.70:3478",
                username : "test",
                credential : "test123"
            }
        ]
    });
    peer.ontrack = (e:any) => handleTrackEvent(e, peer,body.missionId);
    const desc = new webrtc.RTCSessionDescription(body.sdp);
    await peer.setRemoteDescription(desc);
    const answer = await peer.createAnswer({offerToReceiveAudio:true,offerToReceiveVideo:true});
    await peer.setLocalDescription(answer);
    const payload = {
        sdp: peer.localDescription
    }

    res.json(payload);
});

function handleTrackEvent(e:any, peer:any, missionId:string) {
    console.log('track handled')
    senderStreams.set(missionId,e.streams[0]);
};

httpServer.listen(PORT,()=>{
    console.log('http://localhost:'+PORT)
})