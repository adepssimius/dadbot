
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance       = require(`${ROOT}/modules/alliance/Alliance`);
const Guild          = require(`${ROOT}/modules/alliance/Guild`);
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
    usage: 'alliance create <name> <alias>'
};
exports.help = help;

const run = async (message, args, level) => {
    if (args.length < 2) {
        message.reply(`Usage: ${client.config.prefix}${help.usage}`);
        return;
    }
    
    // Grab the symbol from the end and then merge the rest for the category name
    const alias = args.pop();
    const name = args.join(' ').replace(/^'(.+)'$/g, '$1').replace(/^'(.+)'$/g, '$1');
    
    // Validate the name
    if (name.length > 32) {
        message.channel.send('Alliance name cannot be more then 32 characaters in length');
        return;
    }
    
    // Validate the symbol
    if (alias.length > 4) {
        message.channel.send('Alliance alias cannot be more then 4 characters in length');
        return;
    }
    
    // See if this guild is already in an alliance
    const guilds = await Guild.get({guild_id: message.guild.id});
    
    if ( (guilds.length > 0) && (guilds[0].alliance_id != null) ) {
        message.channel.send('This discord is already part of an alliance');
        return;
    }
    
    // Put the data object together
    const data = {
        alliance_name: name,
        alliance_alias: alias,
        creator_id: message.author.id
    };
    
    // Attempt to create the alliance
    try {
        const alliance = await Alliance.create(data);
        const guild = await Guild.create({guild_id: message.guild.id, alliance_id: alliance.alliance_id});
        
        message.channel.send(`Alliance created with this discord as the first member`);
        
        client.logger.debug('Alliance:');
        client.logger.dump(alliance);
        
        client.logger.debug('Guild:');
        client.logger.dump(guild);
    
    } catch (error) {
        if (error instanceof DuplicateError) {
            client.replyWithError(error.message, message);
        } else {
            const label = `${data.category_name} [${data.symbol}]`;
            client.replyWithErrorAndDM(`Creation of alliance failed: ${label}`, message, error);
        }
    }
};
exports.run = run;
