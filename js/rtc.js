var RTC = function() {
    
    var cfg = {"iceServers": [{"url": "stun:23.21.150.121"}]};
    var opt = {"optional": [{"DtlsSrtpKeyAgreement": true}]};

    this.con = new RTCPeerConnection(cfg, opt);
    this.dc = null;
    this.id = -1;
    this.rid = 0;
    
    this.cipher = new Cipher();
    
    var context = this;
    
    this.con.oniceconnectionstatechange = function(evt) {
        if(evt.target.iceConnectionState == "disconnected") {
            printMessage("Disconnected.", "text-info");
            connections[context.rid] = null;
        }
    }
    
    this.con.onicecandidate = function(evt) {
        if(evt.candidate == null) {
            $(".output").val(JSON.stringify(context.con.localDescription));
        }
    };
    
    this.con.ondatachannel = function(evt) {
        context.dc = evt.channel || evt;
        context.dc.onopen = function(evt) {
            printMessage("Connection estabilished.", "text-info");
            $("#send").prop('disabled', false);
        };
        context.dc.onmessage = function(evt) {
            var request = JSON.parse(evt.data);
            context.parseRequest(request);
        };
    };
    
};

RTC.prototype.parseRequest = function(request) {
    console.log(request);
    this[request.type](request);
};

RTC.prototype.setup = function(b) {
    var master = b;
    for(c in connections) {
        if(connections[c] == null) {
            this.id = c;
        }
    }
    var context = this;
    try {
        this.dc = this.con.createDataChannel("test", {"reliable": true});

        this.dc.onopen = function(evt) {
            printMessage("Connection estabilished.", "text-info");
            $("#send").prop('disabled', false);
            var request = new setId(context.id, null, connections.length - 1);
            context.dc.send(request.toJString());
            if(master) {
                connectAll(context.rid);
            }
        }
        var context = this;
        this.dc.onmessage = function(evt) {
            var request = JSON.parse(evt.data);            
            context.parseRequest(request);
        };
    } catch(e) { 
            printMessage("Connection error.", "text-err");
        }
};

RTC.prototype.createLocalOffer = function() {
    if(this.dc == null) {
        this.setup(false);
    }
    var context = this;
    this.con.createOffer(function(desc) {
        context.con.setLocalDescription(desc, function() {});
        context.desc = desc;
        printMessage("Created local offer.", "text-info");
    }, function () {
            printMessage("Couldn't create offer", "text-err");
        }
    );
};

RTC.prototype.handleOffer = function(offer) {
    this.con.setRemoteDescription(offer);
    var context = this;
    this.con.createAnswer(function(answer) {
        printMessage("Created local answer", "text-info");
        context.con.setLocalDescription(answer);
        context.answer = answer;
    }, function() { 
            printMessage("Couldn't create answer.", "text-err");
        }
    );
};

RTC.prototype.handleAnswer = function(answer) {
    this.con.setRemoteDescription(answer);
};

RTC.prototype.sendMessage = function(text) {
    var txt = this.cipher.encrypt(text);
    txt = encodeURI(txt);
    
    var niv = forge.random.getBytesSync(32);
    var nie = encodeURI(this.cipher.encrypt(encodeURI(niv)));
            
    this.cipher.iv = niv;
    
    var request = new chatMsg(username, null, txt, nie);
    this.dc.send(request.toJString());
};

RTC.prototype.rGetOffer = function(id) {
    var request = new getOffer(id, null, null, null);
    this.dc.send(request.toJString());
};

RTC.prototype.rAddOffer = function(offer, from, to) {
    var request = new addOffer(from, to, offer);
    this.dc.send(request.toJString());
};

RTC.prototype.rAddAnswer = function(answer, from) {
    var request = new addAnswer(from, null, answer);
    this.dc.send(request.toJString());
};

RTC.prototype.chatMsg = function(request) {
    var msg = request.text;
    printMessage("<b>" + request.from + ": </b>" + this.cipher.decrypt(decodeURI(msg)), "message");
    
    var niv = request.n;
    this.cipher.riv = decodeURI(this.cipher.decrypt(decodeURI(niv)));
};

RTC.prototype.getOffer = function(request) {
    var cc = new RTC();
    connections[request.from] = cc;
    cc.setup();
    cc.id = this.id;
    
    var id = request.from;
    var context = this;
    
    cc.con.onicecandidate = function(evt) {
        if(evt.candidate == null) {
            var request = new rOffer(context.id, id, JSON.stringify(cc.con.localDescription));
            context.dc.send(request.toJString());
        }
    };
    
    cc.con.createOffer(function(desc) {
        cc.con.setLocalDescription(desc, function() {});
        cc.desc = desc;
        printMessage("Created local offer.", "text-info");
    }, function () {
            printMessage("Couldn't create offer", "text-err");
        }
    );

};

RTC.prototype.addOffer = function(request) {
    var cc = new RTC();
    connections[request.from] = cc;
    cc.id = request.id;
    
    var offer = new RTCSessionDescription(JSON.parse(request.text));
    cc.con.setRemoteDescription(offer);
    
    var id = request.from;
    var context = this;
    
    cc.con.onicecandidate = function(evt) {
        if(evt.candidate == null) {
            var request = new rAnswer(context.id, id, JSON.stringify(cc.con.localDescription));
            context.dc.send(request.toJString());
        }
    };
    
    cc.con.createAnswer(function(answer) {
        printMessage("Created local answer", "text-info");
        cc.con.setLocalDescription(answer);
    }, function() { 
            printMessage("Couldn't create answer.", "text-err");
        }
    );
    
};

RTC.prototype.addAnswer = function(request) {
    var cc = connections[request.from];
    var answer = new RTCSessionDescription(JSON.parse(request.text));
    cc.handleAnswer(answer);
};

RTC.prototype.rOffer = function(request) {
    var cc = connections[request.to];
    cc.rAddOffer(request.text,request.from, request.to);
};

RTC.prototype.rAnswer = function(request) {
    var cc = connections[request.to];
    cc.rAddAnswer(request.text, request.from);
};

RTC.prototype.setId = function(request) {
    this.id = request.text;
    connections[this.id] = null;
    connections[request.from] = this;
    this.rid = request.from;
    username = "User_" + this.id;
}
