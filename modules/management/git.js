var https = require('https'),
    exec = require('child_process').exec,
    path = require('path'),
    util = require('util'),
    credentials = require('./credentials.json');

// Assembles the value of the Authorization header passed in the HTTPS request
// to GitHub.
function auth (user, pass) {
    return 'Basic ' + (new Buffer(user + ':' + pass)).toString('base64'); 
}

// Performs a git clone of the given URL into the given directory.
function git_clone (data, dest, callback) {

    // get repo info
    var repo = JSON.parse(data);

    if (!repo) { return callback ('no repo'); }
    var url = repo.clone_url;
    var name = repo.name;
    var dir = path.join(dest, name);

    // execute the clone command
    exec(util.format('git clone %s %s', url, dir), function (err, stdout, stderr) {

        // handle error
        if (err) {
            callback(err);
        } else {
            callback(null);

            if (stderr) {
                console.error(stderr.trim());
            }
        }
    });
}

exports.cloneToDir = function (app, dest, callback) {

    // check if credentials exist
    if (!credentials.username || !credentials.password) {   
        return callback ('Please provide credentials via credentials.json');
    }
    if (credentials.username === 'default') {
        return callback ('Please change git credentials from default')
    }

    // prepare the https request
    var user = credentials.username;
    var pass = credentials.password;

    var http_options = {
        host: 'api.github.com',
        headers: {
            'Authorization': auth(user, pass),
            'User-Agent': 'square-gmbh',
            'Access-Control-Allow-Origin': '*'
        },
        path: '/repos/square-gmbh/' + app
    };

    https.get(http_options, function (res) {
        var data = '';

        res.on('data', function (d) {
            data += d;
        });

        res.on('end', function () {

            git_clone(data, dest, function (err) {

                if (err) { return callback (err);}

                // repo has been cloned
                callback(null);
            });
        });
    }).on('error', function (e) {
        if (e) { console.error(e); }
    });
}

