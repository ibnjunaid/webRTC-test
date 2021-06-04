window.onload = async () =>{
    try {
        const person = "viewer";
        const socket = io(`/?name=${person}`);

        const remoteStream = new MediaStream();
        window.r = remoteStream;
        const remoteVideo = document.querySelector("video#view");
        remoteVideo.srcObject = remoteStream;

        socket.on("connect", () =>{
            socket.emit('view',{ caller:socket.id,missionID:'123' });
        })
        
        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
        const peerConnection = new RTCPeerConnection(configuration); 
        window.p = peerConnection;

        socket.on('offer',async (message) =>{
            console.log("offer found");
            console.log(new RTCSessionDescription(message.offer))
            await peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            const client = message.client;
            socket.emit('answer',{client,answer});
            console.log(`offer Received by ${person}`)
        })

        peerConnection.addEventListener('track',async (e) =>{
            console.log(e);
            console.log('remote Track found');
            remoteStream.addTrack(e.track);
        })


    } catch (error) {
        console.error(error);
    }
}