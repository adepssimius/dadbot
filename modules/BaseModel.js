
// Load singletons
const client = require('./Client.js'); // eslint-disable-line no-unused-vars
const knex = require('./Database.js');

class BaseModel {
    static tableName = null;
    
    constructor(data) {
        if (data == null) {
            throw new Error('data is unexpectedly null');
        }
        
		this.data = data;
    }
    
    // ********************* //
    // * Getters & Setters * //
    // ********************* //
    
    get created_at() {
        return this.data.created_at;
    }
    
    get updated_at() {
        return this.data.updated_at;
    }
    
    // ***************** //
    // * Class Methods * //
    // ***************** //
    
    static getTableName() {
        return this.tableName;
    }
    
    static get(conditions) {
        return null;
    }
    
    static async _get(conditions) {
        if (conditions != null) {
            return await knex(this.getTableName())
                .where(conditions)
                .then(function(rows) {
                    return rows;
                });
        } else {
            return await knex(this.getTableName())
                .then(function(rows) {
                    return rows;
                });
        }
    }
    
    static async create(data) {
        return null;
    }
    
    static async _create(data) {
        return await knex(this.getTableName())
            .insert(data)
            .then(function(result) {
                return result;
            });
    }
    
    static async _delete(conditions) {
        return await knex(this.getTableName())
            .where(conditions)
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
