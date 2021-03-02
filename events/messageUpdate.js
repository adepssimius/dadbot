
// Determine our place in the world
const ROOT = '..';

// Load our classes
const SyncMessage = require(`${ROOT}/modules/sync/SyncMessage`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// 
// TODO - Add event description here (see message.js for an example)
// 

module.exports = async (oldMessage, newMessage) => {
    // Ignore updates from the bot
    if (newMessage.author.bot) return;
    
    // Attempt to update the message
    SyncMessage.syncUpdate(oldMessage, newMessage);
};
