
// Load singletons
const SyncMessage = require('../modules/sync/SyncMessage');
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

// 
// TODO - Add event description here (see message.js for an example)
// 

module.exports = async (message) => {
    // Ignore messages from the bot
    if (message.author.bot) return;

    // Attempt to update the message
    SyncMessage.syncDelete(message);
};
