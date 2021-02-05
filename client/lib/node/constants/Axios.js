"use strict";

module.exports = {
  get
};

const axios = require('axios');

async function get(url, params) {
  try {
    const result = await axios.get(url, {
      params
    });
    return {
      status: 'ok',
      result: result.data
    };
  } catch (e) {
    console.error(e);
    return {
      status: 'error',
      result: e
    };
  }
}