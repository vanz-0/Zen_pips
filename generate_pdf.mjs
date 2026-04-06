import puppeteer from 'puppeteer-core';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generatePDFs() {
    console.log('🚀 Starting Institutional PDF generation suite...');
    
    const chromePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Users\\' + process.env.USERNAME + '\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];

    let executablePath = '';
    for (const p of chromePaths) {
        if (fs.existsSync(p)) {
            executablePath = p;
            break;
        }
    }

    if (!executablePath) {
        console.error('❌ Could not find Chrome/Edge executable.');
        process.exit(1);
    }

    const browser = await puppeteer.launch({ executablePath, headless: true });

    const jobs = [
        { url: 'http://localhost:3000/guide', filename: 'ZenPips_Institutional_Guide.pdf' },
        { url: 'http://localhost:3000/tools-guide', filename: 'ZenPips_Tools_Manifesto.pdf' }
    ];

    for (const job of jobs) {
        console.log(`🌐 Navigating to ${job.url}...`);
        const page = await browser.newPage();
        try {
            await page.goto(job.url, { waitUntil: 'networkidle2', timeout: 60000 });
            await page.addStyleTag({ content: 'nav { display: none !important; } .print-hide { display: none !important; }' });
            
            const outputPath = path.join(__dirname, 'public', job.filename);
            console.log(`📄 Exporting ${job.filename}...`);
            await page.pdf({
                path: outputPath,
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' }
            });
            console.log(`✅ Success: ${job.filename}`);
        } catch (e) {
            console.error(`❌ Failed ${job.filename}:`, e);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log('🏁 All PDF generation tasks complete.');
}

generatePDFs();
