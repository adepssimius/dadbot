
class DuplicateError extends Error {
    constructor(message){
        super();
        this.message = message;
    }
}

module.exports = DuplicateError;

