/**
 * lib/util
 */

const readline = require('readline');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const chalk = require('chalk');


// console logger
const log = str => process.stdout.write(`${str || ''}\n`);

// promisifed readline.question
function ask(str) {
  const readlineInterface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(res => readlineInterface.question(chalk.yellow(str), (answer) => {
    res(answer);
    readlineInterface.close();
  }));
}


/**
 * Runs a set of Promises in sequence.
 * Pass an array of 'factory' functions that return promises.
 * Returns an array of the resolution values.
 * stopOnFailure true will cause a rejected promise to short-circuit the
 * sequence; otherwise rejected promises return null in the array.
 * @param  {Function[]}  factories
 * @param  {Boolean} stopOnFailure
 * @return {Array}    Array of resolution values
 */
async function sequentialPromises(factories, stopOnFailure = false) {
  const results = [];
  for (let i = 0; i < factories.length; i++) { // eslint-disable-line no-plusplus
    try {
      results.push(await factories[i]()); // eslint-disable-line no-await-in-loop
    } catch (err) {
      if (stopOnFailure) {
        break;
      } else {
        results.push(null);
      }
    }
  }
  return results;
}

/**
 * flatten an array.
 * note, only goes one-level deep.
 */
function flatten(array) {
  return array.reduce((acc, el) => [...acc, ...el], []);
}

/**
 * chunk an array into an array of smaller sub-arrays
 */
function chunk(array, size) {
  return array.reduce((acc, el) => {
    const lastChunk = acc[acc.length - 1];
    if (lastChunk.length >= size) {
      acc.push([el]);
    } else {
      lastChunk.push(el);
    }
    return acc;
  }, [[]]);
}

/**
 * are the child arrays of this array all of equal length?
 */
function childrenAreEqualLength(array) {
  // empty is true. bad idea?
  if (!array.length) return true;
  return !array.some(child => child.length !== array[0].length);
}


/**
 * unzip arrays, like :
 * [ [a,b,c], [a,b,c], [a,b, c] ]
 * to
 * [ [a, a, a], [b, b, b], [c, c, c] ]
 */
function unzip(arr) {
  if (!(arr && arr.length)) return [];
  return arr[0].map((el, i) => arr.map(childArray => childArray[i]));
}

/**
 * wraps fetch to grab a url and parse it as text
 * @return {Promise.String}
 */
function fetchPage(url) {
  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        const err = new Error(`Bad response fetching page: ${response.status}`);
        err.status = response.status;
        throw err;
      }
      return response.text();
    });
}

/**
 * Scrape the page for search terms from a selectors array.
 * If 2+ selectors are provided, they're merged and joined with whitespace.
 * @param  {String} page
 * @param  {Array} selector
 * @return {Array}
 */
function scrapeSearchTerms(page, selectors) {
  const $ = cheerio.load(page);

  const allResults = selectors.map(sel =>
    $(sel).map((i, el) => cheerio(el).text()).toArray().map(text => text.trim()),
  );

  if (!childrenAreEqualLength(allResults)) {
    throw new Error('Unable to merge selectors; results length mismatch');
  }

  return unzip(allResults)
    .map(subs => subs.join(' '))
    .filter(string => string.trim() !== '');
}


/**
 * 'Clean' a search string by removing terms that Spotify
 * doesn't handle well; namely 'and' to join 2 artists.
 * @param  {String} str
 * @return {String}
 */
function cleanSearchString(str) {
  return str.replace(/ and /gi, ' ');
}

// check .env for a variable, prompt user for it otherwise.
// allowEmpty true accepts an empty string.
async function envOrAsk(variable, question, allowEmpty) {
  const fromEnv = process.env[variable];
  if (fromEnv || (allowEmpty && fromEnv === '')) {
    log(chalk.yellow(`${variable} is ${chalk.underline(fromEnv)}`));
    return fromEnv;
  }
  return await ask(`${question}: `) || null;
}

// same as envOrAsk but repeats until the user enters a blank line.
// returns all results in an array.
async function envOrAskMultiple(variable, question) {
  const fromEnv = process.env[variable];
  if (fromEnv) {
    log(chalk.yellow(`${variable} is ${chalk.underline(fromEnv)}`));
    return [fromEnv];
  }
  const answers = [];
  let asking = true;
  while (asking) {
    // eslint-disable-next-line no-await-in-loop
    const answer = await ask(`${question}: `);
    if (!answer) {
      asking = false;
    } else {
      answers.push(answer);
    }
  }
  return answers;
}

module.exports = {
  log,
  ask,
  sequentialPromises,
  flatten,
  chunk,
  childrenAreEqualLength,
  unzip,
  fetchPage,
  scrapeSearchTerms,
  cleanSearchString,
  envOrAsk,
  envOrAskMultiple,
};
