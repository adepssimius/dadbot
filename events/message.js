
// Load singletons
const syncGroupManager = require('../modules/sync/SyncGroupManager');

// The MESSAGE event runs anytime a message is received
// Note that due to the binding of client to every event, every event
// goes `client, other, args` when this function is run.

module.exports = async (client, message) => {
    // Ignore messages from the bot
    if (message.author.bot) return;

    console.log('Incoming Message:');
    console.log(message);
    console.log();
    
    // If we find the prefix, attempt to process the command
    if (message.content.startsWith(client.config.prefix)) {
        client.runCommand(message);

    // Otherwise, attempt to send the message to the synchronization group
    } else {
        syncGroupManager.sendMessage(client, message);
    }
};
