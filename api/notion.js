// --- DEBUGGING AT THE TOP LEVEL ---
console.log('--- API MODULE LOADED ---');
console.log('Is NOTION_API_KEY available on load:', !!process.env.NOTION_API_KEY);
// ------------------------------------

const { Client } = require('@notionhq/client');

// This line will cause the crash if the API key is missing.
const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async (req, res) => {
  // We can remove the previous logs from here as they are now at the top.
  try {
    const databaseId = process.env.NOTION_DATABASE_ID;

    const response = await notion.databases.query({
      database_id: databaseId,
      sorts: [
        {
          property: 'Created time',
          direction: 'descending',
        },
      ],
      page_size: 1,
    });
    
    if (response.results.length === 0) {
      return res.status(404).json({ error: 'No items found in the database.' });
    }

    const latestItem = response.results[0];
    const props = latestItem.properties;

    const cleanData = {
      projectId: latestItem.id,
      projectName: props.Name.title[0]?.plain_text || 'Untitled',
      description: props.Description.rich_text[0]?.plain_text || '',
      clientName: props.Client.select?.name || 'N/A',
      status: props.Status.status?.name || 'Backlog',
      timeline: props.Timeline.date?.start || null,
      email: props.Email.email || '',
      documentCount: props.Documents.files.length,
    };
    
    res.status(200).json(cleanData);

  } catch (error) {
    console.error('--- ERROR CAUGHT INSIDE HANDLER ---');
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from Notion. Check Vercel logs.' });
  }
};