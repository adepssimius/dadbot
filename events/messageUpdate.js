
// Load singletons
const SyncMessage = require('../modules/sync/SyncMessage');
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

// 
// TODO - Add event description here (see message.js for an example)
// 

module.exports = async (oldMessage, newMessage) => {
    // Ignore messages from the bot
    if (newMessage.author.bot) return;
    
    // Attempt to update the message
    SyncMessage.syncUpdate(oldMessage, newMessage);
};
