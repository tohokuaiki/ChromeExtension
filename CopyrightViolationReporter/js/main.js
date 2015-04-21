var parse_url = function(url){var reg_parse_url=/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/;var result;var purl;var arrcgi={};var q,qq;if(arguments.length==1){purl=url}else{purl=location.href};result=reg_parse_url.exec(purl);if(!result){return{url:"",scheme:"",slash:"",host:"",port:"",path:"",query:"",hash:"",cgi:"",row:""}}if(result[6]){qq=result[6].split(unescape('&'));for(var i=0;i<qq.length;i++){q=qq[i].split('=');arrcgi[q[0]]=(q.length==2)?q[1]:'1'}}return{url:result[0],scheme:result[1],slash:result[2],host:result[3],port:result[4],path:result[5],query:result[6],hash:result[7],cgi:arrcgi,row:result}};    
window.sprintf || (function() {var _BITS = { i: 0x8011, d: 0x8011, u: 0x8021, o: 0x8161, x: 0x8261, X: 0x9261, f: 0x92, c: 0x2800, s: 0x84 }, _PARSE = /%(?:(\d+)\$)?(#|0)?(\d+)?(?:\.(\d+))?(l)?([%iduoxXfcs])/g;
window.sprintf = _sprintf;
function _sprintf(format) {function _fmt(m, argidx, flag, width, prec, size, types) { if (types === "%") { return "%"; } var v = "", w = _BITS[types], overflow, pad;idx = argidx ? parseInt(argidx) : next++; w & 0x400 || (v = (av[idx] === void 0) ? "" : av[idx]); w & 3 && (v = (w & 1) ? parseInt(v) : parseFloat(v), v = isNaN(v) ? "": v);w & 4 && (v = ((types === "s" ? v : types) || "").toString()); w & 0x20  && (v = (v >= 0) ? v : v % 0x100000000 + 0x100000000);w & 0x300 && (v = v.toString(w & 0x100 ? 8 : 16));w & 0x40  && (flag === "#") && (v = ((w & 0x100) ? "0" : "0x") + v);w & 0x80  && prec && (v = (w & 2) ? v.toFixed(prec) : v.slice(0, prec));w & 0x6000 && (overflow = (typeof v !== "number" || v < 0));w & 0x2000 && (v = overflow ? "" : String.fromCharCode(v));w & 0x8000 && (flag = (flag === "0") ? "" : flag);v = w & 0x1000 ? v.toString().toUpperCase() : v.toString();if (!(w & 0x800 || width === void 0 || v.length >= width)) { pad = Array(width - v.length + 1).join(!flag ? " " : flag === "#" ? " " : flag); v = ((w & 0x10 && flag === "0") && !v.indexOf("-"))     ? ("-" + pad + v.slice(1)) : (pad + v);} return v;}  var next = 1, idx = 0, av = arguments; return format.replace(_PARSE, _fmt);}})();

$(function(){
    var loading = $('#loading');
    loading.show();
    
    // request_token callbacks
    var getRequestTokenSuccess = function(mytwitter, target, data) {
        var param = mytwitter.parseQuery(data);
        for (var key in param){
            mytwitter.oauthToken[key] = param[key];
        }
        var authorize_url = mytwitter.authorize_url;
        authorize_url += "?oauth_token=" + mytwitter.oauthToken.oauth_token;
        
        $("#main").show().siblings('div').hide();
        $('#' + target).show().siblings('div').hide();
        $('#' + target + ' a').attr('href', authorize_url);
    };
    var getRequestTokenFailed = function(){
        // check Application keys!
        alert("リクエストトークンが取得できません。\nAPIキーをチェックしてください。");
        loading.hide();
        $('#setting').show().siblings('div').hide();
    };
    
    $('#registerAppKey').on('click', function(e){
        e.preventDefault();
        var consumerKey    = $.trim($('#consumerKey').val());
        var consumerSecret = $.trim($('#consumerSecret').val());
        
        if (!consumerKey || !consumerSecret) return ;
        
        loading.show();
        $('#wrapper>div').hide();
        
        // register to storage
        twitterApiKey.
          registerAppKey(consumerKey, consumerSecret).
            then(setupOAuth, showAppCreatePage);
    });
    
    
    var showAppCreatePage = function(){
        console.log("showAppCreatePage"); 
        loading.hide();
        $("#setting").show().siblings('div').hide();
    };
    
    var setupOAuth = function(consumerKey, consumerSecret) {
        console.log("setupOAuth"); 
        // twitter application setting
        loading.show();
        $('#setup-key').show();
        
        $('#consumerKey').val(consumerKey);
        $('#consumerSecret').val(consumerSecret);
        
        

        var mytwitter = new myTwitter(twitterApiKey);
        
        // set error handler
        mytwitter.onErrorOAuth = function(){
            console.log("onErrorOAuth"); 
            if ($('#onError').css('display') === 'none'){
                mytwitter.getRequestToken().then(function(data, status, xhr){
                    getRequestTokenSuccess(mytwitter, 'onError', data);
                }, getRequestTokenFailed);
            }
        };

        // auth
        var verifyStoredAccessToken = function(token){
            console.log("verifyStoredAccessToken"); 
            // storage access_token gotten , next oauth twitter
            loading.show();
            $('#wrapper>div').hide();
            
            // callbacks
            var verifySuccess = function(data, status, xhr) {
                console.log("verifySuccess"); 
                $('#operation').find('.loginAs span').text(data.screen_name);
                setPostForm(mytwitter, function(){
                    console.log("setPostForm callback"); 
                    loading.hide();
                    $('#main').show().siblings('div').hide();
                    $('#operation').show().siblings('div').hide();
                    $('#original-url').focus();
                });
            };
            var verifyFailed = function() {
                console.log("verifyFailed"); 
                mytwitter.accessor.tokenSecret = "";
                mytwitter.onErrorOAuth();
            }
            mytwitter.verifyAccessToken().then(verifySuccess, verifyFailed);
        };
            
        
        var failedGetStoredAccessToken = function(token) {
            console.log("failedGetStoredAccessToken"); 
            loading.hide();
            $('#main').show().siblings('div').hide();
            $('#oauth').show().siblings('div').hide();
            
            mytwitter.getRequestToken().then(function(data, status, xhr){
                getRequestTokenSuccess(mytwitter, 'oauth', data);
            }, getRequestTokenFailed);            
        };
        mytwitter.getStoredAccessToken().then(verifyStoredAccessToken, failedGetStoredAccessToken);
    };
    
    // show setup panel
    $('#setup-key').on('click', function(e){
        var setting = $('#setting');
        if (setting.css('display') == 'none'){
            $('#setting').show().siblings('div').hide();
        } else {
            $('#setting').hide().siblings('div').show();
        }
    });
    
    
    /**********************
     *  trigger
     **********************/
    twitterApiKey.setup().then(setupOAuth, showAppCreatePage);
});
