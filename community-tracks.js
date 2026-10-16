(() => {
  "use strict";
  const API = window.POLYTRACK_COMMUNITY_API || "https://polytrack-community-tracks.YOUR_SUBDOMAIN.workers.dev";
  const PREFIX = "polytrack_v5_prod_track_";
  let overlay = null, tab = "tracks", offset = 0;
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const btn = (text, fn, cls) => { const b = el("button", "button " + (cls || ""), text); b.type = "button"; b.addEventListener("click", fn); return b; };
  const style = () => {
    if (document.getElementById("community-tracks-style")) return;
    const s = el("style"); s.id = "community-tracks-style";
    s.textContent = [
      ".community-tracks-overlay{position:absolute;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;background:rgba(7,10,18,.86);font-family:inherit;color:var(--text-color,#fff)}",
      ".community-tracks-panel{display:flex;flex-direction:column;width:min(900px,94vw);height:min(760px,92vh);background:var(--surface-color,#171d2c);border:1px solid #ffffff24;box-shadow:0 12px 50px #0009;clip-path:polygon(0 0,100% 0,100% calc(100% - 12px),calc(100% - 12px) 100%,0 100%)}",
      ".community-tracks-header{padding:16px 20px;background:var(--surface-secondary-color,#222a3b);border-bottom:2px solid #ffffff12}.community-tracks-header h1{margin:0;font-size:clamp(25px,4vw,38px);font-weight:normal}.community-tracks-subtitle{margin-top:4px;opacity:.72;font-size:14px}",
      ".community-tracks-tabs{display:flex;gap:6px;padding:12px 16px 0}.community-tracks-tabs .selected{background:var(--button-hover-color,#394663);outline:1px solid #ffffff22}.community-tracks-content{overflow:auto;flex:1;padding:14px 16px;min-height:0}",
      ".community-track-card{display:flex;gap:12px;align-items:center;padding:13px;margin-bottom:9px;background:var(--surface-secondary-color,#222a3b);border-left:3px solid #ffffff30}.community-track-copy{flex:1;min-width:0}.community-track-copy h3{margin:0 0 5px;font-size:22px;font-weight:normal;overflow-wrap:anywhere}.community-track-copy p{margin:3px 0;opacity:.75;white-space:pre-wrap;overflow-wrap:anywhere}.community-track-actions{display:flex;gap:7px;flex-wrap:wrap}.community-tracks-empty{padding:28px 12px;text-align:center;opacity:.72}",
      ".community-tracks-form{display:grid;gap:12px;max-width:720px;margin:auto}.community-tracks-form label{display:grid;gap:5px;font-size:16px}.community-tracks-form input,.community-tracks-form textarea{box-sizing:border-box;width:100%;padding:10px;background:var(--surface-tertiary-color,#101522);color:var(--text-color,#fff);border:1px solid #ffffff30;font:inherit}.community-tracks-form textarea{min-height:85px;resize:vertical}.community-tracks-status{padding:9px 0;white-space:pre-wrap;opacity:.82}.community-tracks-footer{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:12px 16px;background:var(--surface-secondary-color,#222a3b)}.community-tracks-footer .right{display:flex;gap:8px}",
      ".community-tracks-menu-subtitle{display:block;font-size:11px;line-height:1.3;opacity:.72;margin-top:3px;max-width:150px;white-space:normal}.community-tracks-overlay .button{cursor:pointer}",
      "@media(max-width:600px){.community-track-card{align-items:flex-start;flex-direction:column}.community-track-actions{width:100%}.community-tracks-panel{height:94vh}.community-tracks-header{padding:12px}.community-tracks-content{padding:10px}}"
    ].join("\n"); document.head.appendChild(s);
  };
  const tracks = () => {
    const out = [];
    try { for (let i=0;i<localStorage.length;i++) { const key=localStorage.key(i); if (!key || !key.startsWith(PREFIX)) continue; try { const v=JSON.parse(localStorage.getItem(key)); if (v && typeof v.data==="string" && v.data.startsWith("PolyTrack2")) out.push({key,name:key.slice(PREFIX.length),exportData:v.data,saveTime:v.saveTime||0}); } catch {} } } catch(e) { console.warn(e); }
    return out.sort((a,b)=>b.saveTime-a.saveTime || a.name.localeCompare(b.name));
  };
  function close(){ if(overlay) overlay.remove(); overlay=null; document.removeEventListener("keydown", keydown, true); }
  function keydown(e){ if(e.key==="Escape") close(); }
  function open(){
    close(); style(); tab="tracks"; offset=0;
    overlay=el("div","community-tracks-overlay"); overlay.setAttribute("role","dialog"); overlay.setAttribute("aria-modal","true");
    const panel=el("section","community-tracks-panel"), head=el("header","community-tracks-header"), tabs=el("nav","community-tracks-tabs"), content=el("main","community-tracks-content"), footer=el("footer","community-tracks-footer"), right=el("div","right");
    head.append(el("h1","","Community Tracks"),el("div","community-tracks-subtitle","hi guys its everybodysim i added track sharing :D"));
    footer.append(btn("Back",close),right); panel.append(head,tabs,content,footer); overlay.append(panel);
    overlay.addEventListener("click",e=>{if(e.target===overlay)close();}); document.addEventListener("keydown",keydown,true);
    (document.getElementById("ui")||document.body).append(overlay);
    function tabButtons(){ tabs.replaceChildren(btn("Tracks",()=>{tab="tracks";offset=0;tabButtons();renderTracks();},tab==="tracks"?"selected":""),btn("Publish",()=>{tab="publish";tabButtons();renderPublish();},tab==="publish"?"selected":"")); }
    function status(message){ const p=el("div","community-tracks-status",message); content.prepend(p); return p; }
    function renderTracks(){
      content.replaceChildren(); right.replaceChildren(); tabButtons();
      if(API.includes("YOUR_SUBDOMAIN")){content.append(el("div","community-tracks-empty","Community sharing is ready to connect, but the Cloudflare Worker URL still needs to be configured."));return;}
      const stat=status("Loading community tracks…");
      fetch(API.replace(/\/$/,"")+"/api/tracks?limit=20&offset="+offset).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load tracks");return d;}).then(d=>{
        stat.remove(); if(!d.tracks||!d.tracks.length){content.append(el("div","community-tracks-empty",offset?"No more tracks on this page yet.":"No community tracks published yet. Be the first!"));return;}
        d.tracks.forEach(t=>{
          const card=el("article","community-track-card"),copy=el("div","community-track-copy"),actions=el("div","community-track-actions");
          copy.append(el("h3","",t.name),el("p","",t.description||"No description"),el("p","","by "+t.author+" · "+new Date(t.created_at).toLocaleDateString()));
          actions.append(btn("Import",()=>importTrack(t.id),""),btn("Copy link",()=>GenCopy(location.origin+location.pathname+"?communityTrack="+encodeURIComponent(t.id)),""));
          card.append(copy,actions);content.append(card);
        });
        right.replaceChildren(); if(offset>0)right.append(btn("Previous",()=>{offset=Math.max(0,offset-20);renderTracks();})); if(offset+20<d.total)right.append(btn("Next",()=>{offset+=20;renderTracks();}));
      }).catch(e=>{stat.textContent="Could not load tracks: "+e.message;content.append(el("div","community-tracks-empty","Check that the Worker is deployed and its URL is configured."));});
    }
    async function importTrack(id){
      const st=status("Loading track…");
      try{
        const r=await fetch(API.replace(/\/$/,"")+"/api/tracks/"+encodeURIComponent(id));const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load track");
        const t=d.track;if(!t||typeof t.export_data!=="string"||!t.export_data.startsWith("PolyTrack2"))throw new Error("The track code is invalid.");
        const localName=t.export_name||t.name;const key=PREFIX+localName;
        if(localStorage.getItem(key)&&!confirm("A local track named “"+localName+"” already exists. Replace it?")){st.textContent="Import cancelled.";return;}
        localStorage.setItem(key,JSON.stringify({data:t.export_data,saveTime:Date.now()}));
        st.textContent="Imported “"+localName+"”! Reload the game to refresh the Custom Tracks list.";
        right.replaceChildren(btn("Reload game",()=>location.reload()));
      }catch(e){st.textContent="Import failed: "+e.message;}
    }
    function renderPublish(){
      content.replaceChildren();right.replaceChildren();tabButtons();
      if(API.includes("YOUR_SUBDOMAIN")){content.append(el("div","community-tracks-empty","The publishing form will work once the Cloudflare Worker URL is configured."));}
      const saved=tracks();
      if(!saved.length){content.append(el("div","community-tracks-empty","No locally saved custom tracks found. Make a track in the editor or import a track code first."));return;}
      saved.forEach(t=>{
        const card=el("article","community-track-card"),copy=el("div","community-track-copy"),actions=el("div","community-track-actions");
        copy.append(el("h3","",t.name),el("p","","Saved locally"));
        actions.append(btn("Publish",()=>publishForm(t),""));card.append(copy,actions);content.append(card);
      });
    }
    function publishForm(track){
      content.replaceChildren();right.replaceChildren();
      const form=el("form","community-tracks-form"), name=el("input"),desc=el("textarea"),author=el("input"),submit=btn("Publish track",()=>{}, "");submit.type="submit";
      name.maxLength=64;name.required=true;name.value=track.name;
      desc.maxLength=400;desc.placeholder="What makes this track fun? (optional)";
      author.maxLength=40;author.required=true;author.value=localStorage.getItem("polytrack-community-author")||"everybodysim";
      [[ "Track name",name ],[ "Description",desc ],[ "Author",author ]].forEach(pair=>{const l=el("label","",pair[0]);l.append(pair[1]);form.append(l);});
      const stat=el("div","community-tracks-status","Your local track is exported using Polytrack’s existing track-code format.");
      form.append(stat,submit);form.addEventListener("submit",async e=>{
        e.preventDefault();if(API.includes("YOUR_SUBDOMAIN")){stat.textContent="Set the Worker URL in community-tracks.js before publishing.";return;}
        submit.disabled=true;stat.textContent="Publishing…";
        try{
          const r=await fetch(API.replace(/\/$/,"")+"/api/tracks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:name.value.trim(),description:desc.value.trim(),author:author.value.trim(),exportName:track.name,exportData:track.exportData})});
          const d=await r.json();if(!r.ok)throw new Error(d.error||"Publish failed");
          localStorage.setItem("polytrack-community-author",author.value.trim());stat.textContent="Published! Your track is now in Community Tracks.";submit.disabled=false;right.replaceChildren(btn("View community tracks",()=>{tab="tracks";offset=0;renderTracks();}));
        }catch(err){stat.textContent="Could not publish: "+err.message;submit.disabled=false;}
      });
      content.append(form);
    }
    function GenCopy(text){if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(()=>alert("Link copied!")).catch(()=>prompt("Copy this link:",text));else prompt("Copy this link:",text);}
    tabButtons();renderTracks();
  }
  function patchMenu(){
    const ui=document.getElementById("ui"); if(!ui)return;
    const buttons=ui.querySelectorAll('button img[src*="multiplayer.svg"]');
    buttons.forEach(img=>{
      const old=img.closest("button");if(!old||old.dataset.communityTracksPatched==="1")return;
      const replacement=old.cloneNode(true);replacement.dataset.communityTracksPatched="1";
      const icon=replacement.querySelector("img");if(icon)icon.src="images/share.svg";
      const label=replacement.querySelector("p");if(label){label.textContent="Community Tracks";const sub=el("small","community-tracks-menu-subtitle","hi guys its everybodysim i added track sharing :D");label.append(sub);}else replacement.append(el("p","","Community Tracks"));
      replacement.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();open();},true);
      old.replaceWith(replacement);
    });
  }
  window.PolytrackCommunityTracks={open,close};
  const boot=()=>{patchMenu();const ui=document.getElementById("ui");if(ui)new MutationObserver(()=>patchMenu()).observe(ui,{subtree:true,childList:true});};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
