const { Client } = require('@notionhq/client');

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
  throw new Error("FATAL: Missing NOTION_API_KEY or NOTION_DATABASE_ID in Vercel environment variables.");
}

const notion = new Client({ auth: notionApiKey });

module.exports = async (req, res) => {
  try {
    // This part remains the same: we find the latest item.
    const response = await notion.databases.query({
      database_id: notionDatabaseId,
      sorts: [ { property: 'Created time', direction: 'descending' } ],
      page_size: 1,
    });
    
    if (response.results.length === 0) {
      return res.status(404).json({ error: 'No items found in the database.' });
    }

    const latestItem = response.results[0];
    const props = latestItem.properties;

    // --- NEW: FETCH PAGE COMMENTS ---
    const commentsResponse = await notion.comments.list({ block_id: latestItem.id });
    const comments = commentsResponse.results.map(comment => {
        // We extract the plain text from the rich_text array
        const textContent = comment.rich_text.map(textBlock => textBlock.plain_text).join('');
        return {
            text: textContent,
            timestamp: comment.created_time,
        };
    });
    // -----------------------------

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
    
    // We now send the comments along with the other data
    res.status(200).json({ 
      projectData: cleanData,
      comments: comments // Add the comments array to the response
    });

  } catch (error) {
    console.error("--- ERROR CAUGHT INSIDE HANDLER ---", error.message);
    res.status(500).json({ 
      message: "An error occurred while fetching from Notion.",
      error: error.message 
    });
  }
};