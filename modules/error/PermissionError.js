
// Determine our place in the world
const ROOT = '../..';

class PermissionError extends Error {
    constructor(message){
        super();
        this.message = message;
    }
}

module.exports = PermissionError;
