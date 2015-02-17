var RTC = function() {
    
    var cfg = {"iceServers": [{"url": "stun:23.21.150.121"}]};
    var opt = {"optional": [{"DtlsSrtpKeyAgreement": true}]};

    this.con = new RTCPeerConnection(cfg, opt);
    this.dc = null;
    
    this.cipher = new Cipher();
    
    var context = this;

    
    this.con.onicecandidate = function(evt) {
        if(evt.candidate == null) {
            $(".output").val(JSON.stringify(context.con.localDescription));
            //copyToClipboard($(".output")[0].value);
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
            
            var msg = data.message;
            print("<b>" + data.user + ": </b>" + context.cipher.decrypt(unescape(msg)), "message");
            
            var niv = data.n;
            context.cipher.riv = unescape(context.cipher.decrypt(unescape(niv)));
        };
        context.dc.onclose = function(evt) {
            print("Disconnected.", "text-info");  
        };
    };
    
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
            
            var msg = data.message;
            print("<b>" + data.user + ": </b>" + context.cipher.decrypt(unescape(msg)), "message");
            
            var niv = data.n;
            context.cipher.riv = unescape(context.cipher.decrypt(unescape(niv)));
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
    
    var msg = {"user": username, "message": txt, "n": nie}
    
    var moz = !! navigator.mozGetUserMedia;
    var data = (moz && msg.file) ? msg.file : JSON.stringify(msg);

    this.dc.send(data);
};
