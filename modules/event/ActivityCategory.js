
// Determine our place in the world
const ROOT = '../..';

// Load our classes
const BaseModel       = require(`${ROOT}/modules/BaseModel`);
const DuplicateError  = require(`${ROOT}/modules/error/DuplicateError`);
const ForeignKeyError = require(`${ROOT}/modules/error/ForeignKeyError`);
const Snowflake       = require(`${ROOT}/modules/Snowflake`);

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class ActivityCategory extends BaseModel {
    static tableName = 'activity_category';
    static orderBy   = 'category_name';
    
    constructor(data) {
        if (data.categoryId == null) data.categoryId = Snowflake.generate();
        super(data);
        
        // Populate custom fields with the same database and object name
        if (data.symbol != null) this.symbol = data.symbol;
        
        // Populate custom fields with different database and object names
        if      (data.category_id != null) this.categoryId = data.category_id;
        else if (data.categoryId  != null) this.categoryId = data.categoryId;
        
        if      (data.category_name != null) this.categoryName = data.category_name;
        else if (data.categoryName  != null) this.categoryName = data.categoryName;
        
        if      (data.alliance_id != null) this.allianceId  = data.alliance_id;
        else if (data.allianceId  != null) this.allianceId  = data.allianceId;
        
        if      (data.creator_id != null) this.creatorId  = data.creator_id;
        else if (data.creatorId  != null) this.creatorId  = data.creatorId;
    }
    
    // *********** //
    // * Getters * //
    // *********** //
    
    get categoryId() {
        return this.data.category_id;
    }
    
    get categoryName() {
        return this.data.category_name;
    }
    
    get symbol() {
        return this.data.symbol;
    }
    
    get allianceId() {
        return this.data.alliance_id;
    }
    
    get creatorId() {
        return this.data.creator_id;
    }
    
    // *********** //
    // * Setters * //
    // *********** //
    
    set categoryId(value) {
        this.data.category_id = value;
    }
    
    set categoryName(value) {
        this.data.category_name = value;
    }
    
    set symbol(value) {
        this.data.symbol = value.toUpperCase();
    }
    
    set allianceId(value) {
        this.data.alliance_id = value;
    }
    
    set creatorId(value) {
        this.data.creator_id = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    // Standard get and create functions
    
    static async get(whereClause) {
        // Always search symbol in upper case
        if (whereClause != null && whereClause.symbol != null) {
            whereClause.symbol = whereClause.symbol.toUpperCase();
        }
        
        let result = [];
        let rows = await this._get(whereClause);
        
        for (let x = 0; x < rows.length; x++) {
            result.push(new ActivityCategory(rows[x]));
        }
        
        return result;
    }
    
    // Extra functions for this class
    
    static async getByNameOrSymbol(data) {
        return await ActivityCategory.get( (query) =>
            query.where('category_name', data.categoryName).orWhere('symbol', data.symbol.toUpperCase())
        );
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    async create() {
        const BaseModel = require(`${ROOT}/modules/BaseModel`);
        
        const activityCategories = await ActivityCategory.getByNameOrSymbol({
            categoryName: this.categoryName,
            symbol: this.symbol
        });
        
        if (activityCategories.length > 0) {
            throw new DuplicateError(`Existing category found with the same name or symbol: ${this.categoryName} [${this.symbol}]`);
        }
        
        await BaseModel.create.call(this, ActivityCategory.tableName, this.data);
    }
    
    async update() {
        this.updatedAt = knex.fn.now();
        
        let rowsChanged = await knex(ActivityCategory.tableName)
            .where('category_id', this.categoryId)
            .update(this.data)
            .then(result => {
                return result;
            });
        
        if (rowsChanged == 0) {
            throw new Error('Update did not change any records!');
        } else if (rowsChanged > 1) {
            throw new Error('Update changed more then one record!');
        }
    }
    
    async delete() {
        const Activity = require(`${ROOT}/modules/event/Activity`);
        const activities = await Activity.get({category_id: this.categoryId});
        
        if (activities.length > 0) {
            throw new ForeignKeyError('Cannot delete category while activities still exist');
        }
        return await ActivityCategory._delete({category_id: this.categoryId});
    }
}

module.exports = ActivityCategory;
