"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/context/AuthContext"
import { supabase } from "@/lib/supabase"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from "lucide-react"

export default function ChartUploader() {
    const { profile, user } = useAuth()
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)
    const [aiChecking, setAiChecking] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0]
        if (selected) {
            if (!selected.type.startsWith('image/')) {
                setStatus({ type: 'error', message: "Please select an image file." })
                return
            }
            setFile(selected)
            const reader = new FileReader()
            reader.onloadend = () => setPreview(reader.result as string)
            reader.readAsDataURL(selected)
            setStatus(null)
        }
    }

    const validateChartWithAI = async (imageData: string): Promise<{ valid: boolean; reason: string }> => {
        setAiChecking(true)
        try {
            const res = await fetch('/api/analyze-chart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: imageData, mode: 'verify_only' })
            })
            const data = await res.json()
            if (data.isChart) {
                return { valid: true, reason: "" }
            }
            return { valid: false, reason: data.reason || "The AI could not confirm this is a valid trading chart." }
        } catch (err) {
            console.error("AI Validation failed:", err)
            // STRICT: Do NOT allow upload if AI verification fails
            return { valid: false, reason: "AI verification service is unavailable. Please try again shortly." }
        } finally {
            setAiChecking(false)
        }
    }

    const handleUpload = async () => {
        if (!file || !preview) return
        setUploading(true)
        setStatus(null)

        // 1. Strict AI Verification — No Override
        const verification = await validateChartWithAI(preview)
        if (!verification.valid) {
            setStatus({ 
                type: 'error', 
                message: `⛔ Chart Rejected: ${verification.reason} Please verify this is a valid trading chart with clear markups and try again.` 
            })
            setUploading(false)
            return
        }

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`
            const monthYear = new Date().toISOString().substring(0, 7) // YYYY-MM
            const filePath = `${monthYear}/${fileName}`

            // 2. Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('signal_charts')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage.from('signal_charts').getPublicUrl(filePath)

            // 3. Broadcast to Community Messages
            const { error: dbError } = await supabase.from('community_messages').insert({
                user_id: user?.id,
                content: `🚀 **Institutional Setup Uploaded by Admin Panel**\n\nA new institutional chart has been broadcasted to the network. Stay sharp.`,
                image: publicUrl,
                channel: 'setups-and-charts'
            })

            if (dbError) throw dbError

            setStatus({ type: 'success', message: "Institutional chart broadcasted successfully!" })
            setFile(null)
            setPreview(null)
        } catch (error: any) {
            setStatus({ type: 'error', message: error.message || "Broadcast failed. Please check logs." })
        } finally {
            setUploading(false)
        }
    }

    return (
        <div className="glass-card p-6 border-white/10">
            <h2 className="text-xl font-heading font-semibold text-white mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-yellow-500" />
                Broadcast Institutional Setup
            </h2>

            <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
                    preview ? 'border-yellow-500/50 bg-yellow-500/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                }`}
            >
                {preview ? (
                    <div className="w-full aspect-video relative rounded-lg overflow-hidden border border-white/10">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                            onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                            className="absolute top-2 right-2 p-1 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="p-3 bg-white/5 rounded-full">
                            <Upload className="w-8 h-8 text-neutral-400" />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-medium">Click to upload chart</p>
                            <p className="text-xs text-neutral-400 mt-1">PNG, JPG or WebP up to 10MB</p>
                        </div>
                    </>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*" 
                    className="hidden" 
                />
            </div>

            <AnimatePresence>
                {status && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className={`mt-4 p-3 rounded-lg flex items-center gap-3 text-sm ${
                            status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                    >
                        {status.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                        {status.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <button
                disabled={!file || uploading || aiChecking}
                onClick={handleUpload}
                className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-neutral-700 disabled:to-neutral-800 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/10 active:scale-[0.98]"
            >
                {uploading || aiChecking ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {aiChecking ? "AI Verification..." : "Broadcasting..."}
                    </>
                ) : (
                    "Confirm & Broadcast Signal"
                )}
            </button>
            <p className="text-[10px] text-center text-neutral-500 mt-3 uppercase tracking-widest font-medium">
                Locked to institutional admins only
            </p>
        </div>
    )
}
