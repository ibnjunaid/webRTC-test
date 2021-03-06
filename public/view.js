window.onload = async () =>{
    try {
        const person = "viewer";
        const socket = io(`/?name=${person}`,{
            reconnect : false
        });

        const localstream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        window.s = socket;

        const remoteStream = new MediaStream();
        window.r = remoteStream;
        const remoteVideo = document.querySelector("video#view");

        const configuration = {'iceServers': [{'urls': 'stun:stun.l.google.com:19302'}]}
        const peerConnection = new RTCPeerConnection(configuration); 

        // localstream.getTracks().forEach( track => {
        //     peerConnection.addTrack(track,localstream);
        // }) 

        window.p = peerConnection;

        //Pressing this button will cause an offer 
        const btn = document.querySelector("button#get-feed");
        btn.disabled = true;
        
        socket.on("connect", () =>{
            console.log("socket connected");
            btn.addEventListener("click",emitOffer)
            btn.disabled = false;
        })

        if(socket.connected){
            console.log("socket connected");
            btn.addEventListener("click",emitOffer)
            btn.disabled = false;
        }

        async function emitOffer(){
            console.log("offer emitted");
            const offer = await peerConnection.createOffer({offerToReceiveVideo : true, offerToReceiveAudio : true});
            await peerConnection.setLocalDescription(offer);
            const client = {sid:socket.id,missionID:'123'}
            socket.emit('offer',{client,offer});
        }

        async function receiveAnswer(answer){
            const remoteDesc = new RTCSessionDescription(answer);
            await peerConnection.setRemoteDescription(remoteDesc);
        }

        socket.on('answer',({client, answer}) =>{
            receiveAnswer(answer);
        })

        peerConnection.addEventListener("connectionstatechange",console.log(peerConnection.signalingState ));

        peerConnection.addEventListener('track',async (e) =>{
            console.log(e);
            console.log('remote Track found');
            remoteStream.addTrack(e.track,remoteStream);
            remoteVideo.srcObject = remoteStream;
        })


    } catch (error) {
        console.error(error);
    }
}