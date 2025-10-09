const { Client } = require('@notionhq/client');

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
  throw new Error("FATAL: Missing NOTION_API_KEY or NOTION_DATABASE_ID in Vercel environment variables.");
}

const notion = new Client({ auth: notionApiKey });

module.exports = async (req, res) => {
  try {
    // Step 1: Get the Database to find its Data Source ID
    const dbResponse = await notion.databases.retrieve({ database_id: notionDatabaseId });
    if (!dbResponse.data_sources || dbResponse.data_sources.length === 0) {
      throw new Error("No data sources found for this database.");
    }
    const dataSourceId = dbResponse.data_sources[0].id;

    // Step 2: Retrieve the Data Source Schema to get Status options
    const dataSourceDetails = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
    const workflowStages = dataSourceDetails.properties.Status.status.options.map(option => option.name);
    
    // Step 3: Query the Data Source for the latest item
    const response = await notion.dataSources.query({
      data_source_id: dataSourceId,
      sorts: [ { property: 'Created time', direction: 'descending' } ],
      page_size: 1,
    });
    
    if (response.results.length === 0) {
      return res.status(404).json({ error: 'No items found in the database.' });
    }

    const latestItem = response.results[0];
    const props = latestItem.properties;

    // Step 4: Fetch the comments for the latest item
    const commentsResponse = await notion.comments.list({ block_id: latestItem.id });
    const comments = commentsResponse.results.map(comment => ({
        text: comment.rich_text.map(t => t.plain_text).join(''),
        timestamp: comment.created_time,
    }));

    // Step 5: Clean and combine all the data
    const cleanData = {
      projectId: latestItem.id,
      projectName: props.Name.title[0]?.plain_text || 'Untitled',
      description: props.Description.rich_text[0]?.plain_text || '',
      clientName: props.Client.select?.name || 'N/A',
      status: props.Status.status?.name || 'Backlog',
      timeline: props.Timeline.date?.start || null,
      email: props.Email.email || '',
      documents: props.Documents.files.map(file => ({ name: file.name, url: file.file.url })),
    };
    
    res.status(200).json({ 
      projectData: cleanData,
      workflowStages: workflowStages,
      comments: comments
    });

  } catch (error) {
    console.error("--- ERROR CAUGHT INSIDE HANDLER ---", error);
    res.status(500).json({ 
      message: "An error occurred while fetching from Notion.",
      error: error.message 
    });
  }
};