async function testLead() {
    try {
        const res = await fetch('http://localhost:3000/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test_lead_fix@example.com',
                name: 'Test Setup',
                source: 'lead_magnet'
            })
        });
        const data = await res.json();
        console.log("Status:", res.status);
        console.log("Response:", data);
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testLead();
