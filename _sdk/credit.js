/* Download credit shown for the first 3 seconds. */
(function(){
  try{
    if(sessionStorage.getItem("ss_credit")){return;}
    sessionStorage.setItem("ss_credit","1");
  }catch(e){}
  function show(){
    var d=document.createElement("div");
    d.textContent="This site download is by AniItsuki on all Socials";
    d.style.cssText="position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:2147483647;padding:10px 18px;border-radius:999px;background:rgba(0,0,0,.78);color:#fff;font:600 16px/1.2 system-ui,'Segoe UI',Arial,sans-serif;pointer-events:none;opacity:0;transition:opacity .4s;box-shadow:0 4px 18px rgba(0,0,0,.4);white-space:nowrap";
    (document.body||document.documentElement).appendChild(d);
    requestAnimationFrame(function(){d.style.opacity="1";});
    setTimeout(function(){d.style.opacity="0";},2600);
    setTimeout(function(){if(d.parentNode){d.parentNode.removeChild(d);}},3200);
  }
  if(document.body){show();}else{document.addEventListener("DOMContentLoaded",show);}
})();
