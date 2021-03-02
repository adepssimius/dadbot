
// Determine our place in the world
const ROOT = '..';

// Load our classes
const SyncMessage = require(`${ROOT}/modules/sync/SyncMessage`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// 
// TODO - Add event description here (see message.js for an example)
// 

module.exports = async (message) => {
    // Ignore deletes from the bot
    if (message.author.bot) return;

    // Attempt to update the message
    SyncMessage.syncDelete(message);
};
