
// Determine our place in the world
const ROOT = '../..';

class ForeignKeyError extends Error {
    constructor(message){
        super();
        this.message = message;
    }
}

module.exports = ForeignKeyError;
