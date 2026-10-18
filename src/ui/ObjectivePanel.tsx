import { useState } from 'react';
import { ChevronDown, ChevronRight, Flag } from 'lucide-react';

export function ObjectivePanel({title,objective,reference,completed,onJournal}:{title:string;objective:string;reference:string;completed:boolean;onJournal:()=>void}){
 const [expanded,setExpanded]=useState(false);
 return <aside className={`objective-panel ${expanded?'expanded':'collapsed'}`}>
  <button className="objective-summary" aria-label={expanded?'Recolher objetivo':'Expandir objetivo'} aria-expanded={expanded} onClick={()=>setExpanded(value=>!value)}><Flag size={13}/><span><small>{completed?'JORNADA CONCLUÍDA':'MISSÃO PRINCIPAL'}</small><strong>{title}</strong></span><ChevronDown size={13}/></button>
  {expanded&&<div className="objective-details"><p>{objective}</p><button onClick={onJournal}>{reference}<ChevronRight size={11}/></button></div>}
 </aside>;
}
