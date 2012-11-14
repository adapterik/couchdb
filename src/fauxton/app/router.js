define([
  // Application.
  "app",

  // Initialize application
  "initialize",

  // Modules
  "modules/fauxton",
  "modules/dashboard",
  "modules/databases",
  "modules/api",
  "modules/fauxton_plugin",

  // this needs to be added as a plugin later
  "modules/log"
],

function(app, Initialize, Fauxton, Dashboard, Databases, API, Plugin, Log) {

  // Defining the application router, you can attach sub routers here.
  var Router = app.router = Backbone.Router.extend({
    routes: {
      "": "index",
      "index.html": "index",
      "_all_dbs": "index",
      "database/:database/_:handler": "database_handler",
      "database/:database/:doc": "database_doc",
      "_log": "log"
    },

    initialize: function() {
      app.dashboard = this.dashboard = new Dashboard(this.navBar);

      $("#app-container").html(this.dashboard.el);
      this.dashboard.render();
    },

    database_doc: function(databaseName, docID) {
      var dashboard = this.dashboard;
      var database = new Databases.Model({id:databaseName});
      var doc = new Databases.Doc({
        "_id": docID
      });
      doc.collection = database;

      var crumbs = [
        {"name": "Home","link": app.root},
        {"name": database.id, "link": Databases.databaseUrl(database)},
        {"name": docID, "link": "#"}
      ];

      dashboard.setDashboardContent(new Databases.Views.Doc({
        model: doc
      }));
      dashboard.setBreadcrumbs(new Fauxton.Breadcrumbs({
        crumbs: crumbs
      }));

      doc.fetch().done(function(resp) {
        // Render only the part of the dashboard that needs to be re-rendered
        dashboard.dashboardContent.render();
      });
    },

    database_handler: function(databaseName, page) {
      var dashboard = this.dashboard;
      var database = new Databases.Model({id:databaseName});
      var options = app.getParams();
      database.buildAllDocs(options);

      var crumbs = [
        {"name": "Home","link": app.root},
        {"name": database.id, "link": Databases.databaseUrl(database)}
      ];

      dashboard.setDashboardContent(new Databases.Views.AllDocsList({
        model: database
      }));
      dashboard.setBreadcrumbs(new Fauxton.Breadcrumbs({
        crumbs: crumbs
      }));

      database.allDocs.fetch().done(function(resp) {
        dashboard.dashboardContent.render();
      });
    },

    log: function() {
      var dashboard = this.dashboard;
      var logs = new Log.Collection();
      var crumbs = [
        {"name": "Home","link": app.root},
        {"name": "Logs","link": app.root}
      ];

      dashboard.setDashboardContent(new Log.View({
        collection: logs
      }));

      dashboard.setBreadcrumbs(new Fauxton.Breadcrumbs({
        crumbs: crumbs
      }));

      logs.fetch().done(function (resp) {
        dashboard.dashboardContent.render();
      });
    },

    index: function() {
      var dashboard = this.dashboard;
      var databases = app.databases = new Databases.List();

      this.dashboard.clearBreadcrumbs();

      dashboard.setDashboardContent(new Databases.Views.List({
        collection: databases
      }));

      databases.fetch().done(function(resp) {
        $.when.apply(null, databases.map(function(database) {
          return database.status.fetch();
        })).done(function(resp) {
          dashboard.dashboardContent.render();
        });
      });
    }
  });

  return Router;

});
