var https = require("https"),
    fs = require("fs"),
    buffer = require("buffer"),
    bz = require("bz"),
    crypto = require("crypto"),
    config = require("./config.js"),
    keys = require("./keys.js");

var country = config.country,
    limit = config.limit,
    appName = keys.appName,
    apiKey = keys.apiKey;

var bugzilla = bz.createClient();
var offset = 0;
var emails = [],
    userData = [],
    mozillians = [];

var totalUsers = 0,
    completedUsers = 0;    

function constructPath() {
    return "/api/v1/users/?app_name=" + appName +
           "&app_key=" + apiKey +
           "&country=" + country +
           "&limit=" + limit +
           "&offset=" + offset +
           "&format=json";
}

function createMD5(email) {
    return crypto.createHash("md5").update(email).digest("hex");
}

var options = {
    hostname: "mozillians.org",
    path: constructPath()
}

function loadUsers() {
    fs.readFile("users.json", function(err, data) {
        if(err)
            errorHandler(err);
        var userFile = eval(data.toString());
        for (var i = 0; i < userFile.length; i++) {
            createUser({ full_name: userFile[i][0],
                         ircname: userFile[i][0],
                         email: userFile[i][1],
                         git: userFile[i][2],
                         level: userFile[i][3] }, false, false);
        }
        makeRequest();
    });
}

function errorHandler() {
    console.log(e);
}

function saveFile() {
    fs.writeFile('stats.json', JSON.stringify(userData), function(err) {
        if (err)
            errorHandler(err);
        console.log("stats.json created.");
    });
}

function maybeSave(obj, pending, save) {
    if (pending == 0) {
        completedUsers++;
        console.log("Completed Bugzilla requests for", obj.name, "(" + completedUsers + "/" + totalUsers + ")");
        if (obj.bugzilla.assigned != 0) {
            userData.push(obj);
        }
        if (completedUsers == totalUsers && save)
            saveFile();
    }
}

function createUser(userObj, private, save) {
    if(emails.indexOf(userObj.email) != -1)
        return;

    totalUsers++;
    var obj = {};
    var email = userObj.email;
    var pending = 0;
    if (private)
        obj.email = "";
    else
        obj.email = email;
    obj.gravatar = createMD5(email);
    obj.name = userObj.ircname || userObj.full_name;
    obj.bugzilla = {};
    obj.components = {};
    obj.level = userObj.level || 0;

    pending++;
    // Count fixed
    bugzilla.countBugs({
        "field0-0-0": "attachment.is_patch",
        "type0-0-0": "equals",
        "value0-0-0": 1,
        "field0-1-0": "flagtypes.name",
        "type0-1-0": "contains",
        "value0-1-0": "+",
        email1: email,
        email1_assigned_to: 1,
        status: ['RESOLVED', 'VERIFIED'],
        resolution: ['FIXED']
    }, function(error, fixed) {
        if (error) {
            errorHandler(error);
            return;
        }
        obj.bugzilla.fixed = fixed;
        pending--;
        maybeSave(obj, pending, save);
    });

    pending++;
    // Count assigned
    bugzilla.countBugs({
        email1: email,
        email1_assigned_to: 1
    }, function(error, assigned) {
        if (error) {
            errorHandler(error);
            return;
        }
        obj.bugzilla.assigned = assigned;
        pending--;
        maybeSave(obj, pending, save);
    });

    pending++;
    // Calculate Component
    bugzilla.countBugsX({
        x_axis_field: "product",
        y_axis_field: "component",
        "field0-0-0": "attachment.is_patch",
        "type0-0-0": "equals",
        "value0-0-0": 1,
        "field0-1-0": "flagtypes.name",
        "type0-1-0": "contains",
        "value0-1-0": "+",
        email1: email,
        email1_assigned_to: 1,
        status: ['RESOLVED', 'VERIFIED'],
        resolution: ['FIXED']
    }, function(error, components) {
        if (error) {
            errorHandler(error);
            return;
        }
        var data = [];
        if (components && components.data && components.data.length) {
            data = data.concat.apply(data, components.data);
            for (var i = 0; i < data.length; i++) {
                if (components.data[i/components.x_labels.length|0][i%components.x_labels.length] != 0)
                    obj.components[((components.x_labels[i%components.x_labels.length] || "") + " :: " +
                                    (components.y_labels[i/components.x_labels.length|0] || ""))
                                    .replace(/(^ :: | :: $)/g, "")] = components.data[i/components.x_labels.length|0][i%components.x_labels.length];
            }
        }
        pending--;
        maybeSave(obj, pending, save);
    });
    emails.push(email);
}

function processMozillians(data) {
    for( var i = 0; i < data.length; i++) {
        createUser(data[i], true, true);
    }
}

function makeRequest() {
    var data = "";
    var req = https.request(options, function(res) {
        res.on("data", function(d) {
            data += d.toString();
        });
        res.on("end", function() {
            console.log("Completed request to Mozillians API ...");
            var tmp = JSON.parse(data).objects;
            mozillians = mozillians.concat(tmp);
            if (tmp.length == limit) {
                offset += limit;
                options.path = constructPath();
                makeRequest();
            } else
                processMozillians(mozillians);
        });
    });
    req.end();
    req.on("error", errorHandler);
}

loadUsers();
