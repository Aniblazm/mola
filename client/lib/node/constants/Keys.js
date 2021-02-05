"use strict";

module.exports = {
  setGoogleMapsApiKey,
  getGoogleMapsApiKey,
  setSessionToken,
  getSessionToken
};
var googleMapsApiKey = undefined;

function setGoogleMapsApiKey(key) {
  googleMapsApiKey = key;
}

function getGoogleMapsApiKey() {
  return googleMapsApiKey;
}

var sessionToken = undefined;

function setSessionToken(token) {
  sessionToken = token;
}

function getSessionToken() {
  return sessionToken;
}