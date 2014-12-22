/**
 * Interface to bulk courses requests.
 */

/**
 * Courses constructor.
 *
 * @parm model
 *   The model of the course document.
 */
function Courses(model) {
  this.docModel = model;

  this.defaults = {
    limit: 100,
    pageSize: 100
  };
}

/**
 * Retrieves courses based on their type.
 *
 * @param request
 *   The request object in the GET callback.
 * @param response
 *   The response object in the GET callback.
 * @param self
 *   Reference to the Users object that'll execute the query.
 */
var getByType = function(request, response, self) {
  
  type = request.query.type;
  
  if (request.query.type !== 'undefined') {
    var query = {};

    // First find docs that have a type field.
    var matchTypeExists = {$match: {type: {$exists: true}}};

    // Find docs that match the type query.
    var matchType = {$match: {
      type: type
    }};

    // Sort by title ascending.
    var sort = {$sort: {title: 1}};

   // Aggregate all the steps in the query var.
    query  = [
      matchTypeExists,
      mmatchType,
      sort
    ];

  }
  else {
    // Bad request. Respond with empty array.
    response.send(400, []);
    return;
  }

  var data = {
    request: request,
    response: response
  };

  // Execute the aggregate query.
  self.docModel.aggregate(query).exec(
    function(err, docs) {
      if (err) {
        data.response.send(500, err);
        dslogger.error(err);
        return;
      }

      // Send results
      data.response.send(docs);
    }
  );
};

/**
 * Basic GET to retrieve all courses. Supports pagination and limiting the number
 * of results returned.
 *
 * @param request
 *   The request object in the GET callback.
 * @param response
 *   The response object in the GET callback.
 * @param self
 *   Reference to the Users object that'll execute the query.
 */
var getAllCourses = function(request, response, self) {
  var conditions = {};

  var usingCustomPage = false,
      usingCustomPageSize = false,
      usingCustomLimit = false;

  // Page number. Can't be set to less than 1.
  var page = 1;
  if (typeof(request.query.page) !== 'undefined') {
    usingCustomPage = true;
    var requestPage = parseInt(request.query.page);
    page = requestPage < 1 ? 1 : requestPage;
  }

  // Page size.
  var pageSize = self.defaults.pageSize;
  if (typeof(request.query.pageSize) !== 'undefined') {
    usingCustomPageSize = true;
    pageSize = parseInt(request.query.pageSize);
  }

  // Determine skip value based on page and page size.
  var skip = (page - 1) * pageSize;

  // Limit how many docs get returned from the query. Separate from page logic.
  var limit = self.defaults.limit;
  if (typeof(request.query.limit) !== 'undefined') {
    usingCustomLimit = true;
    limit = parseInt(request.query.limit);
  }

  // Don't allow requests that specify 'pageSize' but not 'page'
  if (usingCustomPageSize && !usingCustomPage) {
    response.send(400, 'Need to also set the "page" param when setting the "pageSize"');
    return;
  }

  // If page size is set, but no custom limit, then set the limit to equal the page size.
  // ex: /courses?page=1&pageSize=100
  if (usingCustomPageSize && !usingCustomLimit) {
    limit = pageSize;
  }
  // If both the page size and limit is set, then just make sure the number of
  // returned docs is no greater than the page size.
  // ex: /courses?page=1&pageSize=100&limit=200
  else if (usingCustomPageSize && usingCustomLimit && limit > pageSize) {
      limit = pageSize;
  }

  // Make these values available to the query callback.
  var data = {
    request: request,
    response: response,
    page: page,
    pageSize: pageSize,
    limit: limit
  };

  // Execute the query.
  var query = self.docModel.find(conditions).skip(skip).limit(limit);
  query.exec(function(err, docs) {
    if (err) {
      data.response.send(500, err);
      return;
    }

    var results = {
      page: data.page,
      pageSize: data.pageSize,
      limit: data.limit,
      results: docs
    };

    data.response.send(results);
  });
};

/**
 * Retrieve course documents.
 *
 * @param request
 *   The request object in the GET callback.
 * @param response
 *   The response object in the GET callback.
 */
Courses.prototype.get = function(request, response) {
  if (typeof(request.query.type) !== 'undefined') {
    getByType(request, response, this);
  }
  else {
    getAllCourses(request, response, this);
  }
};

// Export the Users class
module.exports = Courses;