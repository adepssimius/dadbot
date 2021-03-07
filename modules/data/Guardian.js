
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Guardian extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'guardian',
        orderBy: 'username',
        fields: [
            { dbFieldName: 'id', type: 'snowflake', nullable: false },
            { dbFieldName: 'username', type: 'string', length: 32, nullable: false },
            { dbFieldName: 'timezone', type: 'string', length: 32, nullable: true },
            { dbFieldName: 'private_event_default', type: 'boolean', nullable: false, default: false }
        ]
    });
    
    constructor(data) {
        // Set default values
        //if (data) {
        //    if (!data.privateEventDefault) data.privateEventDefault = false;
        //}
        
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    // No custom getters required
    
    // *********** //
    // * Setters * //
    // *********** //
    
    // No custom setters required
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    //static parseConditions(conditions) {
    //    return conditions;
    //}
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const guardian = await Guardian.get({id: this.id, unique: true});
        
        // Check if this is a guardian is already in the system
        if (guardian) {
            throw new DuplicateError(`Guardian already found within id: ${this.id}`);
        }
        
        // If need be, retrieve the username
        if (!this.username) {
            const user = await client.users.fetch(this.id);
            if (user) this.username = user.username;
        }
        
        // Attempt to create it
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = Guardian;
