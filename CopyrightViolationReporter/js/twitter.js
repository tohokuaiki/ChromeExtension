/**
 * need setting.js, oauth.js, sha1.js
 */
var myTwitter = function(apiKey){
    this.accessor.consumerSecret = apiKey.consumerSecret;
    this.consumerKey = apiKey.consumerKey;
};

// define
myTwitter.prototype.authorize_url            = "https://api.twitter.com/oauth/authorize";
myTwitter.prototype.request_token_url        = "https://api.twitter.com/oauth/request_token";
myTwitter.prototype.access_token_url         = "https://api.twitter.com/oauth/access_token";
myTwitter.prototype.verify_token_url         = "https://api.twitter.com/1.1/account/verify_credentials.json";
myTwitter.prototype.update_status_url        = "https://api.twitter.com/1.1/statuses/update.json";
myTwitter.prototype.access_token_stored_key  = "twitter_access_token";

/* application parameters  */
myTwitter.prototype.consumerKey = ""; /* set after new */

myTwitter.prototype.accessor = {
  consumerSecret: "", /* set after new */
  tokenSecret:    ""  /* set after oauth_token_secret will be gotten */
};

myTwitter.prototype.oauthToken = {
    oauth_token: "",
    oauth_token_secret: "",
    oauth_callback_confirmed : ""
};


// must implement after new myTwitter()
myTwitter.prototype.onErrorOAuth = function(self, ajaxArgs) {
    // console.log(self, ajaxArgs); 
};

// parset a=b&c=d&e=f => {a: "b", c: "d", e: "f"}
myTwitter.prototype.parseQuery = function(query){
    var result ={};
    var query = query.split('&');
    for (var i=0,j=query.length; i<j; i++){
        var pair = query[i].split('=');
        if (pair.length == 2){
            result[pair[0]] = pair[1];
        }
    }
    return result;
};

myTwitter.prototype.getDefaultMessage = function(){
    return {
      method: "get", 
      action: "",
      parameters: { 
          oauth_signature_method : "HMAC-SHA1", 
          oauth_consumer_key     : this.consumerKey,
          oauth_version          : "1.0"
        }
    };
};

myTwitter.prototype.getRequestToken = function(){
    var self = this;
    
    var message = this.getDefaultMessage();
    
    message.action = this.request_token_url;
    message.parameters.oauth_callback = chrome.extension.getURL("oauth_callback.html");

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, this.accessor);
    var target = OAuth.addToURL(message.action, message.parameters);

    return $.ajax({
      type: message.method,
      url: target
    });
};


// get parameter from oauth_callback.html querystring
myTwitter.prototype.parseUserResult = function() {
    var query = location.search.substr(1);
    
    var result = {
        denied: "",
        oauth_token: "",
        oauth_verifier: ""
    };
    
    var r = this.parseQuery(query);
    for (var _k in r){
        if (typeof(result[_k]) !== 'undefined'){
            result[_k] = r[_k];
        }
    }
    
    return result;
};

myTwitter.prototype.storeAccessToken = function(param) {
    var self = this;
    
    var message = this.getDefaultMessage();
    
    for (var _key in param){
        message.parameters[_key] = param[_key];
    }
    message.action = this.access_token_url;
    
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, this.accessor);
    var target = OAuth.addToURL(message.action, message.parameters);
    $.ajax({
      type: message.method,
      url: target
    }).success(function(data, status, xhr){
        self.saveAccessToken(self, data);
    }).error(function(){
        self.onErrorOAuth();
    });
};
myTwitter.prototype.saveAccessToken = function(self, data) {
    var param = {};
    var data = self.parseQuery(data);
    param[self.access_token_stored_key] = data;
    chrome.storage.sync.set(param, function(){ 
        self.saveAccessTokenStored(self, data);
    });
    
    // set to this object properties
    self.oauthToken.oauth_token = data.oauth_token;
    self.accessor.tokenSecret   = data.oauth_token_secret;
};

// must implement after new myTwitter()
myTwitter.prototype.saveAccessTokenStored = function(self, data) {
};

myTwitter.prototype.getStoredAccessToken = function() {
    var dtd = new $.Deferred;
    var self = this;
    var defaultValue = {};
    defaultValue[this.access_token_stored_key] = {
        oauth_token       : "",
        oauth_token_secret: "",
        screen_name       : "",
        user_id           : ""
    };
    
    chrome.storage.sync.get(defaultValue, function(value){
        var data = value[self.access_token_stored_key];
        self.oauthToken.oauth_token = data.oauth_token;
        self.accessor.tokenSecret   = data.oauth_token_secret;
        
        if (data === null || data.oauth_token === "" ||  data.oauth_token_secret === ""){
            dtd.reject(data);
        }
        else {
            dtd.resolve(data);
        }
    });
    return dtd.promise();
};

myTwitter.prototype.verifyAccessToken = function() {
    var self = this;
    
    var message = this.getDefaultMessage();
    
    message.action = this.verify_token_url;
    message.parameters.oauth_token = this.oauthToken.oauth_token;
    message.parameters.include_entities = false;
    message.parameters.skip_status = true;

    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, this.accessor);
    var target = OAuth.addToURL(message.action, message.parameters);
    
    return $.ajax({
      type: "get",
      url: target
    });
};


myTwitter.prototype.updateStatus = function(tweet) {
    var self = this;
    
    var message = this.getDefaultMessage();
    message.method = "post";
    message.action = this.update_status_url;
    message.parameters.oauth_token = this.oauthToken.oauth_token;    
    message.parameters.status = tweet;
    
    OAuth.setTimestampAndNonce(message);
    OAuth.SignatureMethod.sign(message, this.accessor);
    
    var target = OAuth.addToURL(message.action, message.parameters);
    
    return $.ajax({
      type: message.method,
      url:  target
    });
};
