
// Determine our place in the world
const ROOT = '..';

class EmojiMap {
    static map = new Map();
    
    static set(name, value) {
        EmojiMap.map.set(typeof name == 'string' ? name.trim().toLowerCase() : name, value);
    }
    
    static get(name) {
        return EmojiMap.map.get(typeof name == 'string' ? name.trim().toLowerCase() : name);
    }
}

// Add some miscellaneous stuff
EmojiMap.map.set(':x:', '❌');

// Add numbers with their emoji names
EmojiMap.map.set(':zero:',  '0️⃣');
EmojiMap.map.set(':one:',   '1️⃣');
EmojiMap.map.set(':two:',   '2️⃣');
EmojiMap.map.set(':three:', '3️⃣');
EmojiMap.map.set(':four:',  '4️⃣');
EmojiMap.map.set(':five:',  '5️⃣');
EmojiMap.map.set(':six:',   '6️⃣');
EmojiMap.map.set(':seven:', '7️⃣');
EmojiMap.map.set(':eight:', '8️⃣');
EmojiMap.map.set(':nine:',  '9️⃣');

// Add numbers with their literal number
EmojiMap.map.set(0, '0️⃣');
EmojiMap.map.set(1, '1️⃣');
EmojiMap.map.set(2, '2️⃣');
EmojiMap.map.set(3, '3️⃣');
EmojiMap.map.set(4, '4️⃣');
EmojiMap.map.set(5, '5️⃣');
EmojiMap.map.set(6, '6️⃣');
EmojiMap.map.set(7, '7️⃣');
EmojiMap.map.set(8, '8️⃣');
EmojiMap.map.set(9, '9️⃣');

// Add numbers with their literal number as a string
EmojiMap.map.set('0', '0️⃣');
EmojiMap.map.set('1', '1️⃣');
EmojiMap.map.set('2', '2️⃣');
EmojiMap.map.set('3', '3️⃣');
EmojiMap.map.set('4', '4️⃣');
EmojiMap.map.set('5', '5️⃣');
EmojiMap.map.set('6', '6️⃣');
EmojiMap.map.set('7', '7️⃣');
EmojiMap.map.set('8', '8️⃣');
EmojiMap.map.set('9', '9️⃣');

// Add letters with their emoji name
EmojiMap.map.set(':regional_indicator_a:', '🇦');
EmojiMap.map.set(':regional_indicator_b:', '🇧');
EmojiMap.map.set(':regional_indicator_c:', '🇨');
EmojiMap.map.set(':regional_indicator_d:', '🇩');
EmojiMap.map.set(':regional_indicator_e:', '🇪');
EmojiMap.map.set(':regional_indicator_f:', '🇫');
EmojiMap.map.set(':regional_indicator_g:', '🇬');
EmojiMap.map.set(':regional_indicator_h:', '🇭');
EmojiMap.map.set(':regional_indicator_i:', '🇮');
EmojiMap.map.set(':regional_indicator_j:', '🇯');
EmojiMap.map.set(':regional_indicator_k:', '🇰');
EmojiMap.map.set(':regional_indicator_l:', '🇱');
EmojiMap.map.set(':regional_indicator_m:', '🇲');
EmojiMap.map.set(':regional_indicator_n:', '🇳');
EmojiMap.map.set(':regional_indicator_o:', '🇴');
EmojiMap.map.set(':regional_indicator_p:', '🇵');
EmojiMap.map.set(':regional_indicator_q:', '🇶');
EmojiMap.map.set(':regional_indicator_r:', '🇷');
EmojiMap.map.set(':regional_indicator_s:', '🇸');
EmojiMap.map.set(':regional_indicator_t:', '🇹');
EmojiMap.map.set(':regional_indicator_u:', '🇺');
EmojiMap.map.set(':regional_indicator_v:', '🇻');
EmojiMap.map.set(':regional_indicator_w:', '🇼');
EmojiMap.map.set(':regional_indicator_x:', '🇽');
EmojiMap.map.set(':regional_indicator_y:', '🇾');
EmojiMap.map.set(':regional_indicator_z:', '🇿');

// Add letters with their letter
EmojiMap.map.set('a', '🇦');
EmojiMap.map.set('b', '🇧');
EmojiMap.map.set('c', '🇨');
EmojiMap.map.set('d', '🇩');
EmojiMap.map.set('e', '🇪');
EmojiMap.map.set('f', '🇫');
EmojiMap.map.set('g', '🇬');
EmojiMap.map.set('h', '🇭');
EmojiMap.map.set('i', '🇮');
EmojiMap.map.set('j', '🇯');
EmojiMap.map.set('k', '🇰');
EmojiMap.map.set('l', '🇱');
EmojiMap.map.set('m', '🇲');
EmojiMap.map.set('n', '🇳');
EmojiMap.map.set('o', '🇴');
EmojiMap.map.set('p', '🇵');
EmojiMap.map.set('q', '🇶');
EmojiMap.map.set('r', '🇷');
EmojiMap.map.set('s', '🇸');
EmojiMap.map.set('t', '🇹');
EmojiMap.map.set('u', '🇺');
EmojiMap.map.set('v', '🇻');
EmojiMap.map.set('w', '🇼');
EmojiMap.map.set('x', '🇽');
EmojiMap.map.set('y', '🇾');
EmojiMap.map.set('z', '🇿');

// Finally export the result
module.exports = EmojiMap;
