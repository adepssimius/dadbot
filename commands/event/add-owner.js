
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Event = require(`${ROOT}/modules/data/Event`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'user'
};
exports.conf = conf;

const help = {
    command: 'event',
    name: 'add-owner',
    category: 'Event Coordination',
    description: 'Add an owner to a scheduled event (lfg)',
    usage: 'event|lfg add-owner [<event-id>] <guardian>',
    minArgs: 1,
    maxArgs: 2
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    client.deleteLater(message);
    
    //
    // Todo - clean this whole thing up
    //
    
    const ufid = args[0];
    let event = await Event.get({ufid: ufid, unique: true});
    
    if (event) {
        args.shift();
    } else {
        event = await Event.get({channelId: message.channel.id, unique: true});
        if (!event) {
            client.sendAndDelete(`Cannot find event for this channel`, message.channel);
            message.channel.send();
            return;
        }
    }
    
    const isMention = /^<@![\d]{18,20}>$/.test(args[0]);
    
    if (!isMention) {
        client.sendAndDelete(`Show usage statement, invalid user`, message.channel);
        return;
    }
    
    const newOwnerId = args[0].match(/[\d]{18,20}/)[0];
    const discordUser = await message.mentions.users.get(newOwnerId);
    
    if (!discordUser) {
        client.sendAndDelete(`Mention must be a user`, message.channel);
        return;
    }
    
    const ownerIds = event.ownerIds;
    if (ownerIds.includes(newOwnerId)) {
        client.sendAndDelete(`Already an owner`, message.channel);
        return;
    }
    
    //
    // TODO - Add a nice message that the owner was added
    //
    
    ownerIds.push(newOwnerId);
    event.ownerIds = ownerIds;
    await event.update();
    
    event.updateEventMessages();
};
exports.run = run;
