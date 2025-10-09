const { Client } = require('@notionhq/client');

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

if (!notionApiKey || !notionDatabaseId) {
    throw new Error('Missing required environment variables NOTION_API_KEY or NOTION_DATABASE_ID');
}

const notion = new Client({ auth: notionApiKey });

module.exports = async (req, res) => {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: "Project ID is missing." });
    }

    try {
        console.log('Searching for project with ID:', id);
        
        console.log('Getting database schema...');
        const database = await notion.databases.retrieve({ 
            database_id: notionDatabaseId 
        });
        console.log('Database properties:', database.properties);

        // Get the status options from the database schema
        const workflowStages = ['Not Started', 'In Progress', 'Review', 'Complete'];
        
        console.log('Querying database for project...');
        // Search for the project page by its ID
        const pages = await notion.databases.query({
            database_id: notionDatabaseId,
            filter: {
                and: [
                    {
                        property: "Public ID",
                        rich_text: {
                            equals: id
                        }
                    }
                ]
            }
        });

        if (!pages.results.length) {
            return res.status(404).json({ error: 'Project not found' });
        }

        if (!pages.results.length) {
            console.log('No project found with ID:', id);
            return res.status(404).json({ error: 'Project not found' });
        }

        const page = pages.results[0];
        console.log('Found project:', page.id);

        // Get the full page details
        console.log('Fetching page details...');
        const pageDetails = await notion.pages.retrieve({ 
            page_id: page.id 
        });
        console.log('Page details retrieved');

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
            documents: []
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