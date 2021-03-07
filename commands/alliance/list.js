
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const Alliance = require(`${ROOT}/modules/data/Alliance`);

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
    command: 'alliance',
    name: 'list',
    category: 'Alliance Administration',
    description: 'List all alliances',
    usage: 'alliance list',
    minArgs: null,
    maxArgs: 0
};
exports.help = help;

const run = async (message, commandName, actionName, args) => { // eslint-disable-line no-unused-vars
    if (!client.argCountIsValid(help, args, message, commandName, actionName)) return;
    
    const alliances = await Alliance.get();
    
    let response = `Found ${alliances.length} `;
    if (alliances.length == 0 || alliances.length > 1) {
        response += 'alliances';
    } else {
        response += 'alliance';
    }
    
    if (alliances.length > 0) {
        const allianceListElements = [];
        for (let x = 0; x < alliances.length; x++) {
            const alliance = alliances[x];
            allianceListElements.push(alliance.title);
        }
        response += '```' + allianceListElements.join('\n') + '```';
    }
    
    message.channel.send(response);
};
exports.run = run;
