// This function calls the Notion API directly, without using the Notion library.
module.exports = async (req, res) => {
  const notionApiKey = process.env.NOTION_API_KEY;
  const notionDatabaseId = process.env.NOTION_DATABASE_ID;

  // Check for the environment variables one last time.
  if (!notionApiKey || !notionDatabaseId) {
    return res.status(500).json({ error: "Notion API Key or Database ID is missing from Vercel environment variables." });
  }

  // The specific URL for querying a Notion database.
  const url = `https://api.notion.com/v1/databases/${notionDatabaseId}/query`;

  const headers = {
    'Authorization': `Bearer ${notionApiKey}`,
    'Content-Type': 'application/json',
    'Notion-Version': '2022-06-28', // Required by the Notion API
  };

  const body = JSON.stringify({
    sorts: [
      {
        property: 'Created time',
        direction: 'descending',
      },
    ],
    page_size: 1,
  });

  try {
    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: headers,
      body: body,
    });
    
    // If the response is not OK (e.g., 401 Unauthorized, 404 Not Found),
    // we get the error text and send it back to the browser.
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error("Error from Notion API:", errorText);
      return res.status(apiResponse.status).json({ error: `Notion API Error: ${errorText}` });
    }

    // If the response is OK, we parse the JSON.
    const response = await apiResponse.json();
    
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
    console.error("--- FATAL ERROR IN API FUNCTION ---", error.message);
    res.status(500).json({ 
      message: "A fatal error occurred in the API function.",
      error: error.message 
    });
  }
};