
let axios = require('axios');;

async function http_post(url, data) {
    let result =
        await axios({
            method: 'post',
            url: url,
            data: data
        });
    
    /*
    console.log('Result:');
    console.log(result);
    console.log();
    */
    
    return result;
}

exports.http_post = http_post;

async function http_patch(url, data) {
    let result =
        await axios({
            method: 'patch',
            url: url,
            data: data
        });
    
    /*
    console.log('Result:');
    console.log(result);
    console.log();
    */
    
    return result;
}

exports.http_patch = http_patch;

async function http_delete(url) {
    let result =
        await axios({
            method: 'delete',
            url: url
        });
    
    /*
    console.log('Result:');
    console.log(result);
    console.log();
    */
    
    return result;
}

exports.http_delete = http_delete;
