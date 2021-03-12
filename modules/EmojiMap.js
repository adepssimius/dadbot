
// Determine our place in the world
const ROOT = '..';

// Load singletons
const client = require(`${ROOT}/modules/Client`); // eslint-disable-line no-unused-vars

class EmojiMap {
    static map        = new Map();
    static reverseMap = new Map();
    
    static set(key, value, nextKey = null) {
        const data = {value: value, nextKey: nextKey};
        const cleansedKey = ( typeof key == 'string' ? key.trim().toLowerCase() : key );
        
        EmojiMap.map.set(cleansedKey, data);
        EmojiMap.reverseMap.set(data.value, data);
    }
    
    static get(key) {
        const cleansedKey = ( typeof key == 'string' ? key.trim().toLowerCase() : key );
        const data = EmojiMap.map.get(cleansedKey);
        
        if (data) {
            return data.value;
        }
    }
    
    static reverseGet(value) {
        const data = EmojiMap.reverseMap.get(value);
        
        if (data) {
            return data.key;
        }
    }
    
    static next(keyOrValue) {
        let data;
        
        // Attempt to get the data from the reverse map (i.e. we have been passed a value / emoji)
        data = EmojiMap.reverseMap.get(keyOrValue);
        
        // If that failed, attempted to get the data from the regular map (i.e. we have been passed a key)
        if (!data) {
            const cleansedKey = ( typeof keyOrValue == 'string' ? keyOrValue.trim().toLowerCase() : keyOrValue );
            data = EmojiMap.map.get(cleansedKey);
        }
        
        if (data) {
            return EmojiMap.get(data.nextKey);
        }
    }
}

// Add some miscellaneous stuff

//const join  = client.emojis.cache.get('441040092203843584');
//const leave = client.emojis.cache.get('441040091696201731');
//const alt   = client.emojis.cache.get('441040092216426516');

//EmojiMap.set(':x:', '❌');
//EmojiMap.set(':+:', '');
//EmojiMap.set(':-:', '');
//EmojiMap.set(':?:', '');

// Add numbers with their emoji names
EmojiMap.set(':zero:',  '0️⃣', 1);
EmojiMap.set(':one:',   '1️⃣', 2);
EmojiMap.set(':two:',   '2️⃣', 3);
EmojiMap.set(':three:', '3️⃣', 4);
EmojiMap.set(':four:',  '4️⃣', 5);
EmojiMap.set(':five:',  '5️⃣', 6);
EmojiMap.set(':six:',   '6️⃣', 7);
EmojiMap.set(':seven:', '7️⃣', 8);
EmojiMap.set(':eight:', '8️⃣', 9);
EmojiMap.set(':nine:',  '9️⃣');

// Add numbers with their literal number
EmojiMap.set(0, '0️⃣', 1);
EmojiMap.set(1, '1️⃣', 2);
EmojiMap.set(2, '2️⃣', 3);
EmojiMap.set(3, '3️⃣', 4);
EmojiMap.set(4, '4️⃣', 5);
EmojiMap.set(5, '5️⃣', 6);
EmojiMap.set(6, '6️⃣', 7);
EmojiMap.set(7, '7️⃣', 8);
EmojiMap.set(8, '8️⃣', 9);
EmojiMap.set(9, '9️⃣');

// Add numbers with their literal number as a string
EmojiMap.set('0', '0️⃣', 1);
EmojiMap.set('1', '1️⃣', 2);
EmojiMap.set('2', '2️⃣', 3);
EmojiMap.set('3', '3️⃣', 4);
EmojiMap.set('4', '4️⃣', 5);
EmojiMap.set('5', '5️⃣', 6);
EmojiMap.set('6', '6️⃣', 7);
EmojiMap.set('7', '7️⃣', 8);
EmojiMap.set('8', '8️⃣', 9);
EmojiMap.set('9', '9️⃣');

// Add letters with their emoji name
EmojiMap.set(':regional_indicator_a:', '🇦', 'b');
EmojiMap.set(':regional_indicator_b:', '🇧', 'c');
EmojiMap.set(':regional_indicator_c:', '🇨', 'd');
EmojiMap.set(':regional_indicator_d:', '🇩', 'e');
EmojiMap.set(':regional_indicator_e:', '🇪', 'f');
EmojiMap.set(':regional_indicator_f:', '🇫', 'g');
EmojiMap.set(':regional_indicator_g:', '🇬', 'h');
EmojiMap.set(':regional_indicator_h:', '🇭', 'i');
EmojiMap.set(':regional_indicator_i:', '🇮', 'j');
EmojiMap.set(':regional_indicator_j:', '🇯', 'k');
EmojiMap.set(':regional_indicator_k:', '🇰', 'l');
EmojiMap.set(':regional_indicator_l:', '🇱', 'm');
EmojiMap.set(':regional_indicator_m:', '🇲', 'n');
EmojiMap.set(':regional_indicator_n:', '🇳', 'o');
EmojiMap.set(':regional_indicator_o:', '🇴', 'p');
EmojiMap.set(':regional_indicator_p:', '🇵', 'q');
EmojiMap.set(':regional_indicator_q:', '🇶', 'r');
EmojiMap.set(':regional_indicator_r:', '🇷', 's');
EmojiMap.set(':regional_indicator_s:', '🇸', 't');
EmojiMap.set(':regional_indicator_t:', '🇹', 'u');
EmojiMap.set(':regional_indicator_u:', '🇺', 'v');
EmojiMap.set(':regional_indicator_v:', '🇻', 'w');
EmojiMap.set(':regional_indicator_w:', '🇼', 'x');
EmojiMap.set(':regional_indicator_x:', '🇽', 'y');
EmojiMap.set(':regional_indicator_y:', '🇾', 'z');
EmojiMap.set(':regional_indicator_z:', '🇿');

// Add letters with their letter
EmojiMap.set('a', '🇦', 'b');
EmojiMap.set('b', '🇧', 'c');
EmojiMap.set('c', '🇨', 'd');
EmojiMap.set('d', '🇩', 'e');
EmojiMap.set('e', '🇪', 'f');
EmojiMap.set('f', '🇫', 'g');
EmojiMap.set('g', '🇬', 'h');
EmojiMap.set('h', '🇭', 'i');
EmojiMap.set('i', '🇮', 'j');
EmojiMap.set('j', '🇯', 'k');
EmojiMap.set('k', '🇰', 'l');
EmojiMap.set('l', '🇱', 'm');
EmojiMap.set('m', '🇲', 'n');
EmojiMap.set('n', '🇳', 'o');
EmojiMap.set('o', '🇴', 'p');
EmojiMap.set('p', '🇵', 'q');
EmojiMap.set('q', '🇶', 'r');
EmojiMap.set('r', '🇷', 's');
EmojiMap.set('s', '🇸', 't');
EmojiMap.set('t', '🇹', 'u');
EmojiMap.set('u', '🇺', 'v');
EmojiMap.set('v', '🇻', 'w');
EmojiMap.set('w', '🇼', 'x');
EmojiMap.set('x', '🇽', 'y');
EmojiMap.set('y', '🇾', 'z');
EmojiMap.set('z', '🇿');

// Finally export the result
module.exports = EmojiMap;
