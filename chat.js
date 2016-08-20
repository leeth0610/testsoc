const express = require('express');
//const app = express();
//app.io = require('socket.io')();
const http = require('http');
const app = express();
const server = http.createServer(app);

const io = require('socket.io')(server);
const SessionStore = require('../../../util/SessionStore');
const trimer = require('../.././../util/messageTrimer');
const MariaPool = require('../../MysqlPool');

//app.io.on('connection', (socket) => {
io.on('connection', (socket) => {
        console.log('connect');
        let joined = false;
        let trainer = 0;
        let tid;
        let mid;

        socket.on('join', (_sessionId) => {
                SessionStore.find(_sessionId)
                        .then((result) => {
                                if (result._tid != null) {
                                        tid = result._tid;
                                        trainer = 1;
                                        mid = socket.request.headers.cookie._mid;
                                        if (!mid)
                                                return;
                                }
                                else
                                        mid = result._mid;

                                MariaPool.query('SELECT _tid FROM member_tbl WHERE _mid = ?;', [mid], (err, rows) => {
                                        if (err)
                                                return;

                                        if (trainer == 1)
                                                if (rows[0]._tid != tid)
                                                        return;

                                        tid = rows[0]._tid;

                                        socket.join(mid, () => {
                                                joined = true;
                                        });
                                });
                        }, (reject) => {
                                return;
                        }).catch(console.error);
        });

        socket.on('init', (data) => {
                MariaPool.query('SELECT _trainer, _content FROM message_tbl WHERE _mid = ?;', [mid], (err, rows) => {
                        if (err)
                                console.error(err);

                        console.log(trimer(rows));
                        socket.emit('init', trimer(rows));
                });
        });

        socket.on('msg', (msg) => {
                console.logI(msg);
                if (!joined)
                        return;

                console.log(msg);

                const content = msg;

                io.sockets.in(mid).emit('msg', {
                        _trainer: trainer,
                        _content: content
                });

                // for push // if(io.sockets.adapter.rooms['my_room'].length <)

                MariaPool.query('INSERT INTO message_tbl VALUES(NULL, ?, ?, ?);', [mid, trainer, msg], (err, rows) => {

                });
        });

        socket.on('exit', (data) => {
                socket.leave(mid);
        });
});

server.listen(4611, () => {
        console.log('running...!');
});
//module.exports = app;
//(socket.request.headers.cookie)