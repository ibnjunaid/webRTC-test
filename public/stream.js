window.onload = async () => {
  try {
    const person = "streamer";
    const socket = io(`/?name=${person}&missionID=123`);
    const player = document.querySelector('video#localVideo');

    const localstream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    player.srcObject = localstream;

    window.l = localstream;

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const handleOffer = async (client, offer ) =>{
      console.log('Hanlde offer');
      const peerConnection = new RTCPeerConnection(configuration);
      peerConnection.addEventListener("connectionstatechange",console.log(peerConnection.signalingState));
      window.p = peerConnection;

      localstream.getTracks().forEach( track => {
        peerConnection.addTrack(track,localstream);
      }) 

      await peerConnection.setRemoteDescription(offer);
      const answer = await peerConnection.createAnswer(offer)
      await peerConnection.setLocalDescription(answer);
      socket.emit('answer',{client,answer});
    }
    socket.on('offer',({client,offer}) =>{
      console.log("offer")
      handleOffer(client,offer);
    }) 

  } catch (error) {
    console.error(error);
  }
};
