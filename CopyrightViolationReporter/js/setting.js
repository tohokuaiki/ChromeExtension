var twitterApiKey;

// setting
var TwitterApiKey = function(){};

TwitterApiKey.prototype.consumerKey    = "";
TwitterApiKey.prototype.consumerSecret = ""; 

TwitterApiKey.prototype.setup = function(){
    var self = this;
    var dtd = new $.Deferred;
    chrome.storage.sync.get("twitterApiKey", function(value){
        if (typeof(value.twitterApiKey) !== 'undefined'){
            if (typeof(value.twitterApiKey.consumerKey) !== 'undefined' &&
                typeof(value.twitterApiKey.consumerSecret) !== 'undefined' ){
                self.consumerKey    = value.twitterApiKey.consumerKey;
                self.consumerSecret = value.twitterApiKey.consumerSecret;
                dtd.resolve(self.consumerKey, self.consumerSecret);
                return;
            }
        }
        dtd.reject();
    });
    return dtd.promise();
};

TwitterApiKey.prototype.registerAppKey = function(consumerKey, consumerSecret) {
    var self = this;
    var dtd = new $.Deferred;
    var setValue = {
        "twitterApiKey": {
            "consumerKey": consumerKey,
            "consumerSecret": consumerSecret
          }
    };    
    chrome.storage.sync.set(setValue, function(){
        if (!consumerKey || !consumerSecret) {
            dtd.reject();
        }
        else {
            self.consumerKey = consumerKey;
            self.consumerSecret = consumerSecret;
            dtd.resolve(consumerKey, consumerSecret);
        }
    });
    return dtd.promise();
};

twitterApiKey = new TwitterApiKey();
