let myFriends = {};
let mySocket;
let myLocalMediaStream;

window.addEventListener("load",()=>{
    initCapture();
});

function initCapture(){
    console.log("initCapture");
    let videoEl = document.getElementById("myvideo");
    let constraints={audio:true,video:true};
navigator.mediaDevices
         .getUserMedia(constraints)
         .then((stream)=>{

            myLocalMediaStream = stream;
            videoEl.srcObject = stream;
            videoEl.onloadedmetadata = function(e){
                videoEl.play();
            };

            setupSocket();

         })
         .catch((err)=>{
             alert(err);
         });



}

function setupSocket(){
    mySocket = io.connect();

    mySocket.on("connect",function(){
        console.log("Socket Connected");
        console.log("My socket id:",mySocket.id);
        mySocket.emit("list");
    });

    mySocket.on("disconnect",function(data){
        console.log("Socket disconnected");
 

    });

    mySocket.on("peer_disconnect",function(data){
        console.log("peer disconnected"+data);

    });

    mySocket.on("listresults",(data)=>{
      
        console.log(data);
        for(let i = 0;i < data.length;i++){
            if(data[i]!=mySocket.id){
                
                let theirSocketId = data[i];
                let peerConnection = setupConnection(true,theirSocketId);
                myFriends[data[i]] = peerConnection;
            }
        }
    });

    mySocket.on("signal",(to,from,data)=>{
        console.log("Got a signal from the server",to,from,data);
        if(to!=mySocket.id){
            console.log("Socket Ids don't match");
        }
        let connection = myFriends[from];
        if (connection){
            
            connection.signal(data);

        }else{
            console.log("Never found right simplepeer object");
            let theirSocketId = from;
            let peerConnection = setupConnection(false,theirSocketId);
            myFriends[from] = peerConnection;
            peerConnection.signal(data);

        }
    });
}

function setupConnection(initiator,theirSocketId){
    let peerConnection = new SimplePeer({ initiator: true });

    peerConnection.on("signal",(data)=>{
      
        mySocket.emit("signal",theirSocketId,mySocket.id,data);
    });

    peerConnection.on("connect",()=>{
        console.log("Connect");
        console.log(peerConnection);

        peerConnection.addStream(myLocalMediaStream);
        console.log("Send our stream");
    });
    
    peerConnection.on("stream",(stream)=>{
        console.log("Incoming Stream");
        let theirVideoEl = document.createElement("VIDEO");
        theirVideoEl.id = theirSocketId;
        theirVideoEl.srcObject = stream;
        theirVideoEl.muted = true;
        theirVideoEl.onloadedmetadata = function(e){
            theirVideoEl.play();
           

        };
        document.body.appendChild(theirVideoEl);
        console.log(theirVideoEl);

    });

    peerConnection.on("close",()=>{
        console.log("Got close event");
    });

    peerConnection.on("error",(err)=>{
        console.log(err);
    });

    return peerConnection;


}