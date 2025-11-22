import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
    const sql = neon(process.env.DATABASE_URL);
    const { itemId } = event.queryStringParameters || {};

    try {
        if (event.httpMethod === 'GET') {
            if (!itemId) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Missing itemId parameter' }),
                };
            }

            // Fetch all comments for the item
            const rows = await sql`
        SELECT id, item_id, username, content, parent_id, created_at 
        FROM comments 
        WHERE item_id = ${itemId} 
        ORDER BY created_at ASC
      `;

            return {
                statusCode: 200,
                body: JSON.stringify(rows),
            };
        } else if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { itemId, username, content, parentId } = body;

            if (!itemId || !username || !content) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Missing required fields' }),
                };
            }

            // Rate Limit Logic: Only for top-level comments (no parentId)
            if (!parentId) {
                // Check last top-level comment by this user
                const lastComment = await sql`
          SELECT created_at 
          FROM comments 
          WHERE username = ${username} 
          AND parent_id IS NULL 
          ORDER BY created_at DESC 
          LIMIT 1
        `;

                if (lastComment.length > 0) {
                    const lastTime = new Date(lastComment[0].created_at).getTime();
                    const now = new Date().getTime();
                    const hoursDiff = (now - lastTime) / (1000 * 60 * 60);

                    if (hoursDiff < 12) {
                        return {
                            statusCode: 429,
                            body: JSON.stringify({
                                message: `You can only post a main comment once every 12 hours. You can still reply to others.`
                            }),
                        };
                    }
                }
            }

            // Insert Comment
            await sql`
        INSERT INTO comments (item_id, username, content, parent_id)
        VALUES (${itemId}, ${username}, ${content}, ${parentId || null})
      `;

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Comment posted successfully' }),
            };
        }

        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
