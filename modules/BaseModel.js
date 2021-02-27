
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars
const knex   = require(`${ROOT}/modules/Database`);

class BaseModel {
    static tableName = null;
    static orderBy   = 'created_at';
    
    data = {};
    
    constructor(data) {
        // Populate id for all classes pretty much
        if (data.id != null) this.id = data.id;
        
        // Populate standard fields with different database and object names
        if      (data.created_at != null) this.createdAt = data.created_at;
        else if (data.createdAt  != null) this.createdAt = data.createdAt;
        
        if      (data.updated_at != null) this.updatedAt = data.update_at;
        else if (data.updatedAt  != null) this.updatedAt = data.updatedAt;
        
        // Check if this is a new object
        if ( (this.createdAt == null) && (this.updatedAt == null)) {
            const timestamp = knex.fn.now();
            this.createdAt = timestamp;
            this.updatedAt = timestamp;
        }
    }
    
    // ************ //
    // * Getters  * //
    // ************ //
    
    get id() {
        return this.data.id;
    }
    
    get createdAt() {
        return this.data.created_at;
    }
    
    get updatedAt() {
        return this.data.updated_at;
    }
    
    // Remove these when all data classes have been converted
    get created_at() {
        return this.createdAt;
    }
    
    get updated_at() {
        return this.updatedAt;
    }
    
    // *********** //
    // * Setters * //
    // ********** //
    
    set id(value) {
        this.data.id = value;
    }
    
    set createdAt(value) {
        if (this.data.created_at != null) {
            throw new Error('Cowardly refusing to change createdAt!');
        }
        this.data.created_at = value;
    }
    
    set updatedAt(value) {
        this.data.updated_at = value;
    }
    
    // Remove these when all data classes have been converted
    set created_at(value) {
        this.createdAt = value;
    }
    
    set updated_at(value) {
        this.updatedAt = value;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static get(conditions) {
        return null;
    }
    
    static async _get(conditions) {
        if (conditions != null) {
            return await knex(this.tableName)
                .where(conditions)
                .orderBy(this.orderBy)
                .then(function(rows) {
                    return rows;
                });
        } else {
            return await knex(this.tableName)
                .orderBy(this.orderBy)
                .then(function(rows) {
                    return rows;
                });
        }
    }
    
    static async create(data) {
        return null;
    }
    
    static async _create(data) {
        const timestamp = knex.fn.now();
        data.created_at = timestamp;
        data.updated_at = timestamp;
        
        return await knex(this.tableName)
            .insert(data)
            .then(function(result) {
                return result;
            });
    }
    
    static async _delete(query) {
        return await knex(this.tableName)
            .where(query)
            .delete()
            .then(result => {
                return result;
            });
    }
    
    // ******************** //
    // * Instance Methods * //
    // ******************** //
    
    static async create(tableName, data) {
        const timestamp = knex.fn.now();
        data.created_at = timestamp;
        data.updated_at = timestamp;
        
        return await knex(tableName)
            .insert(data)
            .then(function(result) {
                return result;
            });
    }
    
    async delete(data) {
        return null;
    }
}

module.exports = BaseModel;
