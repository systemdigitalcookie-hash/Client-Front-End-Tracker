const { Client } = require('@notionhq/client');

// ... (copy the notionApiKey, notionDatabaseId, and notion client initialization from the other API file) ...
const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;
const notion = new Client({ auth: notionApiKey });


module.exports = async (req, res) => {
    // Get the unique ID from the URL (e.g., /api/project/12345 -> id = '12345')
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Project ID is missing." });
    }

    try {
        // Find the page in the database where "Public ID" matches the ID from the URL.
        const response = await notion.databases.query({
            database_id: notionDatabaseId,
            filter: {
                property: "Public ID",
                rich_text: {
                    equals: id
                }
            }
        });

        if (response.results.length === 0) {
            return res.status(404).json({ error: 'Project not found.' });
        }

        // ... (copy all the data fetching logic from your previous api/notion.js file) ...
        // This includes fetching comments, cleaning data, etc.
        // For brevity, I'll put a placeholder here, but you should copy the full logic.

        const projectItem = response.results[0];
        // ... Fetch comments using projectItem.id ...
        // ... Create the cleanData object ...

        // You would return the full payload here:
        // res.status(200).json({ projectData, workflowStages, comments });

        res.status(200).json({ projectData: { projectName: `Found Project with ID: ${id}` } }); // Placeholder response


    } catch (error) {
        // ... (copy your error handling logic) ...
        res.status(500).json({ message: "Failed to fetch project.", error: error.message });
    }
};