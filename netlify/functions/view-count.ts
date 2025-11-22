import { neon } from '@neondatabase/serverless';

export const handler = async (event, context) => {
  const sql = neon(process.env.DATABASE_URL);

  try {
    if (event.httpMethod === 'POST') {
      // Increment view count
      await sql`
        INSERT INTO site_stats (key, value)
        VALUES ('total_views', 1)
        ON CONFLICT (key)
        DO UPDATE SET value = site_stats.value + 1;
      `;
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'View count incremented' }),
      };
    } else if (event.httpMethod === 'GET') {
      // Get view count
      const result = await sql`SELECT value FROM site_stats WHERE key = 'total_views'`;
      const count = result.length > 0 ? result[0].value : 0;
      return {
        statusCode: 200,
        body: JSON.stringify({ count }),
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
