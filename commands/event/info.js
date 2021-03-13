
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
    permLevel: null
};
exports.conf = conf;

const help = {
    command: 'event',
    name: 'info',
    category: 'Event Administration',
    description: 'Show the details about an event',
    usage: 'event info <id>',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const value = args.join(' ');
    let event = await Event.get({id: value, unique: true});
    
    if (!event) {
        message.channel.send(`Could not find event: ${value}`);
        return;
    }
    
    message.channel.send(await event.getMessageContent());
};
exports.run = run;
