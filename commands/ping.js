
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

exports.run = async (client, message, args, level) => { // eslint-disable-line no-unused-vars
    const msg = await message.channel.send('ping');
    msg.edit(`pong - latency is ${msg.createdTimestamp - message.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
};
