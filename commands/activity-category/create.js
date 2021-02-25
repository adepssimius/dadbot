
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);
const DuplicateError   = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'admin'
};
exports.conf = conf;

const help = {
    command: 'activity-category',
    name: 'create',
    category: 'Activity Category Administration',
    description: 'Command for creating activity categories',
    usage: 'activity-category create <name> [<symbol>]'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length < 1) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
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
    
    
    // Put the data object together
    const data = {
        category_name: name,
        symbol: symbol,
        creator_id: message.author.id
    };
    
    // Attempt to reate the activity category
    try {
        const activityCategory = await ActivityCategory.create(data);
        message.channel.send(`Activity category created`);
        
        client.logger.debug('Activity Category:');
        client.logger.dump(activityCategory);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            const label = `${data.category_name} [${data.symbol}]`;
            client.replyWithErrorAndDM(`Creation of activity category failed: ${label}`, message, error);
        }
    }
};
exports.run = run;
