var RTC = function() {
    
    var cfg = {"iceServers": [{"url": "stun:23.21.150.121"}]};
    var opt = {"optional": [{"DtlsSrtpKeyAgreement": true}]};

    this.con = new RTCPeerConnection(cfg, opt);
    this.dc = null;
    this.desc = null;
    this.answer;
    this.who = null;
    
    this.cipher = new Cipher();
    
    var context = this;
    
    this.con.onicecandidate = function(evt) {
        if(evt.candidate == null) {
            $(".output").val(JSON.stringify(context.con.localDescription));
        }
    };
    
    this.con.onconnection = function() {
        print("Datachannel connected", "text-info");
    };
    
    this.con.ondatachannel = function(evt) {
        context.dc = evt.channel || evt;
        context.dc.onopen = function(evt) {
            print("Connection estabilished.", "text-info");
        }
        context.dc.onmessage = function(evt) {
            var data = JSON.parse(evt.data);
            context.parseMessage(data);
        };
        context.dc.onclose = function(evt) {
            print("Disconnected.", "text-info");  
        };
    };
    
};

RTC.prototype.parseMessage = function(data) {
    this[data.type](data);
};

RTC.prototype.setup = function() {
    try {
        this.dc = this.con.createDataChannel("test", {"reliable": true});

        this.dc.onopen = function(evt) {
            print("Connection estabilished.", "text-info");
        }
        var context = this;
        this.dc.onmessage = function(evt) {
            var data = JSON.parse(evt.data);            
            context.parseMessage(data);
        };
        this.dc.onclose = function(evt) {
            print("Disconnected.", "text-info");  
        };
    } catch(e) { 
            print("Connection error.", "text-err");
        }
};

RTC.prototype.createLocalOffer = function() {
    if(this.dc == null) {
        this.setup();
    }
    var context = this;
    this.con.createOffer(function(desc) {
        context.con.setLocalDescription(desc, function() {});
        context.desc = desc;
        print("Created local offer.", "text-info");
    }, function () {
            print("Couldn't create offer", "text-err");
        }
    );
};

RTC.prototype.handleOffer = function(offer) {
    this.con.setRemoteDescription(offer);
    var context = this;
    this.con.createAnswer(function (answer) {
        print("Created local answer", "text-info");
        context.con.setLocalDescription(answer);
        context.answer = answer;
    }, function() { 
            print("Couldn't create answer.", "text-err");
        }
    );
};

RTC.prototype.handleAnswer = function(answer) {
    this.con.setRemoteDescription(answer);
};

RTC.prototype.sendMessage = function(text) {
    var txt = this.cipher.encrypt(text);
    txt = escape(txt);
    
    var niv = forge.random.getBytesSync(32);
    var nie = escape(this.cipher.encrypt(escape(niv)));
            
    this.cipher.iv = niv;
    
    var msg = {"type": "chatMsg", "text": txt, "n": nie, "user": username};
    
    var moz = !! navigator.mozGetUserMedia;
    var data = (moz && msg.file) ? msg.file : JSON.stringify(msg);

    this.dc.send(data);
};

RTC.prototype.rGetOffer = function(rid) {
    var msg = {"type": "getOffer", "text": null, "n": null, "user": username, "rid": 10};
    
    var moz = !! navigator.mozGetUserMedia;
    var data = (moz && msg.file) ? msg.file : JSON.stringify(msg);

    this.dc.send(data);
};

RTC.prototype.rAddOffer = function(offer, mid) {
    var msg = {"type": "addOffer", "text": offer, "n": null, "user": username, "id": null, "mid": mid};
    
    var moz = !! navigator.mozGetUserMedia;
    var data = (moz && msg.file) ? msg.file : JSON.stringify(msg);

    this.dc.send(data);
};

RTC.prototype.rAddAnswer = function(answer) {
    var msg = {"type": "addAnswer", "text": answer, "n": null, "user": username, "id": null, "mid": 1};
    
    var moz = !! navigator.mozGetUserMedia;
    var data = (moz && msg.file) ? msg.file : JSON.stringify(msg);

    this.dc.send(data);
};

RTC.prototype.chatMsg = function(data) {
    var msg = data.text;
    print("<b>" + data.user + ": </b>" + this.cipher.decrypt(unescape(msg)), "message");
    
    var niv = data.n;
    this.cipher.riv = unescape(this.cipher.decrypt(unescape(niv)));
};

RTC.prototype.getOffer = function(data) {
    var cc = new RTC();
    connections.push(cc);
    cc.setup();
    var rid = data.id;
    var context = this;
    
    cc.con.createOffer(function(desc) {
        cc.con.setLocalDescription(desc, function() {});
        var msg = {"type": "rOffer", "text": JSON.stringify(desc), "n": null, "user": username, "rid": rid, "mid": 1};
        
        var moz = !! navigator.mozGetUserMedia;
        var dd = (moz && msg.file) ? msg.file : JSON.stringify(msg);

        context.dc.send(dd);
        print("Created local offer.", "text-info");
    }, function () {
            print("Couldn't create offer", "text-err");
        }
    );
    

};


RTC.prototype.addOffer = function(data) {
    var cc = new RTC();
    connections.push(cc);
    
    var offer = new RTCSessionDescription(JSON.parse(data.text));
    cc.con.setRemoteDescription(offer);
    
    var rid = data.id;
    var context = this;
    
    cc.con.createAnswer(function (answer) {
        print("Created local answer", "text-info");
        cc.con.setLocalDescription(answer);
        var msg = {"type": "rAnswer", "text": JSON.stringify(answer), "n": null, "user": username, "rid": rid, "mid": data.mid};
    
        var moz = !! navigator.mozGetUserMedia;
        var dd = (moz && msg.file) ? msg.file : JSON.stringify(msg);

        context.dc.send(dd);
        
    }, function() { 
            print("Couldn't create answer.", "text-err");
        }
    );
    
};

RTC.prototype.addAnswer = function(data) {
    var cc = connections[1];
    var answer = new RTCSessionDescription(JSON.parse(data.text));
    cc.handleAnswer(answer);
};

RTC.prototype.rOffer = function(data) {
    var cc = connections[1];
    cc.rAddOffer(data.text, data.mid);
};

RTC.prototype.rAnswer = function(data) {
    var cc = connections[data.mid];
    cc.rAddAnswer(data.text);
};
