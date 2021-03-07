
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class ChannelGroup extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'channel_group',
        orderBy: 'name',
        fields: [
            { dbFieldName: 'id', type: 'snowflake', nullable: false },
            { dbFieldName: 'type', type: 'string', length: 16, nullable: false },
            { dbFieldName: 'name', type: 'string', length: 32, nullable: false },
            { dbFieldName: 'alliance_id', type: 'snowflake', nullable: false },
            { dbFieldName: 'event_id', type: 'snowflake', nullable: true },
            { dbFieldName: 'creator_id', type: 'snowflake', nullable: false }
        ]
    });
    
    constructor(data) {
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
    
    // None yet!
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const channelGroups = await ChannelGroup.get({name: this.name, type: this.type, allianceId: this.allianceId});
        
        // Check if this is a duplicate channelgroup
        if (channelGroups.length > 0) {
            throw new DuplicateError(`There is already a channel group in this alliance of type ${this.type} called '${this.name}'`);
        }
        
        // Create the ID for this channel group and attempt to create it
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
}

module.exports = ChannelGroup;
