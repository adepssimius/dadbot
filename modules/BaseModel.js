
// Load singletons
const client = require('./Client.js'); // eslint-disable-line no-unused-vars
const knex = require('./Database.js');

class BaseModel {
    static tableName = null;
    static orderBy   = 'created_at';
    
    constructor(data) {
        if (data == null) {
            throw new Error('data is unexpectedly null');
        }
        
		this.data = data;
    }
    
    // ************ //
    // * Getters  * //
    // ************ //
    
    get created_at() {
        return this.data.created_at;
    }
    
    get updated_at() {
        return this.data.updated_at;
    }
    
    // *********** //
    // * Setters * //
    // ********** //
    
    set created_at(value) {
        throw new Error('Cowardly refusing to change created_at!');
    }
    
    set updated_at(value) {
        this.data.updated_at = value;
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
    
    async delete(data) {
        return null;
    }
}

module.exports = BaseModel;
