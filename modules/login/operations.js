var MongoClient = require('mongodb').MongoClient;

exports.login = function (link) {
    // set the response header
    link.res.setHeader('Access-Control-Allow-Origin', link.headers.origin);

    if (link.req.session.login) {
        link.res.writeHead(400);
        link.res.end('Already logged in');
        return;
    }

    // get username and password
    var username = link.data.user;
    var password = link.data.pass;

    // connect to users db and validate user
    MongoClient.connect('mongodb://127.0.0.1:27017/scanner', function (err, db) {
        
        // handle error
        if (err) {
            link.res.writeHead(500);
            link.res.end(JSON.stringify(err));
            return;
        }

        var col = db.collection('users');
        col.findOne({'username': username, 'password': password}, function (err, doc) {

            // handle error
            if (err) {
                link.res.writeHead(500);
                link.res.end(JSON.stringify(err));
                return;
            }

            if (!doc) {
                // wrong username and/or password
                link.res.writeHead(500);
                link.res.end('Wrong username and/or password');
                return;
            }

            // get the user role (if it exists)
            var role = (doc.role) ? doc.role : null;

            // log the user in
            var login = {
                user: username
            }
            if (role) login.role = role;
            // set the session
            link.setSession({ login: login });

            // redirect to main page
            link.res.writeHead(302, {"location": "http://" + link.req.headers.host + "/"});
            link.res.end();
        });
        
    });
}

exports.logout = function (link) {
    // set the response header
    link.res.setHeader('Access-Control-Allow-Origin', link.headers.origin);
    console.log(link.req.session);
    if (!link.req.session.login) {
        link.res.writeHead(400);
        link.res.end('User not logged in');
        return;
    }

    // delete session
    delete link.req.session.login;

    // redirect to login page
    link.res.writeHead(302, {"location": "http://" + link.req.headers.host + "/login"});
    link.res.end();
}