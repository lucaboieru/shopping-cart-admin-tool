var URL = 'http://127.0.0.1:9016'
var ACTIVE_TAB;

$(document).ready(function () {

    // navigation
    selectItem($('.tabSel').first());
    $('.tabSel').on('click', function () {
        selectItem($(this));
    });

    // clear log
    $('.clearBtn').on('click', function () {
        $('.logContent').html('').addClass('hided');
    });

    // logout
    $('.logout').on('click', function () {
        makeAjaxRequest({
            operation: '/@/login/logout'
        }, function (err, data) {

            if (err) {
                $(".status").html("<span class='glyphicon glyphicon-remove'></span> " + err).addClass("status-error").fadeIn(500);
            } else {
                $(".status").html("<span class='glyphicon glyphicon-ok'></span> You have been logged out.").fadeIn(500);
            }

            setTimeout(function () {
                $(".status").fadeOut(500);
            }, 5000);
        });
    })

    // update request
    $(".update").on('click', function () {
        var app = $(this).attr("app");
        var log = $(ACTIVE_TAB).find('.log').attr('log');
        makeAjaxRequest({
            operation: '/@/management/update',
            data: {
                app: app,
                log: log
            }
        }, function (err, data) {

            if (err) {
                $(".status").html("<span class='glyphicon glyphicon-remove'></span> " + err).addClass("status-error").fadeIn(500);
            } else {
                $(".status").html("<span class='glyphicon glyphicon-ok'></span> Your app has been updated.").fadeIn(500);
            }

            checkAppStatus(app);

            setTimeout(function () {
                $(".status").fadeOut(500);
            }, 5000);
        });
    });

    // start request
    $(".start").on('click', function () {
        var app = $(this).attr("app");
        makeAjaxRequest({
            operation: '/@/management/start',
            data: {
                app: app
            }
        }, function (err, data) {

            if (err) {
                $(".status").html("<span class='glyphicon glyphicon-remove'></span> " + err).addClass("status-error").fadeIn(500);

            } else {
                $(".status").html("<span class='glyphicon glyphicon-ok'></span> Your app has been started.").fadeIn(500);
            }

            checkAppStatus(app);

            setTimeout(function () {
                $(".status").fadeOut(500);
            }, 5000);
        });
    });

    // stop request
    $(".stop").on('click', function () {
        var app = $(this).attr("app");
        makeAjaxRequest({
            operation: '/@/management/stop',
            data: {
                app: app
            }
        }, function (err, data) {

            if (err) {
                $(".status").html("<span class='glyphicon glyphicon-remove'></span> " + err).addClass("status-error").fadeIn(500);
            } else {
                $(".status").html("<span class='glyphicon glyphicon-ok'></span> Your app has been stopped.").fadeIn(500);
            }

            checkAppStatus(app);

            setTimeout(function () {
                $(".status").fadeOut(500);
            }, 5000);
        });
    });
});

function selectItem ($item) {

    // hide all tabs and active class
    $('.tab').addClass('hided');
    $('.tabSel').parent().removeClass('active');

    // select the item
    $('#' + $item.attr('data-action')).removeClass('hided');
    ACTIVE_TAB = $('#' + $item.attr('data-action'));
    $('.logContent').addClass('hided');
    $item.parent().addClass('active');


    // get the logs for the selected item
    getLogs($item.attr('log'));

    // check application status
    checkAppStatus($item.attr('data-app'));
}

function getLogs (item) {

    if (!item) { return; }

    // make the request for the logs
    makeAjaxRequest({
        operation: '/@/management/getLogs',
        data: {
            log: item
        }
    }, function (err, data) {
        
        if (err) { return; }

        // get the data object
        var docs = jQuery.parseJSON(data);

        if (!docs.length) { return; }

        var $list = $('.log[log=' + item + '] ul');
        $list.html('');

        // append the files
        for (var i in docs) {
            var el = '<li class="file mb-xs" data-id="' + docs[i]._id + '">';
            el += '<div class="file-group">' + docs[i].filename + '</div>';
            el += '</li>';

            $list.append(el);
        }

        // add click handler
        $('.file', $list).on('click', function () {

            var itemId = $(this).attr('data-id');
            
            // make the request for the log
            makeAjaxRequest({
                operation: '/@/management/getLog',
                data: {
                    id: itemId
                }
            }, function (err, data) {
                
                if (err) {
                    $('.logContent', ACTIVE_TAB).html(err).removeClass('hided');
                    return;
                }
                showLog(data);
            });
        });
    });
}

function showLog (data) {

    if (!data) { return; }

    var log = jQuery.parseJSON(data);

    // clear the log container
    $('.logContent', ACTIVE_TAB).html('');

    for (var i = 0; i < log.length; ++i) {
        if (log[i].indexOf('LOG') != -1) {
            var el = '<p log-type="LOG">'+ log[i] + '</p>';
        } else {
            var el = '<p log-type="ERROR" class="error">'+ log[i] + '</p>';
        }

        // add the data to the container
        $('.logContent', ACTIVE_TAB).append(el);
    }

    // add the data to the container
    $('.logContent', ACTIVE_TAB).removeClass('hided');
}

function checkAppStatus (app) {
    makeAjaxRequest({
        operation: '/@/management/checkAppStatus',
        data: {
            app: app
        }
    }, function (err, data) {
        if (err) { return; }

        if (data === "running") {
            $(".start[app=" + app + "]").attr("disabled", "disabled");
            $(".stop[app=" + app + "]").removeAttr("disabled");
        } else {
            $(".stop[app=" + app + "]").attr("disabled", "disabled");
            $(".start[app=" + app + "]").removeAttr("disabled");
        }
    });
}

function makeAjaxRequest (ajaxObj, callback) {

    $.ajax({
        url: URL + ajaxObj.operation,
        type: "POST",
        data: ajaxObj.data,
        crossDomain: true,
        error: function(jqXHR, exception) {
            if (jqXHR.status === 0) {
                callback('Not connect. Verify Network.' + jqXHR.responseText);
            } else if (jqXHR.status == 404) {
                callback('Requested page not found. [404].' + jqXHR.responseText);
            } else if (jqXHR.status == 500) {
                callback('Internal Server Error [500].' + jqXHR.responseText);
            } else if (exception === 'parsererror') {
                callback('Requested JSON parse failed.');
            } else if (exception === 'timeout') {
                callback('Time out error.');
            } else if (exception === 'abort') {
                callback('Ajax request aborted.');
            } else {
                callback('Uncaught Error.\n' + jqXHR.responseText);
            }
        },
        success: function (data) {
            callback(null, data);
        }
    });
}