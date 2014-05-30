var fs = require('fs');
var git = require('gift');
var exec = require('child_process').exec;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

exports.restart = function (link) {

    var app = "shopping-cart-server";

    exec("forever stop apps/" + app + "/server.js", function (err) {

        if (err) { console.log(err); }

        exec("rm -Rf apps/" + app, function (err) {

            if (err) { console.log(err); }

            git.clone("git@bitbucket.org:lucaboieru/" + app + ".git", "apps/" + app, function (err, repo) {
                if (err) { console.log(err); }

                exec("forever start apps/" + app + "/server.js", function (err) {

                    if (err) { console.log(err); }

                    link.res.writeHead(200, {'Content-Type': 'text/plain'});
                    link.res.end("App updated!");
                });
            });
        });
    });
}

exports.getLogs = function (link) {

    if (!link.data.log) {
        link.res.end();
        return;
    }

    var log = link.data.log;

    // connect to db
    MongoClient.connect('mongodb://127.0.0.1:27017/scanner', function (err, db) {
        
        if (err) {
            link.res.writeHead(500);
            link.res.end();
            return;
        }

        // get collection
        var col = db.collection('logs');

        // get the logs
        col.find({ 'log': log }).toArray(function (err, docs) {

            if (err) {
                link.res.writeHead(500);
                link.res.end();
                return;
            }
            // send response
            link.res.setHeader('Access-Control-Allow-Origin', link.headers.origin);
            link.res.end(JSON.stringify(docs));

            // close the connection
            db.close();
        });
    });
}

exports.getLog = function (link) {
    
    // set the response header
    link.res.setHeader('Access-Control-Allow-Origin', link.headers.origin);

    if (!link.data.id) {
        link.res.writeHead(500);
        link.res.end();
        return;
    }

    var itemId = link.data.id;

    // connect to db
    MongoClient.connect('mongodb://127.0.0.1:27017/scanner', function (err, db) {
        
        if (err) {
            link.res.writeHead(500);
            link.res.end();
            return;
        }

        // get collection
        var col = db.collection('logs');

        // get the logs
        col.findOne({ '_id': ObjectId(itemId) }, function (err, doc) {

            // handle error
            if (err) {
                link.res.writeHead(500);
                link.res.end();
                return;
            }
            if (!doc) {
                console.error('log not found');
                link.res.writeHead(500);
                link.res.end();
                return;
            }

            // get the file location
            var file = doc.location;

            // read the file
            fs.readFile(file, 'utf8', function (err, data) {

                if (err) {
                    console.log(err);
                    link.res.writeHead(500);
                    link.res.end();
                    return;
                }

                // send back the contents of the log
                link.res.end(JSON.stringify(data));
            });
        });
    });
}