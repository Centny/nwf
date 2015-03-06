// Dependencies
var fs = require('fs');
var url = require('url');
var http = require('http');
var crypto = require('crypto');

function dl_g_v(furl, path, cback) {
    var file = fs.createWriteStream(path);
    http.get(url.parse(furl), function(res) {
        res.on('data', function(data) {
            file.write(data);
        }).on('end', function() {
            file.end();
            cback(path);
        });
    });
}

function dl_g(furl, dir, cback) {
    var fname = url.parse(furl).pathname.split('/').pop();
    return dl_g_v(furl, dir + "/" + fname, cback);
}

function SHA1(fpath, cback) {
    var shasum = crypto.createHash('sha1');
    var s = fs.ReadStream(fpath);
    s.on('data', function(d) {
        shasum.update(d);
    });
    s.on('end', function() {
        cback(shasum.digest('hex'));
    });
}

module.exports = {};
module.exports.SHA1 = SHA1;
module.exports.dl = dl_g;
module.exports.dl_g = dl_g;
module.exports.dl_g_v = dl_g_v;