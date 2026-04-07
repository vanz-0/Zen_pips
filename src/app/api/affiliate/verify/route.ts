import { createClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { broker, brokerId } = await req.json()

        if (!broker || !brokerId) {
            return NextResponse.json({ error: "Missing broker details" }, { status: 400 })
        }

        // 1. Log the verification request
        const { data: verification, error: verifyError } = await supabase
            .from('affiliate_verifications')
            .insert({
                user_id: user.id,
                broker_name: broker,
                submitted_key: brokerId,
                status: 'PENDING',
                reward_amount: 20 // Grant 20 AI credits for registration
            })
            .select()
            .single()

        if (verifyError) throw verifyError

        // 2. Proactively update the user profile with the MT5 ID 
        const { error: profileError } = await supabase
            .from('client_trading_profiles')
            .update({
                mt5_account_id: brokerId
            })
            .eq('id', user.id)

        if (profileError) console.error("Profile update error:", profileError)

        return NextResponse.json({ 
            success: true, 
            message: "Verification submitted. Your 20 AI Credits are being provisioned.",
            verificationId: verification.id 
        })

    } catch (error: any) {
        console.error("Affiliate verify error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
