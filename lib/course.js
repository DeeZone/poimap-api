/**
 * Interface to the Course model.
 */

/**
 * Constructor to the Course object.
 *
 * @param model
 *   The model of the course document.
 */
function Course(model) {
  this.docModel = model;
}

/**
 * Converts a timestamp in seconds to a Date object.
 *
 * @param timestamp
 *   Timestamp in seconds.
 */
var convertToDate = function(timestamp) {
  return new Date(timestamp * 1000);
};

/**
 * Finds a course document for a given course_id.
 *
 * @param req
 *   The request object in a GET callback.
 * @param res
 *   The reponse object in a GET callback.
 */
Course.prototype.get = function(req, res) {
  // Store handle to this in self so that it can be accessed within callback.
  var self = this;
  self.response = res;

  var query = {};
  if (req.query.course_id) {
    query._id = req.query.course_id;
  }

  self.queryString = JSON.stringify(query);

  this.docModel.findOne(
    query,
    function(err, doc) {
      if (err) {
        self.response.send(500, err);
        return;
      }

      // Respond with the course doc if found.
      if (doc) {
        self.response.send(200, doc);
      }
      else {
        // Return an empty object if no doc is found.
        self.response.send(204, {});
      }
    }
  );
};




/**
 * Creates a course document for a given course_id.
 *
 * @param req
 *  The request object in a POST callback.
 * @param res
 *  The response object in a POST callback.
 */
Course.prototype.post = function(req, res) {
  var self = this;
  self.request = req;
  self.response = res;
  self._id = req.body.course_id;

  this.docModel.findOne(
    {_id: self._id},
    function(err, doc) {
      if (err) {
        self.response.send(500, err);
        return;
      }

      // Only update the fields that are provided by the request.
      var updateArgs = {'$set':{}};
      
      var keys = Object.keys(self.request.body);
      console.log('Course.prototype.post - keys: ' + keys);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] == 'updated' && self.request.body[keys[i]] !== undefined) {
          var date = new Date();
          updateArgs['$set'].updated = new Date();
        }
        else if (keys[i] == 'updated' && self.request.body[keys[i]] === undefined) {
          var date = new Date();
          updateArgs['$set'].updated = date;

/*
        } // location as a geoloaction
        else if (keys[i] == 'location' && self.request.body[keys[i]].coordinates !== undefined) {
          // http://api.tiles.mapbox.com/v4/geocode/mapbox.places-v1
          // /Broome+Australia.json?access_token=pk.eyJ1IjoiZGVlem9uZSIsImEiOiJ3bmdJcVlnIn0.AfQscey5bQGEwZIcsvaUBQ
          updateArgs['$set'].location = self.request.body.location;
*/

        } // everything else
        else if (self.request.body[keys[i]] !== undefined) {
          updateArgs['$set'][keys[i]] = self.request.body[keys[i]];
        }
      }

      // Update the course document.
      self.updateCourse(self._id, updateArgs, self.response);
    }
  );
};

/**
 * Updates a course document if it already exists, or upserts one if it doesn't.
 *
 * @param course_id
 *  Courese ID of the course document to update/upsert.
 * @param updateArgs
 *  Values to update the document with.
 * @param response
 *  Response object to handle responses back to the sender.
 */
Course.prototype.updateCourse = function(course_id, updateArgs, response) {
  var self = {};
  self.course_id = course_id;
  self.args = updateArgs;
  self.response = response;

  console.log('Course.prototype.updateCourse');
  console.log('course_id: ' + course_id);
  console.log('updateArgs: ' + JSON.stringify(updateArgs));

  if (course_id === undefined) {

    var courseEntry = new this.docModel(self.args);
    courseEntry.save(function(err) {
    if (err) {
      self.response.send(500, err);
    }
    // Added course entry to db
    self.response.send(201, self.args);
    console.log("Created course entry using Course POST method.");
    return 1;
  });
  }
  else {

    this.docModel.update(
      { 'course_id': self.course_id },
      self.args,
      { upsert: true },
      function(err, num, raw) {
        if (err) {
          self.response.send(500, err);
          dslogger.error(err);
        }
        self.response.send(true);
      }
    );

  }
};

/**
 * Deletes a course document for a given course_id.
 *
 * @param request
 *  The request object in a POST callback.
 * @param response
 *  The response object in a POST callback.
 */
Course.prototype.delete = function(request, response) {
  var self = this;
  self.course_id = request.query.course_id;
  self.response = response;

  this.docModel.remove(
    {course_id: self.course_id},
    function (err, num) {
      if (err) {
        self.response.send(500, err);
      }

      if (num == 0) {
        self.response.send(304, 'Found no document to delete for course_id: ' + self.course_id);
      }
      else {
        self.response.send(200, 'Delete ' + num + ' document(s) for course_id: ' + self.course_id);
      }
    }
  );
};

/**
 * Helper function to determine if an object is empty or not.
 *
 * @param obj
 *   The object to check.
 */
var isObjectEmpty = function(obj) {
  for(var key in obj) {
    return true;
  }

  return false;
};

module.exports = Course;