var fs = require('fs');
var git = require('gift');
var exec = require('child_process').exec;

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

exports.log = function (link) {

	var app = "shopping-cart-server";

	fs.readFile("logs/" + app + ".log", "utf8", function (err, data) {
		if (err) { console.err(err); }
		link.res.writeHead(200, {'Content-Type': 'text/plain'});
		link.res.end(data);
	});
}