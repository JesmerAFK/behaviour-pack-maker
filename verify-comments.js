const BASE_URL = 'http://localhost:3000/.netlify/functions/comments';

async function test() {
    const itemId = 'test-item-' + Date.now();
    const username = 'TestUser';

    console.log(`Testing with itemId: ${itemId}`);

    // 1. Post Comment
    console.log('1. Posting first comment...');
    const res1 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, username, content: 'First comment' })
    });
    const data1 = await res1.json();
    console.log('Status:', res1.status, data1);

    // 2. Post Second Comment (Should Fail)
    console.log('2. Posting second comment (should fail)...');
    const res2 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, username, content: 'Second comment' })
    });
    const data2 = await res2.json();
    console.log('Status:', res2.status, data2);

    // 3. Post Reply (Should Succeed)
    console.log('3. Posting reply (should succeed)...');
    // Need parent ID? We don't have it easily from POST response unless we fetch.
    // Let's fetch first.
    const resGet = await fetch(`${BASE_URL}?itemId=${itemId}`);
    const comments = await resGet.json();
    const parentId = comments[0].id;

    const res3 = await fetch(BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, username, content: 'Reply comment', parentId })
    });
    const data3 = await res3.json();
    console.log('Status:', res3.status, data3);

    // 4. Verify Comments
    console.log('4. Verifying comments...');
    const resFinal = await fetch(`${BASE_URL}?itemId=${itemId}`);
    const finalComments = await resFinal.json();
    console.log('Final Comments:', JSON.stringify(finalComments, null, 2));
}

test().catch(console.error);
