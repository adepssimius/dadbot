
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel       = require(`${ROOT}/modules/BaseModel`);
const Snowflake       = require(`${ROOT}/modules/Snowflake`);
const Guardian        = require(`${ROOT}/modules/data/Guardian`);
const DuplicateError  = require(`${ROOT}/modules/error/DuplicateError`);
const ForeignKeyError = require(`${ROOT}/modules/error/ForeignKeyError`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class ActivityCategory extends BaseModel {
    static schema = this.parseSchema({
        tableName: 'activity_category',
        orderBy: 'name',
        fields: [
            { dbFieldName: 'id',          type: 'snowflake', nullable: false },
            { dbFieldName: 'name',        type: 'string',    nullable: false, length: 32 },
            { dbFieldName: 'symbol',      type: 'string',    nullable: false, length: 1 },
            { dbFieldName: 'alliance_id', type: 'snowflake', nullable: true,  refTableName: 'alliance' },
            { dbFieldName: 'creator_id',  type: 'snowflake', nullable: false, refTableName: 'guardian' }
        ]
    });
    
    constructor(data) {
        super(data);
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get title() {
        return `${this.name} [${this.symbol}]`;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    // No custom setters required
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static parseConditions(conditions) {
        // Check by name or symbol
        if (conditions.nameOrSymbol) {
            return (query) => {
                query.where('name', conditions.name)
                    .orWhere('symbol', conditions.symbol.toUpperCase());
            };
        }
        
        // Handle any special fields
        let parsedConditions = conditions;
        
        if (parsedConditions.symbol) {
            parsedConditions.symbol = parsedConditions.symbol.toUpperCase();
        }
        
        return parsedConditions;
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const activityCategory = await ActivityCategory.get({
            nameOrSymbol: true,
            name: this.name,
            symbol: this.symbol,
            unique: true
        });
        
        // Check if this is a duplicate activity category
        if (activityCategory) {
            throw new DuplicateError(`Existing category found with the same name or symbol: ${this.title}`);
        }
        
        // Make sure the creator is in the database
        if (await this.getCreator() == null) {
            this.creator = new Guardian({id: this.creatorId});
            await this.creator.create();
        }
        
        // Generate the id and attempt to insert the record into the database
        this.id = Snowflake.generate();
        await BaseModel.prototype.create.call(this);
    }
    
    async delete() {
        const Activity = require(`${ROOT}/modules/data/Activity`);
        const activities = await Activity.get({activityCategoryId: this.id});
        
        if (activities.length > 0) {
            throw new ForeignKeyError('Cowardly refusing to delete category while activities still exist');
        }
        
        // And attempt to delete it
        await BaseModel.prototype.delete.call(this);
    }
    
    // ************************************************************ //
    // * Instance Methods - Helper methods to get related objects * //
    // ************************************************************ //
    
    async getActivities() {
        const Activity = require(`${ROOT}/modules/data/Activity`);
        return await Activity.get({activityCategoryId: this.id});
    }
}

module.exports = ActivityCategory;
