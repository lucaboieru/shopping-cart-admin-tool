var fs = require('fs');
var git = require('./git');
var exec = require('child_process').exec;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;


exports.update = function (link) {
    // set the response header
    link.res.setHeader('Access-Control-Allow-Origin', link.headers.origin);

    var app = link.data.app;
    var log = link.data.log;

    exec("forever stop apps/" + app + "/server.js", function (err) {

        if (err) { console.log(err); }

        exec("rm -Rf apps/" + app, function (err) {

            // handle error
            if (err) { 
                console.log(err);
            }

            // clone the repo
            git.cloneToDir(app, "apps/", function (err) {

                if (err) {
                    link.res.writeHead(500);
                    link.res.end(JSON.stringify(err));
                    return;                
                }

                // all good
                link.res.writeHead(200, {'Content-Type': 'text/plain'});
                link.res.end("App updated!");
            });
        });
    });

    // delete logs
    // connect to db
    MongoClient.connect('mongodb://127.0.0.1:27017/scanner', function (err, db) {
        
        if (err) {
            link.res.writeHead(500);
            link.res.end(JSON.stringify(err));
            return;
        }

        var collection = db.collection('logs');
        collection.remove({ "log": log }, function (err) {

            if (err) {
                link.res.writeHead(500);
                link.res.end(JSON.stringify(err));
                return;
            }
        });
    });
}

exports.start = function (link) {
    var app = link.data.app;

    exec("forever start apps/" + app + "/server.js", function (err) {
        if (err) { console.log(err); }

        link.res.setHeader('Access-Control-Allow-Origin', link.headers.origin);
        link.res.writeHead(200, {'Content-Type': 'text/plain'});
        link.res.end("App started!");
    });
}

exports.stop = function (link) {
    var app = link.data.app;

    exec("forever stop apps/" + app + "/server.js", function (err) {
        if (err) { console.log(err); }

        link.res.setHeader('Access-Control-Allow-Origin', link.headers.origin);
        link.res.writeHead(200, {'Content-Type': 'text/plain'});
        link.res.end("App stopped!");
    });
}

exports.checkAppStatus = function (link) {
    var app = link.data.app;

    exec('forever list | grep "' + app + '"', function (err, data) {
        var resp;
        if (err) {
            resp = "stopped";
        } else {
            resp = "running";
        }

        link.res.setHeader('Access-Control-Allow-Origin', link.headers.origin);
        link.res.writeHead(200, {'Content-Type': 'text/plain'});
        link.res.end(resp);
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
                link.res.end(JSON.stringify(err));
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
                link.res.end(JSON.stringify(err));
                return;
            }
            if (!doc) {
                link.res.writeHead(500);
                link.res.end('log not found');
                return;
            }

            // get the file location
            var file = doc.location;

            // read the file
            fs.readFile(file, 'utf8', function (err, data) {

                if (err) {
                    link.res.writeHead(500);
                    link.res.end(JSON.stringify(err));
                    return;
                }

                // send back the contents of the log
                link.res.end(JSON.stringify(data.split('§')));
            });
        });
    });
}