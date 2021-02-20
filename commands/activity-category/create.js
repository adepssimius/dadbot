
// Load our classes
const ActivityCategory = require('../../modules/event/ActivityCategory');
const DuplicateError   = require('../../modules/error/DuplicateError');

// Load singletons
const client = require('../../modules/Client.js'); // eslint-disable-line no-unused-vars

const conf = {
    enabled: true,
    guildOnly: false,
    aliases: [],
    permLevel: 'User'
};
exports.conf = conf;

const help = {
    command: 'activity-category',
    name: 'create',
    category: 'Activity Category Administration',
    description: '',
    usage: 'activity-category create <abbreviation> <name>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length < 2) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    const abbr = args.shift();
    const name = args.join(' ');
    
    const data = {
        category_name: name,
        category_abbr: abbr,
        creator_id: message.author.id
    };
    
    try {
        const activityCategory = await ActivityCategory.create(data);
        message.channel.send(`Activity category created`);
        
        client.logger.debug('Activity Category:');
        client.logger.dump(activityCategory);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            const label = `${data.category_name} [${data.category_abbr}]`;
            client.replyWithErrorAndDM(`Creation of activity category failed: ${label}`, message, error);
        }
    }
};
exports.run = run;
