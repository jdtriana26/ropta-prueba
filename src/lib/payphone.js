// src/lib/payphone.js
import { supabase } from './supabase'

export async function createTransaction({ kind, id, returnPath }) {
    const { data, error } = await supabase.functions.invoke('payphone-prepare', {
        body: { kind, id, returnPath },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data   // { payWithCard }
}

export async function confirmTransaction({ id, clientTxId, kind }) {
    const { data, error } = await supabase.functions.invoke('payphone-confirm', {
        body: { id, clientTxId, kind },
    })
    if (error) throw new Error(error.message)
    if (data?.error) throw new Error(data.error)
    return data   // { approved, status }
}