
const chalk = require('chalk');
const moment = require('moment');

exports.log = (content, type = 'log') => {
    const timestamp  = `[${moment().format('YYYY-MM-DD HH:mm:ss')}]:`;
    let colorfulType;
    
    switch (type) {
        case 'log'   : colorfulType = `${chalk.bgBlue         (type.toUpperCase()) }`; break;
        case 'warn'  : colorfulType = `${chalk.black.bgYellow (type.toUpperCase()) }`; break;
        case 'error' : colorfulType = `${chalk.bgRed          (type.toUpperCase()) }`; break;
        case 'debug' : colorfulType = `${chalk.green          (type.toUpperCase()) }`; break;
        case 'cmd'   : colorfulType = `${chalk.black.bgWhite  (type.toUpperCase()) }`; break;
        case 'ready' : colorfulType = `${chalk.black.bgGreen  (type.toUpperCase()) }`; break;
        case 'dump'  : colorfulType = ''; break;
        case 'break' : colorfulType = ''; break;
        default:
            throw new TypeError('Logger type must be either log, warn, error, debug, cmd, ready, dump, or break.');
    }
    
    switch (type) {
        case 'dump'  : return console.log(content);
        case 'break' : return console.log();
        default      : return console.log(`${timestamp} ${colorfulType} ${content}`);
    }
};

exports.warn  = (...args) => this.log(...args, 'warn' );
exports.error = (...args) => this.log(...args, 'error');
exports.debug = (...args) => this.log(...args, 'debug');
exports.cmd   = (...args) => this.log(...args, 'cmd'  );
exports.ready = (...args) => this.log(...args, 'ready');
exports.dump  = (...args) => this.log(...args, 'dump' );
exports.break = (...args) => this.log(   null, 'break');
