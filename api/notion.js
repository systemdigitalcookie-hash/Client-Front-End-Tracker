const { Client } = require('@notionhq/client');

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
  throw new Error("FATAL: Missing NOTION_API_KEY or NOTION_DATABASE_ID in Vercel environment variables.");
}

// Initialize the client with the new API version specified in the guide
const notion = new Client({ 
  auth: notionApiKey,
  notionVersion: '2025-09-03' 
});

module.exports = async (req, res) => {
  try {
    // --- STEP 1: Get the Database to find its Data Source ID ---
    const dbResponse = await notion.databases.retrieve({ database_id: notionDatabaseId });
    // For this POC, we assume the database has at least one data source and we'll use the first one.
    if (!dbResponse.data_sources || dbResponse.data_sources.length === 0) {
      throw new Error("No data sources found for this database.");
    }
    const dataSourceId = dbResponse.data_sources[0].id;

    // --- STEP 2: Retrieve the Data Source Schema to get Status options ---
    // This is the new, correct way to get the properties.
    const dataSourceDetails = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
    const workflowStages = dataSourceDetails.properties.Status.status.options.map(option => option.name);
    
    // --- STEP 3: Query the Data Source for the latest item ---
    // Note: We now query the data_source_id, not the database_id.
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
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
        // This new line maps over the files and creates a clean array of objects
        documents: props.Documents.files.map(file => ({
            name: file.name,
            url: file.file.url,
        })),
    };
    // Send both the project data and the dynamically fetched workflow stages
    res.status(200).json({ 
      projectData: cleanData,
      workflowStages: workflowStages 
    });

  } catch (error) {
    console.error("--- ERROR CAUGHT INSIDE HANDLER ---", error);
    res.status(500).json({ 
      message: "An error occurred while fetching from Notion.",
      error: error.message 
    });
  }
};