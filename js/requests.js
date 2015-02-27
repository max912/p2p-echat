var Request = function(type, from, to, text) {
    this.type = type;
    this.from = from;
    this.to = to;
    this.text = text;
};

Request.prototype.toJString = function() {
    return JSON.stringify(this);
};

var chatMsg = function(from, to, text, iv) {
    Request.call(this, "chatMsg", from, to, text);
    this.n = iv;
};

chatMsg.prototype = Object.create(Request.prototype);
chatMsg.prototype.constructor = chatMsg;


var getOffer = function(from, to, text, id) {
    Request.call(this, "getOffer", from, to, text);
    this.id = id;
};

getOffer.prototype = Object.create(Request.prototype);
getOffer.prototype.constructor = getOffer;

var addOffer = function(from, to, text, id) {
    Request.call(this, "addOffer", from, to, text);
    this.id = id;
};

addOffer.prototype = Object.create(Request.prototype);
addOffer.prototype.constructor = addOffer;

var addAnswer = function(from, to, text, id) {
    Request.call(this, "addAnswer", from, to, text);
    this.id = id;
};

addAnswer.prototype = Object.create(Request.prototype);
addAnswer.prototype.constructor = addAnswer;

var rOffer = function(from, to, text, id) {
    Request.call(this, "rOffer", from, to, text);
    this.id = id;
};

rOffer.prototype = Object.create(Request.prototype);
rOffer.prototype.constructor = rOffer;

var rAnswer = function(from, to, text, id) {
    Request.call(this, "rAnswer", from, to, text);
    this.id = id;
};

rAnswer.prototype = Object.create(Request.prototype);
rAnswer.prototype.constructor = rAnswer;

var setId = function(from, to, text) {
    Request.call(this, "setId", from, to, text);
};

setId.prototype = Object.create(Request.prototype);
setId.prototype.constructor = setId;
