
// Load singletons
const client = require('../modules/Client.js'); // eslint-disable-line no-unused-vars

exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: "User"
};

exports.help = {
    name: 'ping',
    category: 'Miscellaneous',
    description: 'It like... Pings. Then Pongs. And it is not Ping Pong.',
    usage: 'ping'
};

exports.run = async (message, args, level) => {
    const msg = await message.channel.send('ping');
    msg.edit(`pong - latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
};
