const parseCookies = (req, res, next) => {
  if (req.headers.cookie) {
    var cookieStrs = req.headers.cookie.split(';');
    var cookies = {};
    cookieStrs.forEach((str) => {
      var cookie = str.split('=');
      cookies[cookie[0].trim()] = cookie[1];
    });
    req.cookies = JSON.parse(JSON.stringify(cookies));  
  }
  next(); 
};

module.exports = parseCookies;