const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const EDU_DIR = 'C:\\Users\\Admin\\OneDrive\\Desktop\\ZENPIPS\\Trading Edu';
const BUCKET_NAME = 'education-vault';

async function main() {
    console.log("Starting upload process...");

    // 1. Ensure Bucket Exists
    const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
    if (bErr) {
        console.error("Error listing buckets:", bErr);
        return;
    }
    
    const bucketExists = buckets.find(b => b.name === BUCKET_NAME);
    if (!bucketExists) {
        console.log(`Creating bucket ${BUCKET_NAME}...`);
        const { error: cabErr } = await supabase.storage.createBucket(BUCKET_NAME, { public: false });
        if (cabErr) console.error("Error creating bucket:", cabErr);
    } else {
        console.log(`Bucket ${BUCKET_NAME} exists.`);
    }

    // 2. Read Files
    const files = fs.readdirSync(EDU_DIR);
    const pdfs = files.filter(f => f.toLowerCase().endsWith('.pdf'));
    console.log(`Found ${pdfs.length} PDFs.`);

    // 3. Upload and Insert into DB
    for (const pdf of pdfs) {
        const filePath = path.join(EDU_DIR, pdf);
        const fileData = fs.readFileSync(filePath);
        
        const storagePath = `pdfs/${pdf.replace(/\s+/g, '_')}`;

        console.log(`Uploading ${pdf}...`);
        const { data: uploadData, error: uploadErr } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileData, { upsert: true, contentType: 'application/pdf' });

        if (uploadErr) {
            console.error(`Failed to upload ${pdf}:`, uploadErr);
            continue;
        }

        console.log(`Uploaded! Adding to vault_resources...`);
        // Add to database
        const resource = {
            title: pdf.replace('.pdf', '').replace(/_/g, ' '),
            description: `Educational PDF: ${pdf}`,
            type: 'PDF',
            category: 'Smart Money Concepts', // Default
            level: 'Beginner', // Default free
            locked: false,
            file_path: storagePath
        };

        const { error: dbErr } = await supabase
            .from('vault_resources')
            .upsert([resource], { onConflict: 'title' });

        if (dbErr) {
            // Check if table missing
            if (dbErr.code === '42P01') {
                console.error("Table vault_resources is missing! Please create it.");
                break;
            }
            console.error(`Failed to insert ${pdf} into db:`, dbErr);
        }
    }
    
    console.log("Done!");
}

main().catch(console.error);
