const { Client } = require('@notionhq/client');
const { v4: uuidv4 } = require('uuid'); // Import the uuid library

const notionApiKey = process.env.NOTION_API_KEY;
const notionDatabaseId = process.env.NOTION_DATABASE_ID;

// Your website's main URL. You can get this from your Vercel project dashboard.
const SITE_URL = "https://client-front-end-tracker.vercel.app";

if (!notionApiKey || !notionDatabaseId) {
  throw new Error("FATAL: Missing Notion API Key or Database ID.");
}

const notion = new Client({ auth: notionApiKey });

module.exports = async (req, res) => {
    try {
        // 1. Find all pages in the database where "Public ID" is empty.
        const pagesToUpdate = await notion.databases.query({
            database_id: notionDatabaseId,
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

        // 2. Loop through each page and update it.
        const updatePromises = pagesToUpdate.results.map(page => {
            const uniqueId = uuidv4(); // Generate a unique ID
            const publicUrl = `${SITE_URL}/t/${uniqueId}`; // Create the full URL

            return notion.pages.update({
                page_id: page.id,
                properties: {
                    "Public ID": {
                        rich_text: [{ type: "text", text: { content: uniqueId } }]
                    },
                    "Url": { // Assumes you have a "Url" property of type "URL"
                        url: publicUrl
                    }
                }
            });
        });

        // 3. Wait for all updates to complete.
        await Promise.all(updatePromises);

        res.status(200).json({ 
            message: `Successfully updated ${updatePromises.length} project(s).` 
        });

    } catch (error) {
        console.error("Error generating URLs:", error);
        res.status(500).json({ message: "Failed to generate URLs.", error: error.message });
    }
};