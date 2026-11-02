/* Offline stand-in for the Yandex Games SDK. */
(function(){
  var ls=window.localStorage;
  function ok(v){return Promise.resolve(v);}
  function soon(fn){setTimeout(fn,0);}
  function load(k){try{return JSON.parse(ls.getItem(k)||"{}");}catch(e){return {};}}
  var player={
    getName:function(){return "Player";},getPhoto:function(){return "";},getUniqueID:function(){return "local-player";},
    getMode:function(){return "lite";},isAuthorized:function(){return false;},
    uniqueID:"local-player",publicName:"Player",scopePermissions:{avatar:"forbid",public_name:"forbid"},signature:"",
    getPayingStatus:function(){return "unknown";},getAvatarSrc:function(){return "";},getAvatarSrcSet:function(){return "";},
    getIDsPerGame:function(){return ok([]);},
    getData:function(){return ok(load("ysdk_data"));},
    setData:function(d){ls.setItem("ysdk_data",JSON.stringify(d||{}));return ok();},
    getStats:function(){return ok(load("ysdk_stats"));},
    setStats:function(d){ls.setItem("ysdk_stats",JSON.stringify(d||{}));return ok();},
    incrementStats:function(){return ok({});}
  };
  var banner=false;
  var ysdk={
    features:{
      LoadingAPI:{ready:function(){}},
      GameplayAPI:{start:function(){},stop:function(){}},
      GamesAPI:{getAllGames:function(){return ok({games:[],developerURL:""});},getGameByID:function(){return ok({isAvailable:false});}}
    },
    adv:{
      showFullscreenAdv:function(o){
        var c=(o&&o.callbacks)||{};
        soon(function(){ if(c.onOpen){c.onOpen();} soon(function(){ if(c.onClose){c.onClose(false);} }); });
      },
      showRewardedVideo:function(o){
        var c=(o&&o.callbacks)||{};
        soon(function(){ if(c.onOpen){c.onOpen();} if(c.onRewarded){c.onRewarded();} soon(function(){ if(c.onClose){c.onClose();} }); });
      },
      getBannerAdvStatus:function(){return ok({stickyAdvIsShowing:banner});},
      showBannerAdv:function(){banner=false;return ok({stickyAdvIsShowing:false,reason:"UNKNOWN"});},
      hideBannerAdv:function(){banner=false;return ok({stickyAdvIsShowing:false});}
    },
    getPlayer:function(){return ok(player);},
    auth:{openAuthDialog:function(){return Promise.reject(new Error("offline"));}},
    getStorage:function(){return ok(ls);},
    environment:{app:{id:"0"},browser:{lang:"en"},i18n:{lang:(navigator.language||"en").slice(0,2),tld:"com"},payload:""},
    deviceInfo:{type:"desktop",isMobile:function(){return false;},isDesktop:function(){return true;},isTablet:function(){return false;},isTV:function(){return false;}},
    isAvailableMethod:function(){return ok(false);},
    feedback:{canReview:function(){return ok({value:false,reason:"UNKNOWN"});},requestReview:function(){return ok({feedbackSent:false});}},
    screen:{
      fullscreen:{
        status:"off",
        request:function(){var e=document.documentElement;try{if(e.requestFullscreen){e.requestFullscreen();}}catch(x){}return ok();},
        exit:function(){try{if(document.exitFullscreen){document.exitFullscreen();}}catch(x){}return ok();}
      },
      orientation:{value:"landscape",lock:function(){return ok();},unlock:function(){return ok();}}
    },
    getLeaderboards:function(){
      return ok({
        getLeaderboardDescription:function(){return ok({});},
        setLeaderboardScore:function(){return ok();},
        getLeaderboardPlayerEntry:function(){return Promise.reject({code:"LEADERBOARD_PLAYER_NOT_PRESENT"});},
        getLeaderboardEntries:function(){return ok({entries:[]});}
      });
    },
    leaderboards:null,
    getPayments:function(){
      return ok({
        getCatalog:function(){return ok([]);},
        getPurchases:function(){return ok([]);},
        purchase:function(){return Promise.reject(new Error("offline"));},
        consumePurchase:function(){return ok();}
      });
    },
    getFlags:function(){return ok({});},
    shortcut:{canShowPrompt:function(){return ok({canShow:false});},showPrompt:function(){return ok({outcome:"rejected"});}},
    clipboard:{writeText:function(t){try{return navigator.clipboard?navigator.clipboard.writeText(t):ok();}catch(e){return ok();}}},
    on:function(){return function(){};},off:function(){},dispatchEvent:function(){return ok();},
    serverTime:function(){return Date.now();},
    exit:function(){return ok();},
    EVENTS:{EXIT:"EXIT",HISTORY_BACK:"HISTORY_BACK",GAME_API_PAUSE:"GAME_API_PAUSE",GAME_API_RESUME:"GAME_API_RESUME"}
  };
  function whenLoaded(){
    return new Promise(function(r){
      function go(){setTimeout(r,300);}
      if(document.readyState==="complete"){go();}else{window.addEventListener("load",go);}
    });
  }
  window.YaGames={init:function(){return whenLoaded().then(function(){window.ysdk=ysdk;return ysdk;});}};
})();
