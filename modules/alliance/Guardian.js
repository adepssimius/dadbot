
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Guardian extends BaseModel {
    static tableName = 'guardian';
    static orderBy   = 'id';
    static fields    = ['id', 'username', 'timezone', 'private_event_default'];
    static fieldMap  = BaseModel.getFieldMap(Guardian.fields);
    
    constructor(data) {
        super(Guardian, data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return Guardian.tableName;
    }
    
    get username() {
        return this.data.username;
    }
    
    get timezone() {
        return this.data.timezone;
    }
    
    get privateEventDefault() {
        return this.data.private_event_default;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set timezone(value) {
        this.data.timezone = value;
    }
    
    set username(value) {
        this.data.username = value;
    }
    
    set privateEventDefault(value) {
        this.data.private_event_default = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseConditions(conditions) {
        return conditions;
    }
    
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
