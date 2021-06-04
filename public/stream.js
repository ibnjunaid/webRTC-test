window.onload = async () => {
  try {
    const person = "streamer";
    const socket = io(`/?name=${person}&missionID=123`);
    const player = document.querySelector('video#localVideo');

    const localstream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    window.l = localstream;

    const configuration = {
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    };

    const peerConnections = [];
    const remoteDesc = [];
    
    window.a = peerConnections;

    socket.on("start_RTC", async (client) => {
      peerConnections[client.caller] = new RTCPeerConnection(configuration);
      localstream.getTracks().forEach((track) => {
        peerConnections[client.caller].addTrack(track, localstream);
      });
      const offer = await peerConnections[client.caller].createOffer();
      await peerConnections[client.caller].setLocalDescription(offer);
      socket.emit("offer", { client,offer });
    });
    
    socket.on('answer',async (message) =>{
        console.log(message);
        console.log('answer received');
        remoteDesc[message.client.caller] = new RTCSessionDescription(message.answer);
        await peerConnections[message.client.caller].setRemoteDescription(remoteDesc[message.client.caller]);
        console.log(`Got answer by ${message.client.caller}`);
    })

    player.srcObject = localstream;
  } catch (error) {
    console.error(error);
  }
};
