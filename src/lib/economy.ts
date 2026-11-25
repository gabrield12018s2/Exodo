import { createClient } from '@/lib/supabase/client';
export type Wallet = {id:string;community_id:string;user_id:string;balance:number};
export type GoldTransaction = {id:string;wallet_id:string;amount:number;balance_before:number;balance_after:number;transaction_type:string;reason:string;actor_id:string|null;reference_id:string|null;operation_id:string;created_at:string};
export type AuditRow = {user_id:string;display_name:string;balance:number;calculated_balance:number;difference:number;transaction_count:number;is_consistent:boolean};
export type Operation = 'grant'|'deduct'|'transfer'|'bulk_reward';
export type GoldRequest = {p_request_id:string;p_community_id:string;p_operation_type:Operation;p_user_ids:string[];p_amount:number;p_reason:string};
export async function wallets(communityId:string){const {data,error}=await createClient().from('wallets').select('id,community_id,user_id,balance').eq('community_id',communityId).order('id');if(error)throw error;return (data??[]) as Wallet[];}
export async function history(walletId:string, before?:GoldTransaction){let q=createClient().from('gold_transactions').select('*').eq('wallet_id',walletId).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(50);if(before)q=q.or(`created_at.lt.${before.created_at},and(created_at.eq.${before.created_at},id.lt.${before.id})`);const {data,error}=await q;if(error)throw error;return (data??[]) as GoldTransaction[];}
export async function execute(request:GoldRequest){const {data,error}=await createClient().rpc('execute_gold_operation',request);if(error)throw error;return data;}
export async function audit(communityId:string){const {data,error}=await createClient().rpc('audit_community_gold',{p_community_id:communityId});if(error)throw error;return (data??[]) as AuditRow[];}
export function errorText(e:unknown){return e&&typeof e==='object'&&'message' in e?String(e.message):'No se pudo completar la operación.';}
export const po=(n:number)=>`${Number(n).toLocaleString('es-CL')} PO`;
