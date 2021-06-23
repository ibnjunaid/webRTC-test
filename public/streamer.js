window.onload = () => {
    document.getElementById('my-button').onclick = () => {
        init();
    }
}

const missionId = prompt("Enter The missionId");

async function init() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    document.getElementById("video").srcObject = stream;
    const peer = createPeer();
    stream.getTracks().forEach(track => peer.addTrack(track, stream));
    console.log('Initialised');
}


function createPeer() {
    const peer = new RTCPeerConnection({
        iceServers: [
            {
                urls: "turn:14.97.37.70:3478",
                username : "test",
                credential : "test123"
            }
        ]
    });
    console.log('peer connection created');
    peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);
    window.p = peer;

    return peer;
}

async function handleNegotiationNeededEvent(peer) {
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    const payload = {
        sdp: peer.localDescription,
        missionId : missionId
    };

    const { data } = await axios.post('/broadcast', payload);
    console.log(data);
    const desc = new RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc).catch(e => console.log(e));
}
