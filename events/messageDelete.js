
// Load singletons
const syncGroupManager = require('../modules/sync/SyncGroupManager');

// 
// TODO - Add event description here (see message.js for an example)
// 

module.exports = async (client, message) => {
    // Ignore messages from the bot
    if (message.author.bot) return;

    // Attempt to update the message
    syncGroupManager.deleteMessage(client, message);
};
