
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'viewer'
};
exports.conf = conf;

const help = {
    name: 'ping',
    category: 'Miscellaneous',
    description: 'It like... Pings. Then Pongs. And it is not Ping Pong.',
    usage: 'ping',
    minArgs: null,
    maxArgs: 0
};
exports.help = help;

const run = async (message, commandName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName)) return;
    
    const msg = await message.channel.send('ping');
    msg.edit(`pong - latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
};
exports.run = run;
