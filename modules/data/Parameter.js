
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel      = require(`${ROOT}/modules/BaseModel`);
const Snowflake      = require(`${ROOT}/modules/Snowflake`);
const Guardian       = require(`${ROOT}/modules/data/Guardian`);
const DuplicateError = require(`${ROOT}/modules/error/DuplicateError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class Parameter extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'parameter',
        orderBy: 'name',
        fields: [
            { dbFieldName: 'id',          type: 'snowflake', nullable: false },
            { dbFieldName: 'type',        type: 'string',    nullable: false, validValues: ['global', 'alliance', 'guild'] },
            { dbFieldName: 'alliance_id', type: 'snowflake', nullable: true,  refTableName: 'alliance' },
            { dbFieldName: 'guild_id',    type: 'snowflake', nullable: true,  refTableName: 'guild' },
            { dbFieldName: 'name',        type: 'string',    nullable: false, length: 32 },
            { dbFieldName: 'value',       type: 'string',    nullable: true,  length: 4096 },
            { dbFieldName: 'creator_id',  type: 'snowflake', nullable: false, refTableName: 'guardian' },
            { dbFieldName: 'updater_id',  type: 'snowflake', nullable: false, refTableName: 'guardian' }
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
    
    //static parseConditions(conditions) {
    //    return conditions;
    //}
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const duplicateQuery = {
            type: this.type,
            name: this.name,
            unique: true
        };
        
        if (this.allianceId) {
            duplicateQuery.allianceId = this.allianceId;
        }
        
        // Check if this is a duplicate alliance parameter
        const parameter = await Parameter.get(duplicateQuery);
        if (parameter) {
            throw new DuplicateError(`Duplicate parameter found with the same name: ${this.name}${(this.allianceId ? ` [alliance id = ${this.allianceId}]` : '')}`);
        }
        
        // Make sure the creator is in the database
        if (await this.getCreator() == null) {
            this.creator = new Guardian({id: this.creatorId});
            await this.creator.create();
        }
        
        // Make sure the updater is in the database
        if (await this.getUpdater() == null) {
            this.updater = new Guardian({id: this.updaterId});
            await this.updater.create();
        }
        
        // Generate the id and attempt to insert the record into the database
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
    
    async update() {
        // Make sure the updater is in the database
        if (await this.getUpdater() == null) {
            this.updater = new Guardian({id: this.updaterId});
            await this.updater.create();
        }
        
        // And attempt to update it
        await BaseModel.prototype.update.call(this);
    }
}

module.exports = Parameter;
