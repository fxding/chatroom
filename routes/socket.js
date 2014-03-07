var UserDB = (function () {
    var userIds = {}; // save all users id
    var base = 'guest';
    
    var randomId = function () {
        var id;
        do {
            id = Math.floor(Math.random()*1000);
        } while(userIds[base + id]);
    
        userIds[base + id] = true;
        
        return base+id;
    };
    
    return {
        createId: function () {
            var id = randomId();
            return id;
        },
        deleteId: function (id) {
            if (userIds[id]) {
                userIds[id] = false;
            }
        },
        updateId: function (oldId, newId) {
            // exsit old id and don't exist new id  
            if (userIds[oldId] && !userIds[newId] ) {
                this.deleteId(oldId); 
                userIds[newId] = true;
                
                return true;
            } else { // exist new id, update fail;
                return false;
            }
        },
        getAll: function () {
            var ids = [];
            for (var id in userIds) {
                if (userIds[id]) {
                    ids.push({'id':id});
                }
            }
            return ids;
            
        },
        deleteAll: function () {
            userIds = {};
        }
    }  
})();



module.exports = function (socket) {
//    debugger;
    // connection event
    // one user connect 
    // create an id to this user
    var userId = UserDB.createId();
    console.log("client connection: id = " + userId);
    
    // use function param 'socket' to emit and on 
    socket.emit('new', {
        'id': userId, // new user id 
        'all':UserDB.getAll() // all user list 
    });
    
    // broadcast new user to all client
    socket.broadcast.emit('join', {
        id:userId
    });
    
    ///////////////////////////////////////
    // listen event
    
    // receive a message , broadcast to all user
    socket.on('msg', function (data) {
        console.log("receive user: " +userId +" message: " + data.msg);
        socket.broadcast.emit('msg', {
            id:userId,
            msg:data.msg
        });
    });
    
    socket.on('update', function (data) {
        debugger;
       console.log("user :" + userId + " update id, new id = " + data.newId); 
       // delete old id
        var b = UserDB.updateId(userId, data.newId);
        if (b) { // update success !
            console.log('update success!');
            socket.broadcast.emit('update', {
               oldId:userId,
                newId:data.newId
            });
            

            // record new id;
            userId = data.newId;
        } else {
            console.log('update error!');  
        }
        // reply update result
        socket.emit('update_result', {
                result:b
        });
    });
    
    socket.on('disconnect', function (data) {
        socket.broadcast.emit('leave', {
           id:userId
        });
        UserDB.deleteId(userId);
        
        console.log('user leave: ' + userId);
    });   
};