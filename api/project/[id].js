const { Client } = require('@notionhq/client');

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
    throw new Error('Missing required environment variables NOTION_API_KEY or NOTION_DATABASE_ID');
}

// Initialize Notion client with the new API version
const notion = new Client({ 
    auth: notionApiKey,
    notionVersion: '2025-09-03'  // Using the latest API version
});

module.exports = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Project ID is missing." });
    }

    try {
        console.log('Getting database information...');
        
        // First, get the database to find its data source
        const dbResponse = await notion.databases.retrieve({ 
            database_id: notionDatabaseId 
        });
        
        if (!dbResponse.data_sources || dbResponse.data_sources.length === 0) {
            console.error('No data sources found for database');
            return res.status(500).json({ error: 'Database configuration error: No data sources found' });
        }

        // Use the first data source
        const dataSourceId = dbResponse.data_sources[0].id;
        console.log('Using data source:', dataSourceId);

        // Query the data source for the project
        console.log('Searching for project with ID:', id);
        const pages = await notion.request({
            path: `data_sources/${dataSourceId}/query`,
            method: 'POST',
            body: {
                filter: {
                    property: "Public ID",
                    rich_text: {
                        equals: id
                    }
                }
            }
        });
        
        // Get the data source schema
        console.log('Getting data source schema...');
        const dataSource = await notion.request({
            path: `data_sources/${dataSourceId}`,
            method: 'GET'
        });

        // Extract workflow stages from the Status property
        let workflowStages = ['Not Started', 'In Progress', 'Review', 'Complete'];
        if (dataSource.properties.Status && 
            (dataSource.properties.Status.type === 'status' || dataSource.properties.Status.type === 'select')) {
            const options = dataSource.properties.Status.type === 'status' 
                ? dataSource.properties.Status.status.options 
                : dataSource.properties.Status.select.options;
            workflowStages = options.map(opt => opt.name);
        }

        if (!pages.results.length) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (!pages.results.length) {
            console.log('No project found with ID:', id);
            return res.status(404).json({ error: 'Project not found' });
        }

        const page = pages.results[0];
        console.log('Found project:', page.id);

        // Get the full data source item details
        console.log('Fetching item details...');
        const pageDetails = await notion.request({
            path: `data_sources/${dataSourceId}/items/${page.id}`,
            method: 'GET'
        });
        console.log('Item details retrieved');

        // Get comments/updates from page blocks
        console.log('Fetching page blocks...');
        const blocks = await notion.blocks.children.list({
            block_id: page.id
        });
        
        const comments = [];
        if (blocks.results) {
            for (const block of blocks.results) {
                if (block.type === 'paragraph' && block.paragraph.rich_text.length > 0) {
                    comments.push({
                        text: block.paragraph.rich_text.map(t => t.plain_text).join(''),
                        timestamp: block.created_time
                    });
                }
            }
        }
        console.log(`Found ${comments.length} comments`);

        // Extract and clean the project data
        const props = page.properties;
        console.log('Processing properties:', Object.keys(props));

        const getTextContent = (prop) => {
            if (!prop) return '';
            if (prop.title && prop.title.length > 0) return prop.title[0].plain_text;
            if (prop.rich_text && prop.rich_text.length > 0) return prop.rich_text[0].plain_text;
            return '';
        };

        const cleanData = {
            projectId: page.id,
            projectName: getTextContent(props.Name) || getTextContent(props.Title) || 'Untitled',
            description: getTextContent(props.Description) || '',
            clientName: props.Client?.select?.name || 'N/A',
            status: props.Status?.status?.name || props.Status?.select?.name || 'Not Started',
            timeline: props.Timeline?.date?.start || null,
            email: props.Email?.email || '',
            documents: props.Files?.files?.map(file => ({
                name: file.name,
                url: file.file?.url || file.external?.url || ''
            })) || []
        };

        // Return all the data
        res.status(200).json({
            projectData: cleanData,
            workflowStages,
            comments
        });

    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ 
            message: "Failed to fetch project data", 
            error: error.message 
        });
    }
};