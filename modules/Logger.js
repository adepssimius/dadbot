
const chalk = require('chalk');
const moment = require('moment');

exports.log = (content, type = "log") => {
    const timestamp  = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]:`;
    let colorfulType;
    
    switch (type) {
        case "log"   : colorfulType = `${chalk.bgBlue         (type.toUpperCase()) }`; break;
        case "warn"  : colorfulType = `${chalk.black.bgYellow (type.toUpperCase()) }`; break;
        case "error" : colorfulType = `${chalk.bgRed          (type.toUpperCase()) }`; break;
        case "debug" : colorfulType = `${chalk.green          (type.toUpperCase()) }`; break;
        case "cmd"   : colorfulType = `${chalk.black.bgWhite  (type.toUpperCase()) }`; break;
        case "ready" : colorfulType = `${chalk.black.bgGreen  (type.toUpperCase()) }`; break;
        default:
            throw new TypeError('Logger type must be either warn, debug, log, ready, cmd or error.');
    }
    
    return console.log(`${timestamp} ${colorfulType} ${content}`);
};

exports.error = (...args) => this.log(...args, "error");
exports.warn  = (...args) => this.log(...args, "warn" );
exports.debug = (...args) => this.log(...args, "debug");
exports.cmd   = (...args) => this.log(...args, "cmd"  );
