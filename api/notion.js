const { Client } = require('@notionhq/client');

// This code remains the same
const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
  throw new Error("FATAL: Missing NOTION_API_KEY or NOTION_DATABASE_ID in Vercel environment variables.");
}

const notion = new Client({ auth: notionApiKey });

module.exports = async (req, res) => {
  try {
    // --- 1. RETRIEVE DATABASE PROPERTIES TO GET STATUS OPTIONS ---
    const databaseDetails = await notion.databases.retrieve({ database_id: notionDatabaseId });
    // This finds the 'Status' property and maps its options to a simple array of names.
    const workflowStages = databaseDetails.properties.Status.status.options.map(option => option.name);
    // -------------------------------------------------------------

    // --- 2. QUERY THE DATABASE FOR THE LATEST ITEM (Same as before) ---
    const response = await notion.databases.query({
      database_id: notionDatabaseId,
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
    
    // --- 3. SEND BOTH THE PROJECT DATA AND THE WORKFLOW STAGES TO THE FRONTEND ---
    res.status(200).json({ 
      projectData: cleanData,
      workflowStages: workflowStages 
    });
    // -------------------------------------------------------------------------

  } catch (error) {
    console.error("--- ERROR CAUGHT INSIDE HANDLER ---", error.message);
    res.status(500).json({ 
      message: "An error occurred while fetching from Notion.",
      error: error.message 
    });
  }
};