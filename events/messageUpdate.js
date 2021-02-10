
// Load singletons
const syncGroupManager = require('../modules/sync/SyncGroupManager');

// 
// TODO - Add event description here (see message.js for an example)
// 

module.exports = async (client, oldMessage, newMessage) => {
    // Ignore messages from the bot
    if (newMessage.author.bot) return;
    
    // Attempt to update the message
    syncGroupManager.updateMessage(client, oldMessage, newMessage);
};
