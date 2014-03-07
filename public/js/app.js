var app = angular.module("ChatroomApp", []);

app.factory('socket', function ($rootScope) {
    var socket = io.connect('http://127.0.0.1:3000/');
    // return socket; // Just return this, view can't update realtime
    // This is important
    return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {   
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        }); 
      }); 
    },  
        
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }   
        }); 
      })  
    }   
  };  
});

app.controller("PublicChatroomCtrl", ["$scope", "socket",
    function ($scope, socket) {
        $scope.message = ""; // input message
        $scope.id = "";
        $scope.messages = []; // all message
        $scope.userIds = []; // all users' id

        var newTmpId = "";

        // send a msg 
        $scope.sendMessage = function (msg) {
            console.log(msg);
            socket.emit('msg', {
                'msg': msg
            });

            // save message 
            $scope.messages.push({
                'id': $scope.id,
                'msg': msg
            });
            
            $scope.message = "";
        };

        // send update request 
        $scope.updateId = function (newId) {
            console.log('update user id to ' + newId);
            socket.emit('update', {
                'newId': newId
            });
            // recored new id, wait for update result
            newTmpId = newId;
        }

        window.scope = $scope;

        // connect to server return
        socket.on('new', function (data) {
            console.log('new user ' + data.id);
            // save other new user id
            for(var i=0,len=data.all.length; i<len; i++) {
                $scope.userIds.push({
                    id:data.all[i].id 
                });
            }
            $scope.id = data.id;
            
            alertTip('Success Connect to Chatroom, Congratulation '+ data.id);
        });
        // new user join 
        socket.on('join', function (data) {
            // save self id
            console.log('Welcome user' + data.id);
            $scope.userIds.push({
                id: data.id
            });
            alertTip('Welcome User '+ data.id);
        });

        // other user msg            
        socket.on('msg', function (data) {
            console.log('recv user: ' + data.id + ' msg ' + data.msg);
            $scope.messages.push({
                id: data.id,
                msg: data.msg
            });
        });

        var updateId = function (oldId, newId) {
            for (var i = 0, len = $scope.userIds.length; i < len; i++) {
                if ($scope.userIds[i].id == oldId) {
                    $scope.userIds[i].id = newId;
                    break;
                }
            }
        };

        var deleteId = function (oldId) {
            for (var i = 0, len = $scope.userIds.length; i < len; i++) {
                if ($scope.userIds[i].id == oldId) {
                    $scope.userIds.splice(i, 1);
                    break;
                }
            }
        };
        
        var alertTip = function (msg) {
            tip = $("#tip");
            tip.html(msg);
            tip.fadeIn(2000, function (){
                tip.fadeOut(2000);
            });
        };

        // other user update id  event
        socket.on('update', function (data) {
            console.log('user update id:' + data.oldId + '->' + data.newId);
            updateId(data.oldId, data.newId);
            alertTip('User '+data.oldId +' update id -->> ' + data.newId);
        });

        // self update id result
        socket.on('update_result', function (data) {
            console.log('user update result: ' + data.result);
            if (data.result) {
                updateId($scope.id, newTmpId);
                $scope.id = newTmpId;
                alertTip('Update user id -->> ' + newTmpId);
            } else {
                console.log('update user id error!');
                alertTip('Update user id error');
            }
        });
        // user leaves
        socket.on('leave', function (data) {
            console.log('user ' + data.id + ' leave  :( !');
            alertTip('User ' + data.id + ' leave! :(');
            deleteId(data.id);
        });
        }]);