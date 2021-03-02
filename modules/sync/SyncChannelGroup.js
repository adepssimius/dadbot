
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class SyncChannelGroup extends BaseModel {
    static tableName = 'channel_group';
    static orderBy   = 'name';
    static fields    = ['id', 'name', 'alliance_id'];
    static fieldMap  = BaseModel.getFieldMap(SyncChannelGroup.fields);
    
    constructor(data) {
        super(SyncChannelGroup, data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get tableName() {
        return SyncChannelGroup.tableName;
    }
    
    get name() {
        return this.data.name;
    }
    
    get allianceId() {
        return this.data.alliance_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set name(value) {
        this.data.name = value;
    }
    
    set allianceId(value) {
        this.data.alliance_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // None yet!
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const syncChannelGroups = await SyncChannelGroup.get({name: this.name, allianceId: this.allianceId});
        
        // Check if this is a duplicate group
        if (syncChannelGroups.length > 0) {
            throw new DuplicateError(`There is already a channel synchronization group in this alliance called '${this.name}'`);
        }
        
        // Create the ID for this group
        this.id = Snowflake.generate();
        
        // And attempt to create it
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = SyncChannelGroup;
