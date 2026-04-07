import { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { renderGraphic, PLATFORM_SIZES, PLATFORM_LIST, POST_TYPES } from '../lib/renderGraphic';
import { BRAND_ASSETS, STOCK_PHOTOS } from '../lib/assets';

// ── CONSTANTS ─────────────────────────────────────────
const B = {
  primary:'#2C4D45',secondary:'#A86D53',tertiary:'#DFAC7A',
  cream:'#FAF7F2',dark:'#1a1a1a',mid:'#555',light:'#999',border:'#e8e0d8',
};

const PLAT_COLORS = {
  'Instagram Feed':'#c13584','LinkedIn Feed':'#0077b5',
  'X / Twitter':'#1da1f2','Instagram Story':'#c13584',
};

const SYSTEM_PROMPT = `You are the MyLÚA Health content engine. MyLÚA Health is an enterprise agentic AI platform for perinatal and maternal care, built on IBM watsonx Orchestrate and watsonx.ai. Co-founders: J'Vanay Santos-Fabian (CEO, doula and maternal wellness strategist) and Michael Conward, Ph.D. (CTO, AI engineer).

KEY PROOF POINTS (university research pilot — NOT IBM-validated):
- 90%+ first-trimester PPD risk identification accuracy
- 64% health risk assessment completion rate
- 79% of users comfortable sharing sensitive data
- IBM Silver Ecosystem Partner. Patent-pending multimodal AI. ibm.com/case-studies/mylua-health. IBM CAB 2026. HIPAA-compliant.

RULES: Never attribute pilot stats to IBM. Never say "certified" for J'Vanay's doula work. Never reveal patent mechanics. Voice: warm, credible, specific. No "revolutionizing."
RESPOND ONLY WITH VALID JSON. No markdown, no backticks.`;

function today() { return new Date().toISOString().split('T')[0]; }
function addDays(d,n){const dt=new Date(d+'T12:00:00');dt.setDate(dt.getDate()+n);return dt.toISOString().split('T')[0];}
function fmtDate(iso){return new Date(iso+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});}
function getDay(iso){return new Date(iso+'T12:00:00').getDate();}
function getMon(iso){return new Date(iso+'T12:00:00').toLocaleDateString('en-US',{month:'short'});}

// ── SMALL COMPONENTS ──────────────────────────────────
function PlatPill({p,small}){
  return <span style={{background:PLAT_COLORS[p]||B.primary,color:'white',fontSize:small?9:10,fontWeight:600,padding:small?'1px 6px':'2px 8px',borderRadius:10,whiteSpace:'nowrap'}}>{p}</span>;
}

function Btn({onClick,children,variant='ghost',disabled,style={}}){
  const styles={
    primary:{background:B.secondary,color:'white',border:'none'},
    danger:{background:'#fef2f2',color:'#c0392b',border:'1px solid #fecaca'},
    ghost:{background:'none',color:B.mid,border:`1px solid ${B.border}`},
    dark:{background:B.primary,color:'white',border:'none'},
  };
  return(
    <button onClick={onClick} disabled={disabled} style={{
      padding:'8px 18px',borderRadius:10,fontFamily:'inherit',fontSize:12,fontWeight:600,
      cursor:disabled?'default':'pointer',transition:'all 0.15s',opacity:disabled?0.5:1,
      ...styles[variant],...style,
    }}>{children}</button>
  );
}

// ── HEADER ────────────────────────────────────────────
function Header({view,calCount,photoCount,onNav}){
  const navItems=[
    {v:'input',label:'＋ New'},
    {v:'library',label:`📷 Photos (${photoCount})`},
    {v:'calendar',label:`📅 Calendar (${calCount})`},
  ];
  const isActive=(v)=>v===view||(v==='input'&&(view==='staging'||view==='results'));
  return(
    <header style={{background:B.primary,padding:'0 24px',display:'flex',alignItems:'center',gap:14,height:58,flexShrink:0,boxShadow:'0 2px 16px rgba(0,0,0,0.2)',position:'sticky',top:0,zIndex:100}}>
      <svg width="30" height="30" viewBox="0 0 100 100">
        {[0,1,2,3,4,5,6].map(i=><ellipse key={i} cx="50" cy="50" rx="10" ry="38" fill={i%2===0?'#DFAC7A':'rgba(223,172,122,0.5)'} transform={`rotate(${i*180/7} 50 50)`}/>)}
      </svg>
      <div>
        <div style={{color:'white',fontWeight:700,fontSize:15,letterSpacing:-0.3}}>MyLÚA Content OS</div>
        <div style={{color:'rgba(255,255,255,0.4)',fontSize:10}}>AI-powered content pipeline</div>
      </div>
      <nav style={{marginLeft:'auto',display:'flex',gap:6}}>
        {navItems.map(({v,label})=>(
          <button key={v} onClick={()=>onNav(v)} style={{
            background:isActive(v)?'rgba(255,255,255,0.15)':'transparent',
            color:isActive(v)?'white':'rgba(255,255,255,0.45)',
            border:'none',padding:'6px 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',
          }}>{label}</button>
        ))}
      </nav>
    </header>
  );
}

// ── INPUT VIEW ────────────────────────────────────────
function InputView({onDrafted}){
  const [inputType,setInputType]=useState('update');
  const [input,setInput]=useState('');
  const [postCount,setPostCount]=useState(1);
  const [generating,setGenerating]=useState(false);
  const [progress,setProgress]=useState(0);
  const [progressMsg,setProgressMsg]=useState('');
  const [error,setError]=useState(null);

  const types=[
    {id:'update',label:'🗓 My Update',desc:'Milestone, news, outcome'},
    {id:'news',label:'📰 Industry News',desc:'Article or event to riff on'},
    {id:'idea',label:'💬 Raw Idea',desc:'Hook, angle, or thought'},
  ];

  const ph={
    update:"e.g. 'Signed a pilot with a Medicaid plan in Georgia' or 'Just spoke at IBM Innovation Center'",
    news:"Paste a headline, URL, or describe the article...",
    idea:"What angle? Any hook, thought, or content idea...",
  };

  async function generate(){
    if(!input.trim()||generating)return;
    setGenerating(true);setError(null);setProgress(15);setProgressMsg('Reading your input...');
    try{
      setProgress(35);setProgressMsg('Writing drafts with AI...');
      const t=today();
      const prompt=`Input type: ${inputType}\nInput: "${input}"\n\nGenerate ${postCount} content draft(s) for MyLÚA Health. Return ONLY this JSON:\n{"posts":[{"id":"p${Date.now()}","headline":"8-word max headline","contentType":"Announcement","suggestedPlatform":"Instagram Feed","copy":{"linkedin":"LinkedIn post max 150 words, hook first, 3 hashtags at end.","instagram":"IG caption max 100 words, warm, 8 hashtags at end.","twitter":"X starter max 240 chars."},"graphicType":"announce","graphicHeadline":"6 word max graphic headline","graphicBody":"One sentence subtext","stats":[{"num":"64%","label":"HRA completion"},{"num":"79%","label":"share sensitive data"},{"num":"90%+","label":"first-trimester detection"}],"quote":"","suggestedDate":"${t}","priority":"high","notes":"posting tip","eventLabel":""}]}\nGenerate exactly ${postCount} post(s). Different angles. Use MyLÚA brand voice.`;

      const res=await fetch('/api/generate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({input,inputType,prompt})});
      if(!res.ok){const e=await res.json();throw new Error(e.error||'API error');}
      const result=await res.json();
      setProgress(90);setProgressMsg('Preparing staging...');
      await new Promise(r=>setTimeout(r,300));
      onDrafted(result.posts||[]);
    }catch(e){
      setError(e.message);
    }finally{
      setGenerating(false);
    }
  }

  return(
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px',overflow:'auto'}}>
      <div style={{width:'100%',maxWidth:620}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{fontSize:26,fontWeight:800,color:B.primary,letterSpacing:-0.5}}>What's happening?</div>
          <div style={{fontSize:13,color:B.light,marginTop:6}}>Drop your update, a news headline, or a raw idea.</div>
        </div>
        <div style={{display:'flex',gap:8,marginBottom:14}}>
          {types.map(({id,label,desc})=>(
            <button key={id} onClick={()=>setInputType(id)} style={{
              flex:1,padding:'10px 10px',borderRadius:12,
              border:`2px solid ${inputType===id?B.secondary:B.border}`,
              background:inputType===id?'white':'rgba(255,255,255,0.5)',
              cursor:'pointer',fontFamily:'inherit',textAlign:'left',
              boxShadow:inputType===id?'0 2px 12px rgba(0,0,0,0.08)':'none',transition:'all 0.15s',
            }}>
              <div style={{fontSize:12,fontWeight:700,color:B.primary}}>{label}</div>
              <div style={{fontSize:10,color:B.light,marginTop:2,lineHeight:1.4}}>{desc}</div>
            </button>
          ))}
        </div>
        <div style={{background:'white',borderRadius:18,border:`1px solid ${B.border}`,overflow:'hidden',boxShadow:'0 4px 24px rgba(0,0,0,0.08)'}}>
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder={ph[inputType]}
            onKeyDown={e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey))generate();}}
            style={{width:'100%',minHeight:130,padding:'18px 20px 12px',border:'none',outline:'none',resize:'none',fontFamily:'inherit',fontSize:14,lineHeight:1.65,color:B.dark,background:'transparent'}}
          />
          <div style={{padding:'10px 20px',borderTop:`1px solid ${B.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:12}}>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:11,color:B.light}}>Posts to draft:</div>
              {[1,2,3].map(n=>(
                <button key={n} onClick={()=>setPostCount(n)} style={{
                  width:28,height:28,borderRadius:8,border:`1px solid ${postCount===n?B.primary:B.border}`,
                  background:postCount===n?B.primary:'transparent',color:postCount===n?'white':B.mid,
                  fontFamily:'inherit',fontSize:12,fontWeight:600,cursor:'pointer',
                }}>{n}</button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{fontSize:10,color:B.light}}>⌘↵ generate</div>
              <Btn onClick={generate} disabled={!input.trim()||generating} variant='primary'>
                {generating?'Drafting...':'Draft Content →'}
              </Btn>
            </div>
          </div>
        </div>
        {generating&&(
          <div style={{marginTop:18,background:'white',borderRadius:14,padding:18,border:`1px solid ${B.border}`}}>
            <div style={{fontSize:12,color:B.mid,marginBottom:10}}>{progressMsg}</div>
            <div style={{height:4,background:B.border,borderRadius:2,overflow:'hidden'}}>
              <div style={{height:'100%',width:`${progress}%`,background:`linear-gradient(90deg,${B.primary},${B.secondary})`,borderRadius:2,transition:'width 0.4s'}}/>
            </div>
          </div>
        )}
        {error&&<div style={{marginTop:12,padding:14,background:'#fef2f2',border:'1px solid #fecaca',borderRadius:12,color:'#c0392b',fontSize:12}}>{error}</div>}
      </div>
    </div>
  );
}

// ── STAGING VIEW ──────────────────────────────────────
function StagingView({drafts,allPhotos,onApprove,onDone}){
  const [idx,setIdx]=useState(0);
  const [approved,setApproved]=useState([]);
  const draft=drafts[idx];

  // Per-draft editable state
  const [platform,setPlatform]=useState(draft?.suggestedPlatform||'Instagram Feed');
  const [postType,setPostType]=useState(draft?.graphicType||'announce');
  const [selectedPhoto,setSelectedPhoto]=useState(allPhotos[0]||null);
  const [activeCopyPlat,setActiveCopyPlat]=useState('instagram');
  const [copy,setCopy]=useState({
    linkedin:draft?.copy?.linkedin||'',
    instagram:draft?.copy?.instagram||'',
    twitter:draft?.copy?.twitter||'',
  });
  const [headline,setHeadline]=useState(draft?.graphicHeadline||'');
  const [body,setBody]=useState(draft?.graphicBody||'');
  const [date,setDate]=useState(draft?.suggestedDate||today());
  const [rendering,setRendering]=useState(false);
  const [graphicUrl,setGraphicUrl]=useState(null);
  const canvasRef=useRef(null);

  // Re-render graphic when anything changes
  useEffect(()=>{
    if(!draft)return;
    setRendering(true);
    const post={...draft,platform,graphicType:postType,graphicHeadline:headline,graphicBody:body};
    renderGraphic(post,selectedPhoto,BRAND_ASSETS).then(url=>{
      setGraphicUrl(url);
      setRendering(false);
      // Draw onto canvas
      if(canvasRef.current&&url){
        const img=new Image();
        img.onload=()=>{
          const c=canvasRef.current;
          if(!c)return;
          const ctx=c.getContext('2d');
          const size=PLATFORM_SIZES[platform];
          c.width=size.w; c.height=size.h;
          ctx.drawImage(img,0,0,size.w,size.h);
        };
        img.src=url;
      }
    });
  },[platform,postType,selectedPhoto,headline,body,idx]);

  // Reset state when moving to next draft
  useEffect(()=>{
    if(!draft)return;
    setPlatform(draft.suggestedPlatform||'Instagram Feed');
    setPostType(draft.graphicType||'announce');
    setSelectedPhoto(allPhotos[0]||null);
    setActiveCopyPlat('instagram');
    setCopy({linkedin:draft.copy?.linkedin||'',instagram:draft.copy?.instagram||'',twitter:draft.copy?.twitter||''});
    setHeadline(draft.graphicHeadline||'');
    setBody(draft.graphicBody||'');
    setDate(draft.suggestedDate||today());
  },[idx]);

  function approveCurrent(){
    const finalPost={
      ...draft,platform,graphicType:postType,
      graphicHeadline:headline,graphicBody:body,
      copy,suggestedDate:date,graphicDataUrl:graphicUrl,
    };
    const newApproved=[...approved,finalPost];
    setApproved(newApproved);
    if(idx<drafts.length-1){setIdx(idx+1);}
    else{onApprove(newApproved);onDone();}
  }

  function skipCurrent(){
    if(idx<drafts.length-1){setIdx(idx+1);}
    else{onApprove(approved);onDone();}
  }

  if(!draft)return null;
  const size=PLATFORM_SIZES[platform];
  const aspectRatio=size.h/size.w;

  return(
    <div style={{flex:1,overflow:'auto',padding:'24px'}}>
      <div style={{maxWidth:1100,margin:'0 auto'}}>

        {/* Progress indicator */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
          {drafts.map((_,i)=>(
            <div key={i} style={{flex:1,height:4,borderRadius:2,background:i<idx?B.primary:i===idx?B.secondary:B.border,transition:'background 0.3s'}}/>
          ))}
          <div style={{fontSize:12,color:B.light,whiteSpace:'nowrap'}}>Draft {idx+1} of {drafts.length}</div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 360px',gap:24,alignItems:'start'}}>

          {/* LEFT: Controls */}
          <div>
            {/* Headline editor */}
            <div style={{background:'white',borderRadius:14,border:`1px solid ${B.border}`,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:B.mid,marginBottom:8}}>Graphic headline</div>
              <input value={headline} onChange={e=>setHeadline(e.target.value)}
                style={{width:'100%',border:'none',outline:'none',fontSize:18,fontWeight:700,color:B.primary,fontFamily:'inherit'}}
              />
              <div style={{fontSize:11,fontWeight:600,color:B.mid,marginTop:12,marginBottom:6}}>Graphic subtext</div>
              <input value={body} onChange={e=>setBody(e.target.value)}
                style={{width:'100%',border:'none',outline:'none',fontSize:13,color:B.mid,fontFamily:'inherit'}}
              />
            </div>

            {/* Platform picker */}
            <div style={{background:'white',borderRadius:14,border:`1px solid ${B.border}`,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:B.mid,marginBottom:10}}>Platform — locks canvas size</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {PLATFORM_LIST.map(p=>(
                  <button key={p} onClick={()=>setPlatform(p)} style={{
                    padding:'7px 14px',borderRadius:9,fontFamily:'inherit',fontSize:11,fontWeight:600,cursor:'pointer',
                    border:`1px solid ${platform===p?PLAT_COLORS[p]||B.primary:B.border}`,
                    background:platform===p?(PLAT_COLORS[p]||B.primary):'transparent',
                    color:platform===p?'white':B.mid,transition:'all 0.15s',
                  }}>
                    {p} <span style={{opacity:0.7,fontSize:10}}>{PLATFORM_SIZES[p].label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Post type */}
            <div style={{background:'white',borderRadius:14,border:`1px solid ${B.border}`,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:B.mid,marginBottom:10}}>Graphic template</div>
              <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                {POST_TYPES.map(({id,label,desc})=>(
                  <button key={id} onClick={()=>setPostType(id)} title={desc} style={{
                    padding:'7px 14px',borderRadius:9,fontFamily:'inherit',fontSize:11,fontWeight:600,cursor:'pointer',
                    border:`1px solid ${postType===id?B.primary:B.border}`,
                    background:postType===id?B.primary:'transparent',
                    color:postType===id?'white':B.mid,transition:'all 0.15s',
                  }}>{label}</button>
                ))}
              </div>
            </div>

            {/* Photo picker */}
            <div style={{background:'white',borderRadius:14,border:`1px solid ${B.border}`,padding:16,marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:600,color:B.mid,marginBottom:10}}>Photo — click to swap</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                {allPhotos.map((photo,i)=>(
                  <div key={photo.id||i} onClick={()=>setSelectedPhoto(photo)} style={{
                    width:80,height:80,borderRadius:10,overflow:'hidden',cursor:'pointer',flexShrink:0,
                    border:`2px solid ${selectedPhoto?.id===photo.id||selectedPhoto?.url===photo.url?B.secondary:'transparent'}`,
                    transition:'border-color 0.15s',position:'relative',
                  }}>
                    <img src={photo.url} style={{width:'100%',height:'100%',objectFit:'cover'}} alt={photo.label}/>
                    {photo.tag==='uploaded'&&(
                      <div style={{position:'absolute',bottom:2,right:2,background:'rgba(44,77,69,0.8)',borderRadius:4,padding:'1px 4px',fontSize:8,color:'white'}}>✓ yours</div>
                    )}
                  </div>
                ))}
              </div>
              {allPhotos.length===0&&<div style={{fontSize:12,color:B.light}}>No photos — add some in the Photos tab.</div>}
            </div>

            {/* Copy editor */}
            <div style={{background:'white',borderRadius:14,border:`1px solid ${B.border}`,overflow:'hidden',marginBottom:14}}>
              <div style={{padding:'10px 16px',borderBottom:`1px solid ${B.border}`,display:'flex',gap:6}}>
                {[['linkedin','LinkedIn'],['instagram','Instagram'],['twitter','X']].map(([id,label])=>(
                  <button key={id} onClick={()=>setActiveCopyPlat(id)} style={{
                    padding:'5px 12px',borderRadius:8,fontFamily:'inherit',fontSize:11,fontWeight:600,cursor:'pointer',
                    border:`1px solid ${activeCopyPlat===id?B.primary:B.border}`,
                    background:activeCopyPlat===id?B.primary:'transparent',
                    color:activeCopyPlat===id?'white':B.mid,
                  }}>{label}</button>
                ))}
              </div>
              <textarea value={copy[activeCopyPlat]} onChange={e=>setCopy({...copy,[activeCopyPlat]:e.target.value})}
                style={{width:'100%',minHeight:160,padding:16,border:'none',outline:'none',resize:'none',fontFamily:'inherit',fontSize:13,lineHeight:1.7,color:B.dark}}
              />
            </div>

            {/* Date + actions */}
            <div style={{display:'flex',alignItems:'center',gap:10}}>
              <div style={{flex:1}}>
                <div style={{fontSize:11,color:B.light,marginBottom:4}}>Post date</div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)}
                  style={{width:'100%',border:`1px solid ${B.border}`,borderRadius:9,padding:'8px 12px',fontFamily:'inherit',fontSize:13,color:B.dark}}
                />
              </div>
              <div style={{display:'flex',gap:8,alignItems:'flex-end',paddingBottom:1}}>
                <Btn onClick={skipCurrent} variant='ghost'>
                  {idx<drafts.length-1?'Skip →':'Skip'}
                </Btn>
                <Btn onClick={approveCurrent} variant='dark'>
                  {idx<drafts.length-1?`Approve + Next (${idx+1}/${drafts.length})`:'Approve + Add to Calendar'}
                </Btn>
              </div>
            </div>
          </div>

          {/* RIGHT: Live graphic preview */}
          <div style={{position:'sticky',top:24}}>
            <div style={{background:'white',borderRadius:18,border:`1px solid ${B.border}`,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
              <div style={{padding:'12px 18px',borderBottom:`1px solid ${B.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:12,fontWeight:700,color:B.primary}}>Live Preview</div>
                <div style={{fontSize:11,color:B.light}}>{size.label}</div>
              </div>
              <div style={{position:'relative',width:'100%',paddingBottom:`${aspectRatio*100}%`,background:B.primary}}>
                <canvas ref={canvasRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',display:'block'}}/>
                {rendering&&(
                  <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(44,77,69,0.6)'}}>
                    <div style={{fontSize:12,color:'white',fontWeight:500}}>Rendering...</div>
                  </div>
                )}
              </div>
              {graphicUrl&&(
                <div style={{padding:'10px 18px',borderTop:`1px solid ${B.border}`}}>
                  <button onClick={()=>{const a=document.createElement('a');a.href=graphicUrl;a.download=`mylua-draft-${Date.now()}.png`;a.click();}} style={{
                    width:'100%',padding:'8px',background:'transparent',border:`1px solid ${B.border}`,
                    borderRadius:8,fontFamily:'inherit',fontSize:11,fontWeight:600,color:B.mid,cursor:'pointer',
                  }}>⬇ Download preview PNG</button>
                </div>
              )}
            </div>
            <div style={{fontSize:10,color:B.light,textAlign:'center',marginTop:6}}>Updates live as you edit</div>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── PHOTO LIBRARY VIEW ────────────────────────────────
function LibraryView({photos,onPhotosChange}){
  const [uploading,setUploading]=useState(false);
  const [dragOver,setDragOver]=useState(false);
  const fileRef=useRef(null);

  async function uploadFiles(files){
    setUploading(true);
    const newPhotos=[];
    for(const file of Array.from(files)){
      if(!file.type.startsWith('image/'))continue;
      try{
        const res=await fetch('/api/upload',{
          method:'POST',
          headers:{'Content-Type':file.type,'x-filename':encodeURIComponent(file.name)},
          body:file,
        });
        const data=await res.json();
        if(data.url){
          const photo={id:data.url,url:data.url,label:file.name.replace(/\.[^.]+$/,''),tag:'uploaded',uploadedAt:new Date().toISOString()};
          newPhotos.push(photo);
          // Save to shared KV
          await fetch('/api/photos',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo})});
        }
      }catch(e){console.error('Upload failed:',e);}
    }
    if(newPhotos.length>0){
      onPhotosChange([...newPhotos,...photos.filter(p=>p.tag==='uploaded')]);
    }
    setUploading(false);
  }

  async function deletePhoto(url){
    await fetch('/api/photos',{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({url})});
    onPhotosChange(photos.filter(p=>p.url!==url));
  }

  const uploadedPhotos=photos.filter(p=>p.tag==='uploaded');
  const stockPhotos=photos.filter(p=>p.tag==='stock');

  return(
    <div style={{flex:1,overflow:'auto',padding:'32px 28px'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div>
            <div style={{fontSize:22,fontWeight:700,color:B.primary}}>Photo Library</div>
            <div style={{fontSize:13,color:B.light,marginTop:2}}>Shared across everyone using this app</div>
          </div>
          <Btn onClick={()=>fileRef.current?.click()} variant='dark' disabled={uploading}>
            {uploading?'Uploading...':'＋ Upload Photos'}
          </Btn>
          <input ref={fileRef} type="file" accept="image/*" multiple style={{display:'none'}}
            onChange={e=>uploadFiles(e.target.files)}
          />
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);uploadFiles(e.dataTransfer.files);}}
          onClick={()=>fileRef.current?.click()}
          style={{
            border:`2px dashed ${dragOver?B.secondary:B.border}`,borderRadius:16,padding:'32px 24px',
            textAlign:'center',marginBottom:28,cursor:'pointer',transition:'all 0.2s',
            background:dragOver?'rgba(168,109,83,0.04)':'transparent',
          }}
        >
          <div style={{fontSize:28,marginBottom:8}}>📷</div>
          <div style={{fontSize:14,fontWeight:600,color:B.primary}}>Drop event photos here</div>
          <div style={{fontSize:12,color:B.light,marginTop:4}}>Conference shots, community moments, team photos — anything you want to use in graphics</div>
        </div>

        {/* Uploaded photos */}
        {uploadedPhotos.length>0&&(
          <>
            <div style={{fontSize:13,fontWeight:600,color:B.primary,marginBottom:14}}>Your uploads ({uploadedPhotos.length})</div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12,marginBottom:32}}>
              {uploadedPhotos.map(photo=>(
                <div key={photo.id} style={{borderRadius:12,overflow:'hidden',border:`1px solid ${B.border}`,position:'relative',background:'white'}}>
                  <img src={photo.url} style={{width:'100%',height:140,objectFit:'cover',display:'block'}} alt={photo.label}/>
                  <div style={{padding:'8px 10px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <div style={{fontSize:11,color:B.mid,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{photo.label}</div>
                    <button onClick={()=>deletePhoto(photo.url)} style={{background:'none',border:'none',color:B.light,cursor:'pointer',fontSize:14,padding:'0 0 0 6px'}}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stock photos */}
        <div style={{fontSize:13,fontWeight:600,color:B.primary,marginBottom:14}}>Built-in stock photos ({stockPhotos.length})</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))',gap:12}}>
          {stockPhotos.map(photo=>(
            <div key={photo.id} style={{borderRadius:12,overflow:'hidden',border:`1px solid ${B.border}`,background:'white'}}>
              <img src={photo.url} style={{width:'100%',height:140,objectFit:'cover',display:'block'}} alt={photo.label}/>
              <div style={{padding:'8px 10px'}}>
                <div style={{fontSize:11,color:B.mid}}>{photo.label}</div>
                <div style={{fontSize:9,color:B.light,marginTop:2}}>Built-in</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CALENDAR VIEW ─────────────────────────────────────
function CalendarView({calendar,onSelectPost,onDelete,onReschedule}){
  const t=today();
  if(calendar.length===0)return(
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{textAlign:'center',color:B.light}}>
        <div style={{fontSize:44,marginBottom:14}}>📅</div>
        <div style={{fontSize:15,fontWeight:600}}>Nothing approved yet</div>
        <div style={{fontSize:12,marginTop:6}}>Draft and approve posts to build your calendar</div>
      </div>
    </div>
  );
  return(
    <div style={{flex:1,overflow:'auto',padding:'32px 28px'}}>
      <div style={{maxWidth:900,margin:'0 auto'}}>
        <div style={{fontSize:22,fontWeight:700,color:B.primary,marginBottom:24}}>Content Calendar</div>
        {calendar.map(post=>{
          const isPast=post.suggestedDate<t;
          return(
            <div key={post.id} style={{background:isPast?'#f7f7f7':'white',borderRadius:14,border:`1px solid ${B.border}`,display:'flex',overflow:'hidden',marginBottom:10,opacity:isPast?0.65:1,boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
              <div style={{width:72,background:isPast?'#ddd':B.primary,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                <div style={{fontSize:22,fontWeight:800,color:isPast?'#aaa':'white',lineHeight:1}}>{getDay(post.suggestedDate)}</div>
                <div style={{fontSize:10,fontWeight:600,color:isPast?'#bbb':'rgba(255,255,255,0.65)',textTransform:'uppercase',letterSpacing:1}}>{getMon(post.suggestedDate)}</div>
              </div>
              {post.graphicDataUrl&&(
                <div style={{width:72,flexShrink:0,overflow:'hidden'}}>
                  <img src={post.graphicDataUrl} style={{width:'100%',height:'100%',objectFit:'cover'}} alt=""/>
                </div>
              )}
              <div style={{flex:1,padding:'11px 16px',display:'flex',alignItems:'center',gap:14,minWidth:0}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:700,color:B.primary,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{post.headline}</div>
                  <div style={{display:'flex',gap:5,marginTop:3,flexWrap:'wrap',alignItems:'center'}}>
                    <PlatPill p={post.platform||'Instagram Feed'} small/>
                    <span style={{fontSize:10,color:B.light}}>· {post.contentType}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:6,alignItems:'center',flexShrink:0}}>
                  <button onClick={()=>onSelectPost(post)} style={{background:B.primary,color:'white',border:'none',padding:'5px 12px',borderRadius:7,fontFamily:'inherit',fontSize:11,fontWeight:600,cursor:'pointer'}}>View</button>
                  <input type="date" value={post.suggestedDate} onChange={e=>onReschedule(post.id,e.target.value)}
                    style={{border:`1px solid ${B.border}`,borderRadius:7,padding:'4px 8px',fontFamily:'inherit',fontSize:11,color:B.mid,cursor:'pointer'}}
                  />
                  <button onClick={()=>onDelete(post.id)} style={{background:'none',border:`1px solid ${B.border}`,color:B.light,width:28,height:28,borderRadius:7,cursor:'pointer',fontSize:13}}>×</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── POST DETAIL VIEW ──────────────────────────────────
function PostDetailView({post,onBack,onReschedule}){
  const [activePlatform,setActivePlatform]=useState('instagram');
  const [copied,setCopied]=useState(false);
  const canvasRef=useRef(null);

  useEffect(()=>{
    const canvas=canvasRef.current;
    if(canvas&&post?.graphicDataUrl){
      const size=PLATFORM_SIZES[post.platform||'Instagram Feed'];
      canvas.width=size.w; canvas.height=size.h;
      const img=new Image();
      img.onload=()=>{canvas.getContext('2d').drawImage(img,0,0,size.w,size.h);};
      img.src=post.graphicDataUrl;
    }
  },[post]);

  function doCopy(){
    navigator.clipboard.writeText(post.copy?.[activePlatform]||'').then(()=>{setCopied(true);setTimeout(()=>setCopied(false),1500);});
  }

  function download(){
    if(!post.graphicDataUrl)return;
    const a=document.createElement('a');a.href=post.graphicDataUrl;a.download=`mylua-${post.platform?.replace(/\s/g,'-')}-${post.id}.png`;a.click();
  }

  const size=PLATFORM_SIZES[post.platform||'Instagram Feed'];
  const aspect=size.h/size.w;

  return(
    <div style={{flex:1,overflow:'auto',padding:'28px'}}>
      <div style={{maxWidth:1060,margin:'0 auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:22}}>
          <Btn onClick={onBack} variant='ghost'>← Back</Btn>
          <div style={{fontSize:17,fontWeight:700,color:B.primary,flex:1}}>{post.headline}</div>
          <PlatPill p={post.platform||'Instagram Feed'}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 380px',gap:26,alignItems:'start'}}>
          <div>
            <div style={{display:'flex',gap:6,marginBottom:16}}>
              {[['linkedin','LinkedIn'],['instagram','Instagram'],['twitter','X']].map(([id,label])=>(
                <button key={id} onClick={()=>setActivePlatform(id)} style={{
                  padding:'7px 16px',borderRadius:9,fontFamily:'inherit',fontSize:11,fontWeight:600,cursor:'pointer',
                  border:`1px solid ${activePlatform===id?B.primary:B.border}`,
                  background:activePlatform===id?B.primary:'transparent',
                  color:activePlatform===id?'white':B.mid,
                }}>{label}</button>
              ))}
            </div>
            <div style={{background:'white',borderRadius:14,border:`1px solid ${B.border}`,overflow:'hidden',marginBottom:14,boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
              <div style={{padding:'10px 16px',borderBottom:`1px solid ${B.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:11,fontWeight:600,color:B.mid}}>{activePlatform} copy</div>
                <Btn onClick={doCopy} variant={copied?'dark':'ghost'} style={{padding:'4px 14px'}}>
                  {copied?'✓ Copied':'Copy'}
                </Btn>
              </div>
              <div style={{padding:18,fontSize:13,lineHeight:1.8,color:B.dark,whiteSpace:'pre-wrap',maxHeight:300,overflow:'auto'}}>
                {post.copy?.[activePlatform]||'No copy for this platform.'}
              </div>
            </div>
            {post.notes&&(
              <div style={{background:'#fdf6f0',border:`1px solid ${B.border}`,borderRadius:12,padding:'12px 16px',fontSize:12,color:B.mid,lineHeight:1.6,marginBottom:14}}>
                <span style={{color:B.secondary,fontWeight:700}}>💡 </span>{post.notes}
              </div>
            )}
            <div style={{background:'white',borderRadius:12,border:`1px solid ${B.border}`,padding:16}}>
              <div style={{fontSize:12,fontWeight:700,color:B.primary,marginBottom:10}}>Schedule</div>
              <input type="date" defaultValue={post.suggestedDate} onChange={e=>onReschedule(post.id,e.target.value)}
                style={{width:'100%',border:`1px solid ${B.border}`,borderRadius:9,padding:'8px 12px',fontFamily:'inherit',fontSize:13,color:B.dark}}
              />
            </div>
          </div>
          <div style={{position:'sticky',top:24}}>
            <div style={{background:'white',borderRadius:18,border:`1px solid ${B.border}`,overflow:'hidden',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}>
              <div style={{padding:'12px 18px',borderBottom:`1px solid ${B.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <div style={{fontSize:12,fontWeight:700,color:B.primary}}>Graphic — {size.label}</div>
                <Btn onClick={download} variant='dark' style={{padding:'5px 14px'}}>⬇ PNG</Btn>
              </div>
              <div style={{position:'relative',width:'100%',paddingBottom:`${aspect*100}%`}}>
                <canvas ref={canvasRef} style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',display:'block'}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────
export default function ContentOS(){
  const [view,setView]=useState('input');
  const [drafts,setDrafts]=useState([]);
  const [calendar,setCalendar]=useState([]);
  const [photos,setPhotos]=useState(STOCK_PHOTOS);
  const [selectedPost,setSelectedPost]=useState(null);

  // Load shared calendar + uploaded photos from KV on mount
  useEffect(()=>{
    fetch('/api/calendar').then(r=>r.json()).then(cal=>{if(Array.isArray(cal))setCalendar(cal);}).catch(()=>{});
    fetch('/api/photos').then(r=>r.json()).then(uploaded=>{
      if(Array.isArray(uploaded)&&uploaded.length>0){
        setPhotos([...uploaded,...STOCK_PHOTOS]);
      }
    }).catch(()=>{});
  },[]);

  function saveCalendar(cal){
    setCalendar(cal);
    fetch('/api/calendar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({calendar:cal})}).catch(()=>{});
  }

  function handleDrafted(posts){setDrafts(posts);setView('staging');}

  function handleApprove(approvedPosts){
    const merged=[...calendar];
    approvedPosts.forEach(p=>{
      const i=merged.findIndex(c=>c.id===p.id);
      if(i>=0)merged[i]=p;else merged.push(p);
    });
    merged.sort((a,b)=>a.suggestedDate.localeCompare(b.suggestedDate));
    saveCalendar(merged);
  }

  function handleDelete(id){
    const cal=calendar.filter(p=>p.id!==id);
    saveCalendar(cal);
    if(selectedPost?.id===id){setSelectedPost(null);setView('calendar');}
  }

  function handleReschedule(id,date){
    const updated=calendar.map(p=>p.id===id?{...p,suggestedDate:date}:p);
    updated.sort((a,b)=>a.suggestedDate.localeCompare(b.suggestedDate));
    saveCalendar(updated);
    if(selectedPost?.id===id)setSelectedPost(prev=>({...prev,suggestedDate:date}));
  }

  function handlePhotosChange(newPhotos){
    setPhotos([...newPhotos,...STOCK_PHOTOS]);
  }

  const uploadedPhotos=photos.filter(p=>p.tag==='uploaded');

  return(
    <>
      <Head>
        <title>MyLÚA Content OS</title>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🪷</text></svg>"/>
      </Head>
      <div style={{height:'100vh',display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <Header view={view} calCount={calendar.length} photoCount={uploadedPhotos.length} onNav={v=>{setView(v);}}/>
        {(view==='input'||view==='staging')&&view==='input'&&<InputView onDrafted={handleDrafted}/>}
        {view==='staging'&&<StagingView drafts={drafts} allPhotos={photos} onApprove={handleApprove} onDone={()=>setView('calendar')}/>}
        {view==='library'&&<LibraryView photos={photos} onPhotosChange={handlePhotosChange}/>}
        {view==='calendar'&&<CalendarView calendar={calendar} onSelectPost={p=>{setSelectedPost(p);setView('post');}} onDelete={handleDelete} onReschedule={handleReschedule}/>}
        {view==='post'&&selectedPost&&<PostDetailView post={selectedPost} onBack={()=>setView('calendar')} onReschedule={handleReschedule}/>}
      </div>
    </>
  );
}
