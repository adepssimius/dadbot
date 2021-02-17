
const Discord = require('discord.js');
const Logger  = require('./Logger');

// Create a new Discord client
const client = new Discord.Client();

// Add the logger
client.logger = Logger;

// Add Collections for commands and aliases
client.commands = new Discord.Collection();
client.aliases  = new Discord.Collection();

// Set our prefix and token
client.config = {
    prefix: process.env.PREFIX,
    token: process.env.TOKEN
};

// Load our extra functions, though we should just move them all here
require('./clientFunctions')(client);

// Freeze and export
//Object.freeze(client);
module.exports = client;
