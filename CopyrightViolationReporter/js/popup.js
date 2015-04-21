var twitter_list_url = "https://raw.githubusercontent.com/tohokuaiki/ChromeExtension/master/CopyrightViolationReporter/xml/twitter_list.xml";
var report_post_url  = "http://chromeextension.junoe.jp/CopyrightViolationReporter/report_post.php";
var post_text_format = "@%s 「%s」 %s にて%s様の %s への著作権侵害と思われる箇所がございます。#著作権侵害報告";

var setPostFormDone = false;
var setPostForm = function(mytwitter, callback) {
    console.log("setPostForm"); 
    if (setPostFormDone){
        callback();
        return ;
    }
    setPostFormDone = true;
    
    var loading = $('#loading');
    
    // セッティングをロード
    var config = {
      config: {
        sendHistoryPermission: true 
      }
    };
    
    var loadConfig = function() {
        chrome.storage.sync.get(config, function(setting){
            var conf = setting.config;
            $('#sendHistoryPermission').prop('checked', conf.sendHistoryPermission);
        });
    };
    var saveConfig = function(key, value){
        chrome.storage.sync.get(config, function(setting){
            setting.config[key] = value;
            chrome.storage.sync.set(setting, function(){});
        });
    }
    // config listener
    $('#sendHistoryPermission').on('change', function(e){
        saveConfig('sendHistoryPermission', $(e.currentTarget).prop('checked'));
    });
    loadConfig();
    
    
    // create original url drop down list
    var tab_urls = [];
    chrome.tabs.getAllInWindow(function(tabs){
        for (var i=0,j=tabs.length; i<j; i++){
            var url = tabs[i].url;
            if (url.startsWith("http")){
                tab_urls.push(url);
            }
        }
        new Suggest.Local("original-url", "suggest-original", tab_urls, {dispMax: 10, interval: 250});
    });
      
    
    // create twitter-id drop down list
    /* global variables */
    var twitter_list = [];
    var url_list = [];
    
    // set timer
    var setOnChangeTimer ;
    var setOnChangeEvents = function(){
        console.log("setOnChangeEvents"); 
        url_list = [];
        // update url_list
        for (var i=0,j=twitter_list.length; i<j; i++) {
            for (var ii=0,jj=twitter_list[i].url.length; ii<jj; ii++){
                url_list.push({
                  url: twitter_list[i].url[ii],
                  index: i
                });
            }
        }
        // twitter-id
        var id_list = [];
        for (var i=0,j=twitter_list.length; i<j; i++) {
            id_list.push(twitter_list[i].name);
            id_list.push('@' + twitter_list[i].id);
        }
        new Suggest.Local("id-twitter", "suggest-twitter", id_list, {dispMax: 10, interval: 250});
        
        if (setOnChangeTimer) return ;
        
        var __url_cache     = "";
        var __account_cache = "";
        var __text_cache    = "";
        
        // text counter
        var text_counter = function(textarea){
            var txt = $(textarea).val();
            return txt.replace(/\shttps?:\/\/[^\s]+\s/g, " http://t.co/xxxxxxxxxx ").length;
        };
        
        setOnChangeTimer = setInterval(function() {
            var account = null;
            var account_txt = $('#id-twitter').val();
            var textarea = $('#text-twitter');
            var textarea_txt = textarea.val();
            var textcounter = $('#comment .twitter h2 span.counter');
            var original_url = $('#original-url').val();

            if (__url_cache != original_url){
                __url_cache = original_url;
                var account_suggest = [];
                for (var i=0, j=url_list.length; i<j; i++){
                    if (original_url.indexOf(url_list[i].url) >= 0){
                        account_suggest.push(url_list[i].index);
                    }
                }
                if (account_suggest.length == 1){
                    $('#id-twitter').val(twitter_list[account_suggest[0]].id);
                }
            }

            if (__account_cache != account_txt) {
                __account_cache = account_txt;
                // find sns account
                for (var i=0,j=twitter_list.length; i<j; i++) {
                    if ("@" + twitter_list[i].id == account_txt || twitter_list[i].name == account_txt){
                        account = {
                          id: twitter_list[i].id,
                          name: twitter_list[i].name
                        };
                    }
                }
                if (account === null){
                    account = {
                      id: account_txt,
                      name: account_txt
                    };
                }
                chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
                    if (tabs.length > 0){
                        var txt = sprintf(post_text_format, account.id, tabs[0].title, tabs[0].url, account.name, original_url);
                        textarea.val(txt);
                    };
                });
            }

            if (__text_cache != textarea_txt){
                __text_cache = textarea_txt;
                if (textarea_txt == ""){
                    textcounter.text('');
                } else {
                    // 文字数チェック
                    var text_length = text_counter(textarea);
                    textcounter.text('('+ text_length + '文字)');
                    if (text_length > 140){
                        textcounter.addClass('over140');
                        $('#btn').hide();
                    } else {
                        textcounter.removeClass('over140');
                        $('#btn').show();
                    }
                }
            }
        }, 200);
    };
    
    
    var getLocalTwitterList = function(){
        console.log("getLocalTwitterList"); 
        var dfd = new $.Deferred;
        chrome.storage.local.get({"twitter_list": null}, function(v){
            if (v.twitter_list !== null){
                // update global variable
                twitter_list = v.twitter_list;
                dfd.reject(); // not resolve!!
            }
            else {
                dfd.resolve();
            }
        });
        
        return dfd.promise();
    };
    
    var getRemoteTwitterList = function(){
        console.log("getRemoteTwitterList"); 
        return $.ajax({
          url: twitter_list_url,
          dataType: "xml"
        }).then(successRemoteTwitterList);
    };
    
    var successRemoteTwitterList = function(xml, status, xhr) {
        console.log("successRemoteTwitterList"); 
        // overwrite global variables
        twitter_list = []; 
        $(xml).find('account').each(function() {
            var urls = [];
            $(this).find('url').each(function(){
                urls.push($(this).text());
            });
            twitter_list.push({
              name: $(this).find('name').text(),
              id:   $(this).find('id').text(),
              url:  urls
            });
        });
        setOnChangeEvents();
        // save local
        chrome.storage.local.set({"twitter_list": twitter_list}, function(){});
    };
    
    // Get twitter-list start
    getLocalTwitterList()
      .then(function(){ return getRemoteTwitterList();},
            function(){ setOnChangeEvents(); getRemoteTwitterList(); return (new $.Deferred).resolve().promise();})
        .then(callback);
    
    
    
    ////////////////////////////////////////////////////
    // help tooltip
    var help_running = false;
    $('[rel^="qtip-"]').each(function(i, ele) {
        $(ele).qtip( {
          content: { attr: "qtip"},
          position: {
            my: 'top left',
            at: 'top left'
          },
          show: {
            event : "show",
            effect: function(offset){
                $(this).fadeIn("normal", function(){
                    setTimeout(function(){
                        $(ele).trigger('hide');
                    }, $(ele).attr('qtip').length * 100);
                });
            }
          },
          hide: {
            event: "hide",
            effect: function(offset){
                $(this).fadeOut("normal", function(){
                    if ($(ele).attr('rel').match(/^qtip-(\d+)$/)){
                        var num = parseInt(RegExp.$1) + 1;
                        var next = $('[rel="qtip-'+ num +'"]');
                        if (next.length > 0){
                            next.trigger('show');
                        } else {
                            help_running = false;
                            $('#original-url').focus();
                        }
                    }
                });
            }
          }
        });
    });
    $('#help').on('click', function(e) {
        if (!help_running){
            help_running = true;
            $('[rel="qtip-1"]').trigger('show');
        }
    });
        
    // show shortcut
    chrome.commands.getAll(function(commands) {
        for (var i=0,j=commands.length; i<j; i++){
            if (commands[i].name == '_execute_browser_action'){
                $('#hint-shortcut').show().find('span').text(commands[i].shortcut);
            }
        }
    });
    
    // tweet post function
    $('#doReport').on('click', function(e){
        loading.show();
        $('#wrapper>div').hide();
        var reportSuccess = function(data, status, xhr){
            var tweet_url = sprintf('https://twitter.com/%s/status/%s',
                                    data.user.screen_name,data.id_str);
            loading.hide();
            $('#main').show().siblings('div').hide();
            $('#result').show().siblings('div').hide();
            $('#result a').attr('href', tweet_url);
            // 記録
            if ($('#sendHistoryPermission:checked').length > 0){
                $.ajax({
                  url: report_post_url,
                  type: "post",
                  data: {
                    url: $('#original-url').val(),
                    id:  $('#id-twitter').val()
                  }
                });
            }
        };
        var reportFailed = function(xhr, data, status){
            loading.hide();
            $('#main').show().siblings('div').hide();
            $('#operation').show().siblings('div').hide();
            var errorMsg = "ツイートに失敗しました。\n";
            
            try {
                if (typeof(xhr.responseJSON.error) != 'undefined'){
                    errorMsg += xhr.responseJSON.error;
                }
                else if (typeof(xhr.responseJSON.errors) != 'undefined'){
                    var error = xhr.responseJSON.errors[0];
                    var errorCode = error.code; 
                    if (errorCode == 186){
                        errorMsg += "140文字を超えているようです。1～2文字減らしてみてください。";
                    } else {
                        errorMsg += "エラーコード：" + errorCode;
                        errorMsg += "\n" + error.message;
                      }
                }
            } catch(e){
                errorMsg += "もう一度操作してみてください。";
            }
            alert(errorMsg);
        };
        // do
        mytwitter.updateStatus($('#text-twitter').val()).then(reportSuccess, reportFailed);
    });
}
