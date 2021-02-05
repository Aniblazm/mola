"use strict";

let Parse = require("parse");

const Keys = require('./constants/Keys');

const AUA = {
  initServer() {
    Keys.setGoogleMapsApiKey('AIzaSyA_H7WVmlnxy8OWrNuIJmGclYWwXFB49Wk'); //Generate UUID sessionToken

    const sessionToken = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0,
          v = c == 'x' ? r : r & 0x3 | 0x8;
      return v.toString(16);
    });
    Keys.setSessionToken(sessionToken);
  },

  Location: require('./Location')
};
module.exports = AUA;