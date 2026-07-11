const express = require("express");
const http = require("http");
const { Server } = require("socket.io");


const app = express();

const server = http.createServer(app);

const io = new Server(server);


app.use(express.static("public"));


// active rooms
// {
//   "123456": ["socket1","socket2"]
// }

const rooms = {};



function createRoomCode(){

    let code;

    do{

        code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

    }
    while(rooms[code]);


    return code;
}





io.on("connection",(socket)=>{



    // CREATE ROOM

    socket.on("create-room",()=>{


        const roomId = createRoomCode();


        rooms[roomId]=[];


        socket.emit(
            "room-created",
            roomId
        );


    });






    // CHECK ROOM BEFORE JOINING

    socket.on("check-room",(roomId)=>{


        if(rooms[roomId]){

            socket.emit(
                "room-exists",
                roomId
            );

        }
        else{

            socket.emit(
                "room-not-found"
            );

        }


    });






    // JOIN ROOM

    socket.on("join-room",(roomId)=>{


        if(!rooms[roomId]){


            socket.emit(
                "room-not-found"
            );


            return;

        }



        if(rooms[roomId].length >= 4){


            socket.emit(
                "room-full"
            );


            return;

        }




        socket.join(roomId);



        rooms[roomId].push(
            socket.id
        );




        const users =
        rooms[roomId]
        .filter(
            id=>id!==socket.id
        );



        socket.emit(
            "existing-users",
            users
        );



        socket.to(roomId)
        .emit(
            "user-joined",
            socket.id
        );



        socket.roomId = roomId;



    });








    // WEBRTC SIGNALING



    socket.on("offer",(data)=>{


        io.to(data.to)
        .emit(
            "offer",
            {
                from:socket.id,
                offer:data.offer
            }
        );


    });





    socket.on("answer",(data)=>{


        io.to(data.to)
        .emit(
            "answer",
            {
                from:socket.id,
                answer:data.answer
            }
        );


    });





    socket.on("ice-candidate",(data)=>{


        io.to(data.to)
        .emit(
            "ice-candidate",
            {
                from:socket.id,
                candidate:data.candidate
            }
        );


    });








    socket.on("disconnect",()=>{


        const roomId =
        socket.roomId;



        if(!roomId)
            return;




        if(rooms[roomId]){


            rooms[roomId] =
            rooms[roomId]
            .filter(
                id=>id!==socket.id
            );



            socket.to(roomId)
            .emit(
                "user-left",
                socket.id
            );




            if(
                rooms[roomId].length===0
            ){

                delete rooms[roomId];

            }


        }



    });



});






server.listen(3000,()=>{

console.log(
"Server running: http://localhost:3000"
);

});