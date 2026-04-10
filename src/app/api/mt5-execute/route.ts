import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

let METAAPI_TOKEN = process.env.METAAPI_TOKEN;
const METAAPI_ACCOUNT_ID = process.env.METAAPI_ACCOUNT_ID;

export async function POST(req: Request) {
  try {
    const { signal_id, pair, direction, entry, sl, tp, lot_size } = await req.json();

    // Fallback: Fetch token from DB if ENV is missing (Netlify size optimization)
    if (!METAAPI_TOKEN) {
        const { data: configData } = await supabase
            .from('system_config')
            .select('value')
            .eq('key', 'METAAPI_TOKEN')
            .single();
        if (configData?.value) {
            METAAPI_TOKEN = configData.value;
        }
    }

    if (!METAAPI_TOKEN || !METAAPI_ACCOUNT_ID) {
      return NextResponse.json({ error: 'MetaAPI not configured' }, { status: 500 });
    }

    // 1. Validate signal data
    if (!pair || !direction || !entry) {
      return NextResponse.json({ error: 'Missing signal data' }, { status: 400 });
    }

    console.log(`[MT5 Bridge] Executing ${direction} ${pair} at ${entry} with Lot ${lot_size}`);

    // 2. Map direction to MetaAPI actionType
    const actionType = direction === 'BUY' ? 'ORDER_TYPE_BUY_LIMIT' : 'ORDER_TYPE_SELL_LIMIT';

    // 3. Call MetaAPI REST Trade Endpoint
    const tradeUrl = `https://mt-client-api-v1.agiliumtrade.agiliumtrade.ai/users/current/accounts/${METAAPI_ACCOUNT_ID}/trade`;
    
    const tradeResponse = await fetch(tradeUrl, {
      method: 'POST',
      headers: {
        'auth-token': METAAPI_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        actionType: actionType,
        symbol: pair.replace('/', ''), // MT5 usually uses 'BTCUSD' instead of 'BTC/USD'
        openPrice: parseFloat(entry),
        volume: parseFloat(lot_size || '0.01'),
        stopLoss: sl ? parseFloat(sl) : undefined,
        takeProfit: tp ? parseFloat(tp) : undefined,
        comment: 'ZenPips Cloud Fallback'
      })
    });


    const tradeData = await tradeResponse.json();

    if (!tradeResponse.ok) {
        console.error('[MetaAPI Error]', tradeData);
        return NextResponse.json({ 
            error: tradeData.message || 'MT5 Execution Failed',
            details: tradeData
        }, { status: tradeResponse.status });
    }

    // 4. Update copy_events table
    const { error: updateError } = await supabase
      .from('copy_events')
      .update({ 
        status: 'SUCCESS',
        mt5_ticket: tradeData.orderId || tradeData.positionId,
        executed_at: new Date().toISOString()
      })
      .eq('signal_id', signal_id)
      .eq('status', 'PENDING');

    if (updateError) {
        console.warn('[Supabase Warning] Could not update copy_events:', updateError);
    }

    return NextResponse.json({ 
      success: true, 
      ticket: tradeData.orderId || tradeData.positionId 
    });

  } catch (error: any) {
    console.error('[MT5 Route Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
