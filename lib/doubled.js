exports.calculate = function (num) {
    if (typeof num === 'number') {
        return num * 2;
    }
    else {
        throw new Error('Expected a number');
    }
};