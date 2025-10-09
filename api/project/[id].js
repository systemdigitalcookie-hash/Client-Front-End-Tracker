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

        const projectItem = response.results[0];
        
        // Get the database schema to get workflow stages
        const dbResponse = await notion.databases.retrieve({ database_id: notionDatabaseId });
        const statusProperty = Object.values(dbResponse.properties).find(prop => prop.name === 'Status');
        const workflowStages = statusProperty.select.options.map(option => option.name);

        // Fetch comments
        const commentsResponse = await notion.comments.list({ block_id: projectItem.id });
        const comments = commentsResponse.results.map(comment => ({
            text: comment.rich_text.map(t => t.plain_text).join(''),
            timestamp: comment.created_time,
        }));

        // Clean and structure the project data
        const props = projectItem.properties;
        const cleanData = {
            projectId: projectItem.id,
            projectName: props.Name.title[0]?.plain_text || 'Untitled',
            description: props.Description?.rich_text[0]?.plain_text || '',
            clientName: props.Client?.select?.name || 'N/A',
            status: props.Status?.select?.name || 'Backlog',
            timeline: props.Timeline?.date?.start || null,
            email: props.Email?.email || '',
            documents: props.Documents?.files?.map(file => ({ 
                name: file.name, 
                url: file.file.url 
            })) || [],
        };

        res.status(200).json({ 
            projectData: cleanData,
            workflowStages: workflowStages,
            comments: comments
        });


    } catch (error) {
        // ... (copy your error handling logic) ...
        res.status(500).json({ message: "Failed to fetch project.", error: error.message });
    }
};