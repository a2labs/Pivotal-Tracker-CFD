
var     e = require("./errors.js"),
     data = require("./data-helper.js"),
    mongo = require("./mongo-helper.js");

var PIVOTAL_TOKEN_COOKIE = "ptcfd_token";

// This is our "auth" check for pages behind the token
exports.hasToken = function (req, res, next) {
    if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
        req.session.token = req.cookies[PIVOTAL_TOKEN_COOKIE];
        pivotal.useToken(req.cookies[PIVOTAL_TOKEN_COOKIE]);
        next();
    } else if (req.xhr) {
        res.send(403, { error: "You will need to login before accessing this resource" });
    } else {
        res.redirect("/");
    }
};

exports.index = function(req, res, next) {
    if (req.cookies[PIVOTAL_TOKEN_COOKIE]) {
        res.redirect("/projects");
        return;
    }

    res.render('index', { title: "PT Cumulative Flow Diagram - Login", page: "login" });
};

exports.showHookText = function(req, res, next) {
    res.render('test-hook', { title: "PT Cumulative Flow Diagram - Test Hook", page: "test-hook" });
};

exports.getProjects = function(req, res, next) {
    console.log("getting projects for user token: ", req.body.token);
    if (!req.body.token || !req.body.token.length) {
        next(new e.BadRequestError("Please provide a valid Pivotal Tracker API token", 403));
        return;
    }

    // reset these values on new request
    req.session.token = req.body.token;
    req.session.projects = [];

    pivotal.useToken(req.body.token);
    
    data.getUserProjects(req, function(err, projects) {
        if (err) {
            if (err.code) {
                next(new e.BadRequestError(
                    ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
                    err.code
                ));
            } else {
                next(new Error(err.toString(), 500));
            }
            return;
        }

        req.session.projects = projects;

        res.writeHead(200, {"Content-Type": "application/json"});
        res.end(JSON.stringify({
            token: req.session.token,
            projects: projects
        }));
        return;
    });
};

exports.listProjects = function(req, res, next) {
    if (req.session.projects) {
        
        renderProjectsPage(res, next, req.session.projects);
        return;

    } else {
        // We don't have projects, so go get them
        // NOTE: the token must be present already (and in pivotal module)
        //       based on the "hasToken()" middleware used in the routing in app.js
        
        data.getUserProjects(req, function(err, projects) {
            if (err) {
                if (err.code) {
                    next(new e.BadRequestError(
                        ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
                        err.code
                    ));
                } else {
                    next(new Error(err.toString(), 500));
                }
                return;
            }

            req.session.projects = projects;
            renderProjectsPage(res, next, projects);
            return;
        });
    }
};

exports.viewProject = function(req, res, next) {
    var i, project = null;

    if (req.session.projects) {
        
        if (req.session.projects) {
            for (i in req.session.projects) {
                if (req.session.projects[i].id == req.params.id) {
                    project = req.session.projects[i];
                }
            }
        }
        
        renderProjectPage(res, next, project);
        return;

    } else {
        // NOTE: the token must be present already (and in pivotal module)
        //       based on the "hasToken()" middleware used in the routing in app.js
        
        data.getUserProjects(req, function(err, projects) {
            if (err) {
                if (err.code) {
                    next(new e.BadRequestError(
                        ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
                        err.code
                    ));
                } else {
                    next(new Error(err.toString(), 500));
                }
                return;
            }

            req.session.projects = projects;

            for (var i in req.session.projects) {
                if (req.session.projects[i].id == req.params.id) {
                    project = req.session.projects[i];
                }
            }

            renderProjectPage(res, next, project);
            return;
        });
    }
};

exports.editProject = function(req, res, next) {
    var i, project = null;

    if (req.session.projects) {
        if (req.session.projects) {
            for (i in req.session.projects) {
                if (req.session.projects[i].id == req.params.id) {
                    project = req.session.projects[i];
                }
            }
        }

        renderProjectEditPage(res, next, project);
        return;

    } else {
        // NOTE: the token must be present already (and in pivotal module)
        //       based on the "hasToken()" middleware used in the routing in app.js
        
        data.getUserProjects(req, function(err, projects) {
            if (err) {
                if (err.code) {
                    next(new e.BadRequestError(
                        ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
                        err.code
                    ));
                } else {
                    next(new Error(err.toString(), 500));
                }
                return;
            }

            req.session.projects = projects;

            for (var i in req.session.projects) {
                if (req.session.projects[i].id == req.params.id) {
                    project = req.session.projects[i];
                }
            }

            renderProjectEditPage(res, next, project);
            return;
        });
    }
};

exports.updateStats = function(req, res, next) {
    var i, project;

    if (req.session.projects) {
        if (req.session.projects) {
            for (i in req.session.projects) {
                if (req.session.projects[i].id == req.params.id) {
                    project = req.session.projects[i];
                }
            }
        }

        doStatsUpdate(res, next, project, req.body.stats);
        return;

    } else {
        // NOTE: the token must be present already (and in pivotal module)
        //       based on the "hasToken()" middleware used in the routing in app.js
        
        data.getUserProjects(req, function(err, projects) {
            if (err) {
                if (err.code) {
                    next(new e.BadRequestError(
                        ((err.code == 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
                        err.code
                    ));
                } else {
                    next(new Error(err.toString(), 500));
                }
                return;
            }

            req.session.projects = projects;

            for (var i in req.session.projects) {
                if (req.session.projects[i].id == req.params.id) {
                    project = req.session.projects[i];
                }
            }

            doStatsUpdate(res, next, project, req.body.stats);
            return;
        });
    }
};


exports.processActivityHook = function(req, res, next) {
    console.log("Handling activity web hook...");

    var intervalHandle,
         updateCount = 0,
        processCount = 0,
              errors = [],
            activity = req.body;

    if (!activity || !activity.id) {
        next(new e.BadRequestError("Invalid activity object provided to web hook"));
        return;
    }

    // if we don't have a PT_TOKEN, we'll need to use the system one
    // NOTE: we only do this for this action (not for the end user UI)
    if (!pivotal.token) {
        console.log("No token assigned yet, using system token: "+process.env["PT_TOKEN"]);
        pivotal.useToken(process.env["PT_TOKEN"]);
    }

    // get number of story updates first
    activity.stories.each(function() { updateCount++; });

    // now process each update
    activity.stories.each(function(storyUpdate) {
        console.log("processing story update activity ID: "+activity.id+" on story ID: "+storyUpdate.id);
        data.processStoryUpdate(activity, storyUpdate, req, function(err, data) {
            if (err) {
                console.error("ERROR processing story "+storyUpdate.id+": ", err.toString());
                errors.push(err.toString());
            }
            processCount++;
        });
    });

    // since processing is asynchronous we need to wait until all are finished
    // to send our response (and to check for any errors).
    intervalHandle = setInterval(function() {
        if (processCount >= updateCount) {
            clearInterval(intervalHandle);
            console.log("Done processing "+processCount+" story updates with "+errors.length+" errors");
            res.send({
                "message": "Activity XML received and processed",
                "errors": ((errors.length) ? errors : null)
            });
        }
    }, 300);
};


// ------------- Private helpers ------------- //

var renderProjectsPage = function(res, next, projects) {
    res.render('projects', {
        title: "PT Cumulative Flow Diagram - Projects",
        page: "projects",
        projects: projects
    });
};

var renderProjectPage = function(res, next, project) {
    if (!project || !project.id) {
        next(new e.BadRequestError("Sorry, but either that project does not exist in this system, or you do not have access to it!", 404));
        return;
    }

    data.getStatsForProject(project.id, function(err, stats) {

        if (err) {
            next(new Error(err.toString(), 500));
            return;
        }

        res.render('project', {
            title: "PT Cumulative Flow Diagram - "+project.name,
            page: "project",
            project: project,
            stats: JSON.stringify(stats)
        });
    });
};

var renderProjectEditPage = function(res, next, project) {
    if (!project || !project.id) {
        next(new e.BadRequestError("Sorry, but either that project does not exist in this system, or you do not have access to it!", 404));
        return;
    }

    authenticateOwner(function(err, owner) {
        if (err) { next(err); return; }

        res.render('edit', {
            title: "PT Cumulative Flow Diagram - Edit "+project.name,
            page: "edit-project",
            project: project
        });
    });
};

var doStatsUpdate = function(res, next, project, statsUpdate) {
    if (!project || !project.id) {
        next(new e.BadRequestError("Sorry, but either that project does not exist in this system, or you do not have access to it!", 404));
        return;
    }

    if (!statsUpdate || !statsUpdate.date || !statsUpdate.project) {
        next(new e.BadRequestError("Sorry, but that is not a valid stats update object!", 400));
        return;
    }

    statsUpdate.project = Number(statsUpdate.project);
    if (!statsUpdate.project || statsUpdate.project != project.id) {
        next(new e.BadRequestError("Sorry, but your stats update ID does not match your update URL!", 400));
        return;
    }

    if (!/^20[0-9]{2}\-(0[1-9]|1[0-2])\-(0[1-9]|[12][0-9]|3[01])$/.test(statsUpdate.date)) {
        next(new e.BadRequestError("Sorry, but that is not a valid stats date!", 400));
        return;
    }

    console.log("Stats document being saved by "+pivotal.token, statsUpdate);

    authenticateOwner(function(err, owner) {
        if (err) { next(err); return; }

        mongo.getOrCreateStats(
            project.id,
            statsUpdate.date,
            res,
            function(err, stats) {
                if (err) { next(err); return; }

                // merge in the stats updates
                for (var k in statsUpdate) {
                    if (k != "project" && 
                        k != "date" &&
                        statsUpdate.hasOwnProperty(k)) {
                        stats[k] = Number(statsUpdate[k]);
                    }
                }

                // Do the DB update
                mongo.connect(res, function(err, db) {
                    if (err) { next(err); return; }

                    mongo.getOrCreateCollection(db, "stats", function(err, coll) {
                        if (err) { next(err); return; }

                        // update the statistics for this date in our DB
                        coll.update({_id: stats._id}, stats, {safe: true}, function(err) {
                            if (err) { next(err); return; }
                            
                            console.log("Stats document update", stats);

                            res.writeHead(200, {"Content-Type": "application/json"});
                            res.end(JSON.stringify({ project: project, stats: stats }));
                        });
                    });
                });
            }
        );
    });
};

var authenticateOwner = function(cb) {

    // TODO: we need to figure out how we can do this...

    cb(null, {});


    // var username = "jordankasper";
    // var password = "";

    // console.log("Authenticating user ("+username+") for editing project "+req.params.id);
    
    // pivotal.getToken(username, password, function(err, user){
    //     if(err){
    //         next(new e.AuthError(
    //             ((err.code && err.code == 401) ? "Sorry, but your authentication failed, that may not be a valid Pivotal Tracker username and password!" : err.desc),
    //             (err.code || 401)
    //         ));
    //         return;
    //     }

    //     if (user.guid != pivotal.token) {
    //         next(new e.AuthError("Sorry, but that username doesn't match the token you are using!"));
    //         return;
    //     }

    //     pivotal.getMemberships(req.params.id, function(err, member) {
    //         if (err) {
    //             next(new e.AuthError(
    //                 ((err.code && err.code == 401) ? "Sorry, but your authentication failed, you may not be a member of this project!" : err.desc),
    //                 (err.code || 401)
    //             ));
    //             return;
    //         }

    //         console.log("got membership data: ", member);

    //     });
    // });

};
