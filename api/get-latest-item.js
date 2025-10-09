const { Client } = require('@notionhq/client');
const notion = new Client({ auth: process.env.NOTION_API_KEY });

module.exports = async (req, res) => {
  // --- ADD THESE TWO DEBUGGING LINES ---
  console.log('Is NOTION_API_KEY available:', !!process.env.NOTION_API_KEY);
  console.log('Is NOTION_DATABASE_ID available:', !!process.env.NOTION_DATABASE_ID);
  // ------------------------------------

  try {
    const databaseId = process.env.NOTION_DATABASE_ID;

    // The rest of your function code remains the same...
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

    // ...etc.
    // (The rest of the file is unchanged)
    
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
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from Notion.' });
  }
};