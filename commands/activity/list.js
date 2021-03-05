
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const ActivityCategory = require(`${ROOT}/modules/event/ActivityCategory`);

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
    command: 'activity',
    name: 'list',
    category: 'Activity Administration',
    description: 'List all activities',
    usage: 'activity list [<category-name|symbol>]',
    minArgs: null,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    let activityCategories;
    
    if (args.length == 0) {
        activityCategories = await ActivityCategory.get();
    } else {
        const value = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
        activityCategories = await ActivityCategory.get({nameOrSymbol: true,  name: value, symbol: value});
        
        if (activityCategories.length == 0) {
            message.channel.send(`Could not activity category name or symbol: ${value}`);
            return;
        }
    }
    
    let responses = [];
    
    for (let c = 0; c < activityCategories.length; c++) {
        const activityCategory = activityCategories[c];
        let activities = await activityCategory.getActivities();
        
        let response = `__**${activityCategory.name}**__\n`;
        response += `Found ${activities.length} `;
        
        if (activities.length == 0 || activities.length > 1) {
            response += 'activities';
        } else {
            response += 'activity';
        }
        
        const activityBlurbs = [];
        for (let a = 0; a < activities.length; a++) {
            const activity = activities[a];
            const activityAliases = await activity.getActivityAliases();
            let   activityAliasesBlurb = 'No Aliases Yet';
            
            if (activityAliases.length > 0) {
                const activityAliasNames = [];
                for (let x = 0; x < activityAliases.length; x++) {
                    activityAliasNames.push(activityAliases[x].alias);
                }
                activityAliasesBlurb = activityAliasNames.join(', ');
            } 
            activityBlurbs.push(`${activity.name} [${activityAliasesBlurb}]`);
        }
        
        if (activityBlurbs.length > 0) {
            response += '\n```' + activityBlurbs.join('\n') + '```';
        }
        
        responses.push(response);
    }
    
    for (let r = 0; r < responses.length; r++) {
        message.channel.send(responses[r]);
    }
};
exports.run = run;
