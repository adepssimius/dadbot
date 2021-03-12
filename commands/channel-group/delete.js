
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance     = require(`${ROOT}/modules/data/Alliance`);
const ChannelGroup = require(`${ROOT}/modules/data/ChannelGroup`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['del'],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'channel-group',
    name: 'delete',
    category: 'Channel Group Administration',
    description: 'Delete an existing channel group',
    usage: `channel-group delete <${ChannelGroup.getFieldValidValues('type').join('|')}> <name>`,
    minArgs: 2,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Get the alliance for this guild
    const alliance = await Alliance.get({guildId: message.guild.id, unique: true});
    if (alliance == null) {
        message.channel.send(`Discord clan must be in an alliance to delete a channel group`);
        return;
    }
    
    let type = args.shift();

    if (!ChannelGroup.getFieldValidValues('type').includes(type)) {
        args.unshift(type);
        type = null;
    }
    
    if (args.length == 0) {
        message.reply(client.usage(help, commandName, actionName));
        return;
    }
    
    const name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    const query = {
        name: name,
        allianceId: alliance.id,
        unique: true
    };
    
    if (type) {
        query.type = type;
    }
    
    const channelGroup = await ChannelGroup.get(query);

    if (channelGroup == null) {
        message.channel.send(`Invalid ${type ? `${type} ` : ''}channel group: ${name}`);
        return;
    }
    
    try {
        await channelGroup.delete();
        message.channel.send(`Channel group deleted`);
    } catch (error) {
        client.replyWithErrorAndDM(`Deletion of ${type} channel group failed: ${name}`, message, error);
    }
};
exports.run = run;
