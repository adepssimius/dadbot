
// Determine our place in the world
const ROOT = '..';

// Load our classes
const Logger  = require(`${ROOT}/modules/Logger`);

// Load external modules
const Discord = require('discord.js');

// Create a new Discord client
const client = new Discord.Client();

// Add the logger
client.logger = Logger;

// Load the config
client.config = require(`${ROOT}/config.js`);

// Fill the permission level map
client.permLevelMap = new Map();

for (let x = 0; x < client.config.permLevels.length; x++) {
    const permLevel = client.config.permLevels[x];
    client.permLevelMap.set(permLevel.name, permLevel);
}

// Add Collections for commands and aliases
client.commands = new Discord.Collection();
client.aliases  = new Discord.Collection();

// Load our extra functions, though we should just move them all here
require('./ClientFunctions')(client);

// Freeze and export
//Object.freeze(client);
module.exports = client;
