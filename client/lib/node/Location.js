"use strict";

const Axios = require('./constants/Axios');

const Keys = require('./constants/Keys');

module.exports = {
  searchByString
};
/**
 * @name searchByString
 * @description Search location by string using google place api
 * @param {string} string 
 */

async function searchByString(string) {
  const result = await Axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
    key: Keys.getGoogleMapsApiKey(),
    input: string,
    sessionToken: Keys.getSessionToken()
  });

  if (result.status === 'ok') {
    return result.result.predictions;
  }

  return result;
}