
// Determine our place in the world
const ROOT = '..';

// Load our classes
const Message = require(`${ROOT}/modules/data/Message`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Emitted whenever a message is deleted.

module.exports = async (message) => {
    // Ignore deletes from the bot
    if (message.author.bot) return;

    // Attempt to update the message
    Message.syncDelete(message);
};
