const { Client } = require('@notionhq/client');

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
    throw new Error('Missing required environment variables NOTION_API_KEY or NOTION_DATABASE_ID');
}

const notion = new Client({ 
    auth: notionApiKey,
    notionVersion: '2022-06-28'  // Explicitly set Notion API version
});


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
        console.log('Database response:', dbResponse);
        
        // Find the Status property and extract workflow stages
        const statusProperty = Object.values(dbResponse.properties).find(prop => 
            prop.type === 'status' || prop.type === 'select'
        );
        
        let workflowStages = ['Not Started'];
        if (statusProperty) {
            const options = statusProperty.type === 'status' 
                ? statusProperty.status.options 
                : statusProperty.select.options;
            workflowStages = options.map(option => option.name);
        }
        console.log('Workflow stages:', workflowStages);

        // Fetch comments
        const commentsResponse = await notion.comments.list({ block_id: projectItem.id });
        const comments = commentsResponse.results.map(comment => ({
            text: comment.rich_text.map(t => t.plain_text).join(''),
            timestamp: comment.created_time,
        }));

        // Clean and structure the project data
        const props = projectItem.properties;
        console.log('Notion properties:', props);

        const getTextContent = (prop) => {
            if (!prop) return '';
            if (prop.title) return prop.title[0]?.plain_text || '';
            if (prop.rich_text) return prop.rich_text[0]?.plain_text || '';
            return '';
        };

        const cleanData = {
            projectId: projectItem.id,
            projectName: getTextContent(props.Name || props.name || props.Title || props.title) || 'Untitled',
            description: getTextContent(props.Description || props.description),
            clientName: (props.Client || props.client)?.select?.name || 
                       (props.Client || props.client)?.rich_text?.[0]?.plain_text || 'N/A',
            status: (props.Status || props.status)?.status?.name || 
                   (props.Status || props.status)?.select?.name || 'Not Started',
            timeline: (props.Timeline || props.timeline || props.Date || props.date)?.date?.start || null,
            email: (props.Email || props.email)?.email || 
                  getTextContent(props.Email || props.email) || '',
            documents: (props.Documents || props.documents || props.Files || props.files)?.files?.map(file => ({ 
                name: file.name, 
                url: file.file?.url || file.external?.url || ''
            })) || [],
        };
        
        console.log('Cleaned data:', cleanData);

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