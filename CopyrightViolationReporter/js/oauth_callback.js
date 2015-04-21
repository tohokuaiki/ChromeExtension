$(function() {
    // check
    twitterApiKey.setup().then(function(consumerKey, consumerSecret) {
        $('#error').hide();
        $('#success').show();
        mytwitter = new myTwitter(consumerKey, consumerSecret);
        var result = mytwitter.parseUserResult();
        if (result.denied){
            // only to close window
            window.close();
        }
        else {
            // get AccessToken
            mytwitter.saveAccessTokenStored = function(){
                window.close();
            };
            mytwitter.storeAccessToken(result);
        }
    }, function(){
        $('#error').show();
        $('#success').hide();
    });
});
