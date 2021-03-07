
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance       = require(`${ROOT}/modules/data/Alliance`);
const Guild          = require(`${ROOT}/modules/data/Guild`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

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
    command: 'alliance-category',
    name: 'create',
    category: 'Alliance Category Administration',
    description: 'Command for creating an alliance',
    usage: 'alliance create <name> <alias>',
    minArgs: 2,
    maxArgs: null
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    // Grab the symbol from the end and then merge the rest for the category name
    const shortName = args.pop();
    const name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    
    // Validate the name
    if (name.length > 32) {
        message.channel.send('Alliance name cannot be more then 32 characaters in length');
        return;
    }
    
    // Validate the short name
    if (shortName.length > 4) {
        message.channel.send('Alliance short name cannot be more then 4 characters in length');
        return;
    }
    
    // See if this guild is already in an alliance
    let guild = await Guild.get({id: message.guild.id, unique: true});
    
    if (guild && guild.allianceId != null) {
        message.channel.send('This clan discord is already part of an alliance');
        return;
    }
    
    // Create the alliance object
    const alliance = new Alliance({
        name: name,
        shortName: shortName,
        creatorId: message.author.id
    });
    
    // Attempt to create the alliance
    try {
        await alliance.create();
        
        // Join the alliance
        if (!guild) {
            guild = new Guild({
                id: message.guild.id,
                allianceId: alliance.id
            });
            await guild.create();
        } else {
            guild.allianceId = alliance.id;
            guild.update();
        }
        
        message.channel.send(`Alliance created with this clan discord as the first member`);
        
        client.logger.debug('Alliance:');
        client.logger.dump(alliance);
        
        client.logger.debug('Guild:');
        client.logger.dump(guild);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            const label = `${name} [${shortName}]`;
            client.replyWithErrorAndDM(`Creation of alliance failed: ${label}`, message, error);
        }
    }
};
exports.run = run;
