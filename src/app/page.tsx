'use client';
import {useCallback,useEffect,useState} from 'react';
import type {User} from '@supabase/supabase-js';
import {Gem,LoaderCircle,RefreshCw} from 'lucide-react';
import AuthGate from '@/components/AuthGate';
import CommunitySelector from '@/components/CommunitySelector';
import CommunityApp from '@/components/CommunityApp';
import {getCommunities,type Community} from '@/lib/communities';
export default function Home(){return <AuthGate>{(user)=><ExodoApp key={user.id} user={user}/>}</AuthGate>}
function ExodoApp({user}:{user:User}){
 const [communities,setCommunities]=useState<Community[]>([]),[selected,setSelected]=useState<string|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const refresh=useCallback(async(id?:string)=>{const data=await getCommunities();setCommunities(data);if(id)setSelected(data.some(c=>c.id===id)?id:null)},[]);
 const load=useCallback(async()=>{setLoading(true);setError('');try{await refresh()}catch(e){setError(e&&typeof e==='object'&&'message' in e?String(e.message):'No se pudieron cargar las comunidades.')}finally{setLoading(false)}},[refresh]);
 useEffect(()=>{void load()},[load]);
 const current=communities.find(c=>c.id===selected);
 if(loading||error)return <div className="login-screen"><Gem size={40}/>{loading?<LoaderCircle className="loading-icon"/>:<><p className="exodo-form-error">{error}</p><button className="exodo-secondary-button" onClick={()=>void load()}><RefreshCw size={16}/> Reintentar</button></>}</div>;
 if(current)return <CommunityApp key={current.id} user={user} community={current} communities={communities} onSelectCommunity={c=>setSelected(c.id)} onBack={()=>{setSelected(null);void load()}} onCommunityUpdated={c=>setCommunities(old=>old.map(x=>x.id===c.id?c:x))}/>;
 return <CommunitySelector communities={communities} onSelect={c=>setSelected(c.id)} onRefresh={refresh}/>;
}
