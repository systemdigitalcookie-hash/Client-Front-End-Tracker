// Import the official Notion API client
const { Client } = require('@notionhq/client');

// Initialize the Notion client using the secret API key from Vercel's environment variables
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// This is the main function that will be executed by Vercel
// The line below is the only change needed.
module.exports = async (req, res) => {
  try {
    // Get the Database ID from environment variables
    const databaseId = process.env.NOTION_DATABASE_ID;

    // Query the Notion database
    const response = await notion.databases.query({
      database_id: databaseId,
      // Sort by the 'Created time' property in descending order to get the latest item first
      sorts: [
        {
          property: 'Created time',
          direction: 'descending',
        },
      ],
      // We only need one item for this POC
      page_size: 1,
    });

    // Check if we got any results
    if (response.results.length === 0) {
      return res.status(404).json({ error: 'No items found in the database.' });
    }

    // Get the first item from the results
    const latestItem = response.results[0];
    const props = latestItem.properties;

    // --- Data Cleaning ---
    // The Notion API response is complex, so we simplify it into a clean object
    // that matches our frontend's needs.
    const cleanData = {
      projectId: latestItem.id, // Use the Notion page ID as a project ID
      projectName: props.Name.title[0]?.plain_text || 'Untitled',
      description: props.Description.rich_text[0]?.plain_text || '',
      clientName: props.Client.select?.name || 'N/A',
      status: props.Status.status?.name || 'Backlog',
      timeline: props.Timeline.date?.start || null,
      email: props.Email.email || '',
      documentCount: props.Documents.files.length,
    };
    
    // Send the clean data back to the frontend as a JSON response
    res.status(200).json(cleanData);

  } catch (error) {
    // Handle any errors that occur during the API call
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data from Notion.' });
  }
};