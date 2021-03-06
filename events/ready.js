
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

module.exports = async () => {
    // Log that the bot is online
    client.logger.log(`${client.user.tag}, ready to serve ${client.users.cache.size} users in ${client.guilds.cache.size} servers.`, "ready");
    
    // Make the bot "play the game" which is the help command with default prefix.
    // TODO - Maybe revise this later
    //client.user.setActivity(`${client.settings.get("default").prefix}help`, {type: "PLAYING"});
    client.user.setActivity(`${client.config.prefix}help`, {type: "PLAYING"});
};
