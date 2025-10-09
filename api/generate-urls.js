const { Client } = require('uuid');
const { v4: uuidv4 } = require('uuid');

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

// Your website's main URL
const SITE_URL = "https://client-front-end-tracker.vercel.app";

if (!notionApiKey || !notionDatabaseId) {
  throw new Error("FATAL: Missing Notion API Key or Database ID.");
}

const notion = new Client({ 
  auth: notionApiKey,
  notionVersion: '2025-09-03' 
});

module.exports = async (req, res) => {
    try {
        // Step 1: Get the Database to find its Data Source ID
        const dbResponse = await notion.databases.retrieve({ database_id: notionDatabaseId });
        if (!dbResponse.data_sources || dbResponse.data_sources.length === 0) {
            throw new Error("No data sources found for this database.");
        }
        const dataSourceId = dbResponse.data_sources[0].id;

        // Step 2: Query the Data Source to find pages where "Public ID" is empty.
        const pagesToUpdate = await notion.dataSources.query({
            data_source_id: dataSourceId,
            filter: {
                property: "Public ID",
                rich_text: {
                    is_empty: true
                }
            }
        });

        if (pagesToUpdate.results.length === 0) {
            return res.status(200).json({ message: "No new projects to update." });
        }

        // Step 3: Loop through each page and update it.
        const updatePromises = pagesToUpdate.results.map(page => {
            const uniqueId = uuidv4();
            const publicUrl = `${SITE_URL}/t/${uniqueId}`;

            return notion.pages.update({
                page_id: page.id,
                properties: {
                    "Public ID": {
                        rich_text: [{ type: "text", text: { content: uniqueId } }]
                    },
                    "Url": {
                        url: publicUrl
                    }
                }
            });
        });

        await Promise.all(updatePromises);

        res.status(200).json({ 
            message: `Successfully updated ${updatePromises.length} project(s).` 
        });

    } catch (error) {
        console.error("Error generating URLs:", error);
        res.status(500).json({ message: "Failed to generate URLs.", error: error.message });
    }
};