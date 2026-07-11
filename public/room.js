const socket = io();



const roomId =
new URLSearchParams(
window.location.search
)
.get("room");



document.getElementById("room")
.textContent = roomId;



const participants =
document.getElementById("participants");



const localVideo =
document.getElementById("localVideo");



let localStream;

let peers={};

let remoteVideos={};





const config={

iceServers:[


{
urls:
"stun:stun.relay.metered.ca:80"
},


{
urls:
"turn:global.relay.metered.ca:80",

username:
"ddbaf0b8d0faa3e841f1fc5d",

credential:
"sYhaMzJqs7PGMRs8"

},


{
urls:
"turn:global.relay.metered.ca:443",

username:
"ddbaf0b8d0faa3e841f1fc5d",

credential:
"sYhaMzJqs7PGMRs8"

}


]

};







function updateLayout(){


let count =
Object.keys(remoteVideos).length + 1;



participants.className="";



if(count===1)
participants.classList.add("one");


if(count===2)
participants.classList.add("two");


if(count===3)
participants.classList.add("three");


if(count>=4)
participants.classList.add("four");



}








function addVideo(id,stream){



let video =
document.createElement("video");



video.id=id;


video.autoplay=true;

video.playsInline=true;


video.srcObject=stream;



participants.appendChild(video);



remoteVideos[id]=video;



updateLayout();


}









function createPeer(id){



const pc =
new RTCPeerConnection(config);



localStream
.getTracks()
.forEach(track=>{


pc.addTrack(
track,
localStream
);


});






pc.ontrack=(event)=>{


if(!remoteVideos[id]){


addVideo(
id,
event.streams[0]
);


}


};







pc.onicecandidate=(event)=>{


if(event.candidate){


socket.emit(
"ice-candidate",
{

to:id,

candidate:event.candidate

}
);


}


};



return pc;


}








navigator.mediaDevices
.getUserMedia({

video:true,

audio:true

})
.then(stream=>{


localStream=stream;


localVideo.srcObject=stream;



socket.emit(
"join-room",
roomId
);



});









socket.on(
"existing-users",
async users=>{


for(let id of users){


const pc =
createPeer(id);



peers[id]=pc;



const offer =
await pc.createOffer();



await pc.setLocalDescription(
offer
);



socket.emit(
"offer",
{

to:id,

offer

}
);


}


});









socket.on(
"user-joined",
id=>{


if(Object.keys(peers).length>=3)
return;



peers[id]=
createPeer(id);



});









socket.on(
"offer",
async data=>{


const pc =
createPeer(data.from);



peers[data.from]=pc;



await pc.setRemoteDescription(
new RTCSessionDescription(
data.offer
)
);



const answer =
await pc.createAnswer();



await pc.setLocalDescription(
answer
);



socket.emit(
"answer",
{

to:data.from,

answer

}
);



});









socket.on(
"answer",
async data=>{


await peers[data.from]
.setRemoteDescription(

new RTCSessionDescription(
data.answer
)

);


});








socket.on(
"ice-candidate",
async data=>{


await peers[data.from]
.addIceCandidate(

new RTCIceCandidate(
data.candidate
)

);


});








socket.on(
"user-left",
id=>{


if(peers[id]){

peers[id].close();

delete peers[id];

}



if(remoteVideos[id]){

remoteVideos[id].remove();

delete remoteVideos[id];

}


updateLayout();


});







socket.on(
"room-full",
()=>{

alert(
"Room is full"
);

location.href="/";

});





socket.on(
"room-not-found",
()=>{

alert(
"No room found"
);

location.href="/";

});