
// Determine our place in the world
const ROOT = '..';

// Load our classes
const Message = require(`${ROOT}/modules/data/Message`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Emitted whenever a reaction is added to a cached message.

module.exports = async (messageReaction, user) => {
    // Ignore reactions from bots
    if (user.bot) return;
    
    // See if this is a message we are tracking
    const messageQuery = {
        id: messageReaction.message.id,
        isReactionMessage: true,
        unique: true
    };
    const message = await Message.get(messageQuery);
    
    if (message) {
        message.handleReaction(messageReaction, user);
    }
};
