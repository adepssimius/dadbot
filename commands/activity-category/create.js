
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityCategory = require(`${ROOT}/modules/data/ActivityCategory`);
const DuplicateError   = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['add'],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'activity-category',
    name: 'create',
    category: 'Activity Category Administration',
    description: 'Command for creating activity categories',
    usage: 'activity-category create <name> [<symbol>]',
    minArgs: 1,
    maxArgs: null
};
exports.help = help;

//
// TODO - Update this for optionally choosing between creating a global or alliance visible category
//

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Grab the symbol from the end and then merge the rest for the category name
    let symbol = args.pop();
    let name;
    
    if (symbol.length == 1) {
        name = args.join(' ').replace(/^"(.+)"$/g, "$1").replace(/^'(.+)'$/g, "$1");
    } else {
        args.push(symbol);
        name = args.join(' ').replace(/^"(.+)"$/g, "$1").replace(/^'(.+)'$/g, "$1");
        symbol = name.substring(0,1);
    }

    // Validate the name
    if (name.length > 32) {
        message.channel.send('**ERROR:** Category name cannot be more then 32 characaters in length');
        return;
    }
    
    // Validate the symbol
    if (symbol.length > 1) {
        message.channel.send('**ERROR:** Category symbol must be a single character');
        return;
    }
    
    // Create the activity category object
    const activityCategory = new ActivityCategory({
        name: name,
        symbol: symbol,
        allianceId: null,
        creatorId: message.author.id
    });
    
    // Attempt to create the activity category
    try {
        await activityCategory.create();
        message.channel.send(`Activity category created: ${activityCategory.title}`);
        
        client.logger.debug('Activity Category:');
        client.logger.dump(activityCategory);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            client.replyWithErrorAndDM(`Creation of activity category failed: ${activityCategory.title}`, message, error);
        }
    }
};
exports.run = run;
