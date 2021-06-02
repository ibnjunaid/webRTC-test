window.onload = async () =>{
    try {
        const person = prompt("Enter Your name?");
        const socket = io(`/?name=${person}`);

        const remoteStream = new MediaStream();
        const remoteVideo = document.querySelector("video#remoteVideo");

        window.r = remoteStream;
        
        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
        const peerConnection = new RTCPeerConnection(configuration); 

        peerConnection.addEventListener("connectionstatechange",console.log(peerConnection.signalingState || "Hello"));

        peerConnection.addEventListener('track',async (e) =>{
            console.log('remote Track found');
            remoteStream.addTrack(e.track, remoteStream);
            remoteVideo.srcObject = remoteStream;
        })
        
        const localstream =  await navigator.mediaDevices.getUserMedia({
            video : true,
            audio : true
        });

        localstream.getTracks().forEach( track => {
            peerConnection.addTrack(track,localstream);
        }) 

        window.p = peerConnection;
        socket.on("message",async (message) => {
            console.log(message);
            if(message.offer){  
                peerConnection.setRemoteDescription(new RTCSessionDescription(message.offer));
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                socket.emit('answer',{answer});
                console.log(`offer Received by ${person}`)
            }
            else if(message.answer){
                const remoteDesc = new RTCSessionDescription(message.answer)
                await peerConnection.setRemoteDescription(remoteDesc);
                console.log(`Answer by ${person}`)
            }
        })


        const player = document.querySelector("video#localVideo");
        const callBtn = document.querySelector("Button#callButton");
        const hangBtn = document.querySelector("Button#hangButton");

        player.srcObject = localstream;

        callBtn.addEventListener('click',async () =>{
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit('offer',{offer});
        })


    } catch (error) {
        console.error(error);
    }
}