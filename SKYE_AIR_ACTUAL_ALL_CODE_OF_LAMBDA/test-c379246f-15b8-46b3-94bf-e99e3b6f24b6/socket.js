var WebSocket = require('ws');
var ws;
exports.handler = (event, context, callback) => {
function connect() {
            var target = 'ws://localhost:56781/websocket/server';
            if (target == '') {
                alert('Please select server side connection implementation.');
                return;
            }
         
            ws = new WebSocket.Server({target});
            ws.onopen = function () {
            
                console.log('Info: WebSocket connection opened.');
            };
            ws.onmessage = function (event) {
                log('Received: ' + event.data);
            };
            ws.onclose = function (event) {
              
                log('Info: WebSocket connection closed, Code: ' + event.code + (event.reason == "" ? "" : ", Reason: " + event.reason));
            };
        }

        function disconnect() {
            if (ws != null) {
                ws.close();
                ws = null;
            }
            
        }

        function echo() {
            if (ws != null) {
                var message = document.getElementById('message').value;
                log('Sent: ' + message);
                ws.send(message);
            } else {
                alert('WebSocket connection not established, please connect.');
            }
        }

        function updateTarget(target) {
            if (window.location.protocol == 'http:') {
                document.getElementById('target').value = 'ws://' + window.location.host + target;
            } else {
                document.getElementById('target').value = 'wss://' + window.location.host + target;
            }
        }

        function log(message) {
             var console = document.getElementById('console');
            var p = document.createElement('p');
            p.style.wordWrap = 'break-word';
            p.appendChild(document.createTextNode(message));
            console.appendChild(p);
            while (console.childNodes.length > 25) {
                console.removeChild(console.firstChild);
            }
            console.scrollTop = console.scrollHeight;
        }
        
        connect()

    }