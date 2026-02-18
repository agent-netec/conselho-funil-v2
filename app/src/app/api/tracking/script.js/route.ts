export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/tracking/script.js?brandId=XXX
 * Returns injectable JS tracking script (<5KB minified).
 * Public endpoint — no auth required (script is embedded in external sites).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brandId');

  if (!brandId || !/^[a-zA-Z0-9_-]+$/.test(brandId)) {
    return new NextResponse('// Invalid brandId', {
      status: 400,
      headers: { 'Content-Type': 'application/javascript; charset=utf-8' },
    });
  }

  // Build the script with the brandId baked in
  const origin = new URL(request.url).origin;
  const script = buildTrackingScript(brandId, origin);

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=600',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

function buildTrackingScript(brandId: string, origin: string): string {
  // Self-executing tracking script — <5KB minified
  return `(function(){
"use strict";
var B="${brandId}",E="${origin}/api/tracking/ingest",Q=[],F=!1,S=Date.now(),SID=Math.random().toString(36).slice(2)+Date.now().toString(36);

// --- Utils ---
function gp(n){try{var u=new URLSearchParams(location.search);return u.get(n)||""}catch(e){return""}}
function sha(s){
  // Simple djb2 hash for client-side lead ID (NOT cryptographic — server re-hashes with SHA256)
  var h=5381;for(var i=0;i<s.length;i++){h=((h<<5)+h)+s.charCodeAt(i);h=h&h}
  return"cl_"+Math.abs(h).toString(36)
}

// --- UTM extraction ---
var UTM={s:gp("utm_source"),m:gp("utm_medium"),c:gp("utm_campaign")};

// --- Beacon sender ---
function send(type,payload){
  var evt={brandId:B,type:type,source:"web",payload:payload||{},session:{sessionId:SID,utmSource:UTM.s||"direct",utmMedium:UTM.m||"none",utmCampaign:UTM.c||"none"},ts:Date.now()};
  Q.push(evt);
  if(!F){F=!0;setTimeout(flush,1000)}
}
function flush(){
  if(!Q.length){F=!1;return}
  var batch=Q.splice(0,10);
  var body=JSON.stringify({events:batch});
  if(navigator.sendBeacon){navigator.sendBeacon(E,body)}
  else{try{var x=new XMLHttpRequest();x.open("POST",E,!0);x.setRequestHeader("Content-Type","application/json");x.send(body)}catch(e){}}
  if(Q.length){setTimeout(flush,1000)}else{F=!1}
}

// --- page_view ---
send("page_view",{url:location.href,referrer:document.referrer,title:document.title});

// --- scroll_depth ---
var maxScroll=0;
function onScroll(){
  var sh=document.documentElement.scrollHeight-window.innerHeight;
  if(sh<=0)return;
  var pct=Math.round((window.scrollY/sh)*100);
  if(pct>maxScroll){maxScroll=pct}
}
window.addEventListener("scroll",onScroll,{passive:!0});

// --- time on page + scroll depth (on unload) ---
function onLeave(){
  var dur=Math.round((Date.now()-S)/1000);
  send("page_view",{url:location.href,duration:dur,scrollDepth:maxScroll,event:"page_exit"});
  flush();
}
window.addEventListener("pagehide",onLeave);

// --- lead_capture (form submit interception) ---
function interceptForms(){
  document.addEventListener("submit",function(e){
    var form=e.target;
    if(!form||!form.querySelectorAll)return;
    var inputs=form.querySelectorAll('input[type="email"],input[name*="email"],input[name*="Email"]');
    var email="";
    for(var i=0;i<inputs.length;i++){if(inputs[i].value&&inputs[i].value.indexOf("@")>-1){email=inputs[i].value;break}}
    if(email){
      send("lead_capture",{email:sha(email.toLowerCase().trim()),formId:form.id||form.action||"unknown"});
    }
  },!0);
}
interceptForms();

// --- checkout events (manual trigger API) ---
window.CFTrack={
  event:function(type,data){
    if(typeof type==="string"){send(type,data||{})}
  },
  purchase:function(d){send("purchase_complete",d||{})},
  checkout:function(d){send("checkout_start",d||{})}
};
})();`;
}
