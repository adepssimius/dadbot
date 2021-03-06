
// Determine our place in the world
const ROOT = '..';

// Load our classes
const Guardian = require(`${ROOT}/modules/alliance/Guardian`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

// Emitted whenever a user's details (e.g. username) are changed.
// Triggered by the Discord gateway events USER_UPDATE, GUILD_MEMBER_UPDATE, and PRESENCE_UPDATE.

module.exports = async (oldUser, newUser) => {
    client.logger.debug('Old User');
    client.logger.dump(oldUser);
    
    client.logger.debug('New User');
    client.logger.dump(oldUser);
    
    const guardian = await Guardian.get({id: newUser.id, unique: true});
    if (guardian && newUser.username != guardian.username) {
        guardian.username = newUser.username;
        await guardian.update();
    }
};
