'use client';
import {useState,useEffect,useCallback,useRef} from 'react';
import {Coins,RefreshCw,Plus,Minus,Gift,ShieldCheck} from 'lucide-react';
import type {CommunityMember,CommunityRole} from '@/lib/communities';
import {wallets,history,execute,audit,errorText,po,type Wallet,type GoldTransaction,type AuditRow,type Operation,type GoldRequest} from '@/lib/economy';
import '@/app/economy.css';
const labels:Record<Operation,string>={grant:'Entregar oro',deduct:'Descontar oro',transfer:'Transferir oro',bulk_reward:'Recompensa masiva'};
const txLabels:Record<string,string>={reward:'Recompensa',administrative_grant:'Entrega administrativa',administrative_deduction:'Descuento administrativo',transfer_in:'Transferencia recibida',transfer_out:'Transferencia enviada',purchase:'Compra',sale:'Venta',refund:'Reembolso',correction:'Corrección'};
type Props={communityId:string;userId:string;role:CommunityRole;members:CommunityMember[]};
export default function Treasury({communityId,userId,role,members}:Props){
 const staff=role==='owner',admin=role==='owner';
 const [tab,setTab]=useState<'personal'|'admin'>('admin');
 const [rows,setRows]=useState<Wallet[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [search,setSearch]=useState(''),[selected,setSelected]=useState<string|null>(null),[auditRows,setAuditRows]=useState<AuditRow[]|null>(null),[auditing,setAuditing]=useState(false);
 const [operation,setOperation]=useState<Operation|null>(null);
 const [revision,setRevision]=useState(0);
 const [walletMore,setWalletMore]=useState(false);
 const refresh=useCallback(async()=>{setLoading(true);setError('');try{const result=await wallets(communityId);setRows(result);setWalletMore(result.length>=1000);setRevision(x=>x+1);}catch(e){setError(errorText(e));}finally{setLoading(false);}},[communityId]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{const onFocus=()=>void refresh();window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus);},[refresh]);
 const name=(id:string|null)=>id===null?'Usuario eliminado':members.find(m=>m.user_id===id)?.profile?.display_name||members.find(m=>m.user_id===id)?.profile?.username||(id===userId?'Mi cuenta':'Exmiembro o usuario');
 const own=rows.find(w=>w.user_id===userId),activeRows=rows.filter(w=>members.some(m=>m.user_id===w.user_id));
 const viewed=tab==='personal'?own:rows.find(w=>w.id===selected);
 async function runAudit(){setAuditing(true);setError('');try{setAuditRows(await audit(communityId));}catch(e){setError(errorText(e));}finally{setAuditing(false);}}
 function open(op:Operation){setNotice('');setOperation(op);}
 if(role!=='owner')return null;
 return <div className="module economy"><div className="module-heading"><div><h2><Coins size={23}/> Tesorería</h2><p>Oro asociado a tu cuenta en esta comunidad.</p></div><button className="exodo-secondary-button" disabled={loading} onClick={()=>void refresh()}><RefreshCw size={16}/> Actualizar</button></div>
 <div className="eco-tabs"><button className={tab==='personal'?'eco-active':''} onClick={()=>setTab('personal')}>Mi tesorería</button>{staff&&<button className={tab==='admin'?'eco-active':''} onClick={()=>setTab('admin')}>Administración</button>}</div>
 {error&&<p className="exodo-form-error" role="alert">{error}</p>}{notice&&<p className="eco-notice" role="status">{notice}</p>}
 {loading&&<p className="eco-muted">Actualizando saldos...</p>}
 {tab==='personal'?<><div className="eco-balance"><span>SALDO DISPONIBLE</span><strong>{own?po(own.balance):'—'}</strong><small>Saldo personal</small></div></>:staff&&<>
 <div className="eco-summary"><div className="eco-balance"><span>ORO EN MIEMBROS ACTIVOS {walletMore?'(parcial)':''}</span><strong>{po(activeRows.reduce((n,w)=>n+Number(w.balance),0))}</strong></div><div className="eco-balance"><span>BILLETERAS ACTIVAS</span><strong>{activeRows.length}</strong></div></div>
 {walletMore&&<p className="eco-muted">Se alcanzó el límite de consulta. Los totales pueden ser parciales.</p>}
 <div className="eco-actions"><button className="exodo-primary-button" onClick={()=>open('grant')}><Plus size={16}/> Entregar oro</button>{admin&&<button className="exodo-secondary-button" onClick={()=>open('deduct')}><Minus size={16}/> Descontar oro</button>}<button className="exodo-secondary-button" onClick={()=>open('bulk_reward')}><Gift size={16}/> Recompensa masiva</button>{admin&&<button className="exodo-secondary-button" disabled={auditing} onClick={()=>void runAudit()}><ShieldCheck size={16}/> Auditoría</button>}</div>
 <h3>Saldos de miembros</h3><div className="exodo-form-field"><input aria-label="Buscar miembro" placeholder="Buscar miembro..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
 <div className="eco-list">{activeRows.filter(w=>name(w.user_id).toLowerCase().includes(search.toLowerCase())).map(w=><button key={w.id} className={`eco-row ${selected===w.id?'eco-active':''}`} onClick={()=>setSelected(w.id)}><span>{name(w.user_id)}</span><strong>{po(w.balance)}</strong></button>)}</div>
 {auditRows&&<section className="eco-audit"><h3>Auditoría de saldos</h3><p className="eco-muted">Resultado de la última consulta, incluye exmiembros.</p>{auditRows.map(a=><div key={a.user_id} className="eco-row"><span>{a.display_name}<small>Saldo: {po(a.balance)} · Calculado: {po(a.calculated_balance)}</small></span><strong className={a.is_consistent?'eco-positive':'eco-negative'}>{a.is_consistent?'Correcto':`Diferencia: ${po(a.difference)}`}</strong></div>)}</section>}
 </>}
 {viewed&&<History key={`${viewed.id}:${revision}`} wallet={viewed} name={name}/>}
 {operation&&<OperationModal key={operation} operation={operation} communityId={communityId} userId={userId} members={members} name={name} onClose={()=>setOperation(null)} onSuccess={()=>{setOperation(null);setAuditRows(null);setNotice('Operación registrada correctamente.');void refresh();}}/>}
 </div>;
}
function History({wallet,name}:{wallet:Wallet;name:(id:string|null)=>string}){
 const [items,setItems]=useState<GoldTransaction[]>([]),[loading,setLoading]=useState(false),[more,setMore]=useState(true),[error,setError]=useState('');const busy=useRef(false);
 const load=useCallback(async(before?:GoldTransaction)=>{if(busy.current)return;busy.current=true;setLoading(true);setError('');try{const page=await history(wallet.id,before);setItems(old=>before?[...old,...page]:page);setMore(page.length===50);}catch(e){setError(errorText(e));}finally{busy.current=false;setLoading(false);}},[wallet.id]);
 useEffect(()=>{void load();},[load]);
 return <section className="eco-history"><h3>Historial · {name(wallet.user_id)}</h3>{error&&<p className="exodo-form-error">{error}</p>}{!items.length&&!loading&&!error&&<p className="eco-muted">Todavía no hay movimientos.</p>}{items.map(t=><div className="eco-row" key={t.id}><div><strong>{txLabels[t.transaction_type]||t.transaction_type}</strong><p>{t.reason}</p><small>{new Date(t.created_at).toLocaleString('es-CL')} · Responsable: {name(t.actor_id)}{t.transaction_type.startsWith('transfer_')?` · Contraparte: ${name(t.reference_id)}`:''}</small></div><div className="eco-amount"><strong className={t.amount>0?'eco-positive':'eco-negative'}>{t.amount>0?'+':''}{po(t.amount)}</strong><small>Saldo: {po(t.balance_after)}</small></div></div>)}{more&&<button className="exodo-secondary-button" disabled={loading} onClick={()=>void load(items[items.length-1])}>{loading?'Cargando...':'Cargar movimientos'}</button>}</section>;
}
function OperationModal({operation,communityId,userId,members,name,onClose,onSuccess}:{operation:Operation;communityId:string;userId:string;members:CommunityMember[];name:(id:string|null)=>string;onClose:()=>void;onSuccess:()=>void}){
 const [ids,setIds]=useState<string[]>([]),[amount,setAmount]=useState(''),[reason,setReason]=useState(''),[error,setError]=useState(''),[saving,setSaving]=useState(false),[pending,setPending]=useState<GoldRequest|null>(null);
 const lock=useRef(false);const bulk=operation==='bulk_reward';const n=Number(amount);const valid=Number.isSafeInteger(n)&&n>=1&&n<=1e12&&ids.length>=1&&ids.length<=100&&reason.trim().length>=1&&reason.trim().length<=500;
 const eligible=members.filter(m=>operation!=='transfer'||m.user_id!==userId);
 async function submit(){if(lock.current||(!pending&&!valid))return;lock.current=true;setSaving(true);setError('');const request=pending??{p_request_id:crypto.randomUUID(),p_community_id:communityId,p_operation_type:operation,p_user_ids:[...ids].sort(),p_amount:n,p_reason:reason.trim()};setPending(request);try{await execute(request);onSuccess();}catch(e){setError(errorText(e));}finally{lock.current=false;setSaving(false);}}
 return <div className="exodo-modal-overlay"><div className="exodo-modal" role="dialog" aria-modal="true" aria-label={labels[operation]}><div className="exodo-modal-header"><h2>{labels[operation]}</h2><button className="exodo-secondary-button" disabled={saving||!!pending} onClick={onClose}>Cerrar</button></div><form onSubmit={e=>{e.preventDefault();void submit();}}><fieldset disabled={saving||!!pending}><div className="exodo-form-field"><label>Destinatarios {bulk?'(máximo 100)':''}</label>{bulk?<div className="eco-choices">{eligible.map(m=><label key={m.user_id}><input type="checkbox" checked={ids.includes(m.user_id)} onChange={e=>setIds(old=>e.target.checked?[...old,m.user_id]:old.filter(id=>id!==m.user_id))}/>{name(m.user_id)}</label>)}</div>:<select required value={ids[0]||''} onChange={e=>setIds(e.target.value?[e.target.value]:[])}><option value="">Seleccionar jugador</option>{eligible.map(m=><option key={m.user_id} value={m.user_id}>{name(m.user_id)}</option>)}</select>}</div><div className="exodo-form-field"><label>Oro {bulk?'por jugador':''} (PO)</label><input type="number" min="1" max="1000000000000" step="1" required value={amount} onChange={e=>setAmount(e.target.value)}/></div><div className="exodo-form-field"><label>Motivo</label><textarea required maxLength={500} value={reason} onChange={e=>setReason(e.target.value)}/></div>{valid&&<p className="eco-muted">Total: {po(n*ids.length)} · {ids.length} destinatario(s)</p>}</fieldset>{error&&<p className="exodo-form-error" role="alert">{error}</p>}{pending&&<p className="eco-muted">Puedes reintentar con el mismo identificador sin duplicar oro. Si abandonas esta solicitud, verifica el historial antes de iniciar otra.</p>}<div className="exodo-modal-actions">{pending&&!saving&&<button type="button" className="exodo-secondary-button" onClick={()=>{if(window.confirm('Verifica el historial antes de repetir una operación. ¿Cerrar esta solicitud?'))onClose();}}>Cerrar solicitud</button>}<button type="submit" className="exodo-primary-button" disabled={saving||(!pending&&!valid)}>{saving?'Procesando...':pending?'Reintentar':'Confirmar operación'}</button></div></form></div></div>;
}
