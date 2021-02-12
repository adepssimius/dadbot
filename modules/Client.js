
const Discord = require('discord.js');

const client = new Discord.Client();
client.logger = require('./Logger');

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
