/* Site Saver performance: caps render resolution on high-DPI screens. F8 cycles balanced / low / native. */
(function(){
  try{
    var KEY="ss_res",mode=localStorage.getItem(KEY)||"balanced";
    var real=window.devicePixelRatio||1;
    var cap=({native:99,balanced:1,low:0.75})[mode]||1;
    Object.defineProperty(window,"devicePixelRatio",{configurable:true,get:function(){return Math.min(real,cap);}});
    window.addEventListener("keydown",function(e){
      if(e.key==="F8"){
        e.preventDefault();
        var order=["balanced","low","native"],n=order[(order.indexOf(mode)+1)%3];
        try{localStorage.setItem(KEY,n);}catch(x){}
        location.reload();
      }
    },true);
  }catch(e){}
})();

/* Site Saver offline shim: serves the files a game downloads at runtime
   (fetch AND XMLHttpRequest) when the browser refuses to, e.g. on file:// ,
   and transparently decompresses Brotli/Gzip builds that have no server headers. */
(function(){
  var M={"TemplateData/favicon.ico":0,"TemplateData/style.css":0,"_external/app-522766.cdn.games.yandex.net/sdk.js":0,"Build/granny-1-barbie.loader.js":0,"Build/granny-1-barbie.data":0,"Build/granny-1-barbie.framework.js":0,"Build/granny-1-barbie.wasm":0,"TemplateData/unity-logo-dark.png":0,"TemplateData/progress-bar-empty-dark.png":0,"TemplateData/progress-bar-full-dark.png":0,"TemplateData/webgl-logo.png":0,"TemplateData/fullscreen-button.png":0};
  var cs=document.currentScript;
  if(!cs||!window.Promise){return;}
  var root;
  try{ root=new URL("../",cs.src).href; }catch(e){ return; }
  var LC={},key0;
  for(key0 in M){ if(M.hasOwnProperty(key0)){ LC[key0.toLowerCase()]=key0; } }
  var isFile=(location.protocol==="file:");
  var origFetch=window.fetch;
  var packs={},cache={};
  window.__ss_pack=function(key,b64){packs[key]=b64;};

  function load(src){
    return new Promise(function(ok,bad){
      var s=document.createElement("script");
      s.src=src;
      s.onload=function(){ok(s);};
      s.onerror=function(){bad(new Error("Site Saver: could not load "+src));};
      (document.head||document.documentElement).appendChild(s);
    });
  }
  function b64bytes(b64){
    var n=b64.length,pad=0;
    if(b64.charAt(n-1)==="="){pad++;}
    if(b64.charAt(n-2)==="="){pad++;}
    var out=new Uint8Array((n/4)*3-pad),o=0,CH=4194304;
    for(var i=0;i<n;i+=CH){
      var bin=atob(b64.substr(i,CH));
      for(var j=0;j<bin.length;j++){out[o++]=bin.charCodeAt(j);}
    }
    return out;
  }
  function ensureBrotli(){
    if(window.BrotliDecode){return Promise.resolve();}
    return load(root+"_sdk/brotli-decode.js");
  }
  function typeOf(k){
    k=k.toLowerCase().replace(/\.(br|gz|gzip)$/,"");
    if(/\.wasm$/.test(k)){return "application/wasm";}
    if(/\.(js|mjs|framework|unityweb)$/.test(k)){return "application/javascript";}
    if(/\.json$/.test(k)){return "application/json";}
    if(/\.css$/.test(k)){return "text/css";}
    if(/\.html?$/.test(k)){return "text/html";}
    if(/\.(txt|csv|atlas|fnt|vert|frag|shader)$/.test(k)){return "text/plain";}
    if(/\.xml$/.test(k)){return "text/xml";}
    if(/\.png$/.test(k)){return "image/png";}
    if(/\.(jpe?g)$/.test(k)){return "image/jpeg";}
    if(/\.webp$/.test(k)){return "image/webp";}
    if(/\.svg$/.test(k)){return "image/svg+xml";}
    if(/\.mp3$/.test(k)){return "audio/mpeg";}
    if(/\.(ogg|oga)$/.test(k)){return "audio/ogg";}
    if(/\.wav$/.test(k)){return "audio/wav";}
    if(/\.mp4$/.test(k)){return "video/mp4";}
    return "application/octet-stream";
  }
  function packUrl(key){
    return root+key.split("/").map(encodeURIComponent).join("/")+".ssp.js";
  }
  function get(key){
    if(cache[key]){return cache[key];}
    var flag=M[key]||0;
    var p=load(packUrl(key)).then(function(s){
      var b64=packs[key];
      delete packs[key];
      if(s.parentNode){s.parentNode.removeChild(s);}
      if(typeof b64!=="string"){throw new Error("Site Saver: no packed data for "+key);}
      var bytes=b64bytes(b64);
      b64=null;
      if(flag===1){
        return ensureBrotli().then(function(){
          var r=window.BrotliDecode(new Int8Array(bytes.buffer,bytes.byteOffset,bytes.length));
          return new Uint8Array(r.buffer,r.byteOffset,r.length);
        });
      }
      if(flag===2&&window.DecompressionStream){
        var st=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
        return new Response(st).arrayBuffer().then(function(ab){return new Uint8Array(ab);});
      }
      return bytes;
    });
    cache[key]=p;
    p.then(function(){setTimeout(function(){delete cache[key];},0);},function(){delete cache[key];});
    return p;
  }
  function keyOf(url){
    try{
      var href=new URL(url,document.baseURI).href;
      if(href.indexOf(root)!==0){return null;}
      var k=decodeURIComponent(href.substring(root.length).split(/[?#]/)[0]);
      if(M.hasOwnProperty(k)){return k;}
      k=LC[k.toLowerCase()];
      return k?k:null;
    }catch(e){}
    return null;
  }
  /* On a real web server the original file is usually fine; compressed builds
     are not, because most hosts do not send Content-Encoding for .br/.gz. */
  function usePack(key){ return isFile||M[key]>0; }

  /* ---- fetch ---- */
  if(origFetch){
    window.fetch=function(input,init){
      var u=(typeof input==="string")?input:((input&&input.url)||String(input));
      var k=keyOf(u);
      if(k&&usePack(k)){
        return get(k).then(function(buf){
          return new Response(buf,{status:200,statusText:"OK",headers:{"Content-Type":typeOf(k),"Content-Length":String(buf.byteLength)}});
        });
      }
      return origFetch.apply(this,arguments);
    };
  }

  /* ---- XMLHttpRequest (this is what Unity, Godot and most engines use) ---- */
  try{
    var XP=window.XMLHttpRequest&&window.XMLHttpRequest.prototype;
    if(XP&&XP.open&&XP.send){
      var oOpen=XP.open,oSend=XP.send,oHdr=XP.setRequestHeader,oAbort=XP.abort;
      XP.open=function(method,url,async){
        this.__ssKey=null;this.__ssHdr=null;this.__ssAbort=false;
        var k=(url===undefined||url===null)?null:keyOf(String(url));
        if(k&&usePack(k)&&async!==false){
          this.__ssKey=k;
          this.__ssArgs=[method,String(url)];
          return;
        }
        return oOpen.apply(this,arguments);
      };
      XP.setRequestHeader=function(n,v){
        if(this.__ssKey){ if(!this.__ssHdr){this.__ssHdr=[];} this.__ssHdr.push([n,v]); return; }
        return oHdr.apply(this,arguments);
      };
      XP.abort=function(){
        if(this.__ssKey){ this.__ssAbort=true; this.__ssKey=null; }
        return oAbort.apply(this,arguments);
      };
      XP.send=function(body){
        var self=this;
        if(!this.__ssKey){ return oSend.apply(this,arguments); }
        var k=this.__ssKey,args=this.__ssArgs,hdr=this.__ssHdr;
        function raw(){
          try{ oOpen.call(self,args[0],args[1],true); oSend.call(self,body); }catch(e){}
        }
        get(k).then(function(buf){
          if(self.__ssAbort){return;}
          self.__ssKey=null;
          var url=null;
          try{ url=URL.createObjectURL(new Blob([buf],{type:typeOf(k)})); }catch(e){}
          if(!url){ raw(); return; }
          try{
            self.addEventListener("loadend",function(){ try{URL.revokeObjectURL(url);}catch(e){} });
            oOpen.call(self,args[0],url,true);
            if(hdr){ for(var i=0;i<hdr.length;i++){ try{oHdr.apply(self,hdr[i]);}catch(e){} } }
            oSend.call(self,body);
          }catch(e){ raw(); }
        },function(){ self.__ssKey=null; raw(); });
      };
    }
  }catch(e){}

  /* ---- scripts whose src is set from JS (Unity framework.js, engine workers) ---- */
  try{
    var d=Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype,"src");
    if(d&&d.set){
      Object.defineProperty(HTMLScriptElement.prototype,"src",{
        configurable:true,enumerable:d.enumerable,
        get:function(){return d.get.call(this);},
        set:function(v){
          var k=keyOf(v),self=this;
          if(!k||!usePack(k)){d.set.call(this,v);return;}
          get(k).then(function(buf){
            d.set.call(self,URL.createObjectURL(new Blob([buf],{type:"application/javascript"})));
          },function(){d.set.call(self,v);});
        }
      });
      var oSetAttr=Element.prototype.setAttribute;
      Element.prototype.setAttribute=function(n,v){
        if(this.tagName==="SCRIPT"&&String(n).toLowerCase()==="src"){ this.src=v; return; }
        return oSetAttr.apply(this,arguments);
      };
    }
  }catch(e){}

  /* ---- streaming WebAssembly needs real MIME headers; use the buffer path ---- */
  try{
    if(window.WebAssembly&&WebAssembly.instantiateStreaming){
      WebAssembly.instantiateStreaming=function(src,imp){
        return Promise.resolve(src).then(function(r){return r.arrayBuffer();}).then(function(b){return WebAssembly.instantiate(b,imp);});
      };
    }
    if(window.WebAssembly&&WebAssembly.compileStreaming){
      WebAssembly.compileStreaming=function(src){
        return Promise.resolve(src).then(function(r){return r.arrayBuffer();}).then(function(b){return WebAssembly.compile(b);});
      };
    }
  }catch(e){}

  /* ---- service workers can never register offline; fail quietly instead of throwing ---- */
  try{
    if(isFile&&navigator.serviceWorker&&navigator.serviceWorker.register){
      navigator.serviceWorker.register=function(){return Promise.reject(new Error("Site Saver: service workers are unavailable offline"));};
    }
  }catch(e){}
})();

/* Site Saver debug panel: press F9 on the saved page to see load errors and copy them. */
(function(){
  var log=[],panel=null,ta=null;
  function add(s){
    log.push(Math.round(performance.now()/1000)+"s  "+s);
    if(log.length>500){log.shift();}
    if(ta){ta.value=log.join("\n");ta.scrollTop=ta.scrollHeight;}
  }
  var oe=console.error,ow=console.warn;
  console.error=function(){try{add("ERROR "+Array.prototype.join.call(arguments," ").slice(0,300));}catch(e){}return oe.apply(this,arguments);};
  console.warn=function(){try{add("WARN  "+Array.prototype.join.call(arguments," ").slice(0,300));}catch(e){}return ow.apply(this,arguments);};
  window.addEventListener("error",function(e){
    var t=e.target;
    if(t&&t!==window&&(t.src||t.href)){add("FAILED TO LOAD "+(t.src||t.href));}else{add("JS ERROR "+e.message);}
  },true);
  window.addEventListener("unhandledrejection",function(e){add("PROMISE ERROR "+((e.reason&&e.reason.message)||e.reason));});
  var f=window.fetch;
  if(f){
    window.fetch=function(){
      var a=arguments,u=(typeof a[0]==="string")?a[0]:(a[0]&&a[0].url);
      return f.apply(this,a).then(function(r){if(!r.ok){add("HTTP "+r.status+" "+u);}return r;},function(e){add("FETCH FAILED "+u+" ("+e+")");throw e;});
    };
  }
  var xo=XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open=function(m,u){
    var x=this;
    x.addEventListener("error",function(){add("XHR FAILED "+u);});
    x.addEventListener("load",function(){if(x.status>=400){add("XHR "+x.status+" "+u);}});
    return xo.apply(this,arguments);
  };
  function toggle(){
    if(panel){panel.parentNode.removeChild(panel);panel=null;ta=null;return;}
    panel=document.createElement("div");
    panel.style.cssText="position:fixed;left:0;right:0;bottom:0;height:45%;z-index:2147483647;background:#000d;color:#0f0;font:12px monospace;padding:4px;box-sizing:border-box";
    ta=document.createElement("textarea");
    ta.readOnly=true;
    ta.style.cssText="width:100%;height:calc(100% - 26px);background:#000;color:#0f0;border:1px solid #0f0;font:12px monospace";
    ta.value=log.join("\n");
    var b1=document.createElement("button");b1.textContent="Copy";
    b1.onclick=function(){ta.select();try{document.execCommand("copy");}catch(e){}};
    var b2=document.createElement("button");b2.textContent="Close (F9)";b2.onclick=toggle;
    panel.appendChild(ta);panel.appendChild(b1);panel.appendChild(b2);
    document.body.appendChild(panel);
  }
  window.addEventListener("keydown",function(e){if(e.key==="F9"){e.preventDefault();toggle();}},true);
})();