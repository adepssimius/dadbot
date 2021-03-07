
// Determine our place in the world
const ROOT = '..';

// Load our classes
const Message = require(`${ROOT}/modules/data/Message`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Emitted whenever a message is updated - e.g. embed or content change.

module.exports = async (oldMessage, newMessage) => {
    // Ignore updates from the bot
    if (newMessage.author.bot) return;
    
    // Attempt to update the message
    Message.syncUpdate(oldMessage, newMessage);
};
