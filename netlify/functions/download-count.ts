import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
    const sql = neon(process.env.DATABASE_URL);
    const { itemId } = event.queryStringParameters || {};

    try {
        if (event.httpMethod === 'POST') {
            if (!itemId) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ message: 'Missing itemId parameter' }),
                };
            }
            // Increment download count
            await sql`
        INSERT INTO downloads (item_id, count)
        VALUES (${itemId}, 1)
        ON CONFLICT (item_id)
        DO UPDATE SET count = downloads.count + 1;
      `;
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Download count incremented' }),
            };
        } else if (event.httpMethod === 'GET') {
            // Get download count
            if (itemId) {
                const result = await sql`SELECT count FROM downloads WHERE item_id = ${itemId}`;
                const count = result.length > 0 ? result[0].count : 0;
                return {
                    statusCode: 200,
                    body: JSON.stringify({ count }),
                };
            } else {
                // Fetch all counts
                const result = await sql`SELECT item_id, count FROM downloads`;
                const counts = result.reduce((acc, row) => {
                    acc[row.item_id] = row.count;
                    return acc;
                }, {});
                return {
                    statusCode: 200,
                    body: JSON.stringify({ counts }),
                };
            }
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
