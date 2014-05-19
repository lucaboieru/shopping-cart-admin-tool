var exec = require('child_process').exec;

exports.restart = function (link) {

	exec("./restart", function (err, data) {
		link.res.writeHead(200, {'Content-Type': 'text/plain'});
		link.res.end(data);
	});
}