var Cipher = function() {
    
    this.passphrase = "password"
    this.iv = forge.random.getBytesSync(32);
    this.key = unescape("%1BR%80R%D7%C8dn%9A%F4%18%09%E1%AD%E6%DD%C4%D9%C3%B4k2O%D9%BAV%0F%E3a%B4l%8D");

    this.riv = this.iv;
    this.rkey = this.key;

};

Cipher.prototype.encrypt = function(text) {
    var cipher = forge.cipher.createCipher("AES-CBC", this.key);
    cipher.start({iv: this.iv});
    cipher.update(forge.util.createBuffer(text));
    cipher.finish();
    return cipher.output.data;
};

Cipher.prototype.decrypt = function(text) {
    var decipher = forge.cipher.createDecipher("AES-CBC", this.rkey);
    decipher.start({iv: this.riv});
    decipher.update(forge.util.createBuffer(text));
    decipher.finish();
    return decipher.output.data; 
};
