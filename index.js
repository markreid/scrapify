/**
 * scrapify.
 * CLI for scraping a url to create a spotify playlist.
 */

const chalk = require('chalk');

require('dotenv-safe').load();

const util = require('./lib/util');
const spotify = require('./lib/spotify');

const { log } = util;

const { SPOTIFY_USERNAME } = process.env;

async function doSpotifyParts(options) {
  const { searchTerms } = options;

  if (options.refreshToken) {
    process.stdout.write('Using Refresh Token to request a new Spotify Access Token... ');
    await spotify.refreshAccessToken(process.env.REFRESH_TOKEN);
    process.stdout.write(chalk.green('Success!\n'));
  } else {
    log('No Refresh Token supplied, we\'ll need to authenticate...');
    const code = await spotify.promptForAuth();
    await spotify.requestToken(code);
  }
  const playlistId = options.playlistId || await spotify.createPlaylist(options.playlistName);

  const albumTracks = await spotify.searchManyAlbums(searchTerms);
  const totalAlbums = albumTracks.length;
  const foundAlbums = albumTracks.filter(tracks => tracks.length).length;
  const tracks = util.flatten(albumTracks);

  log(`Found ${chalk.green(albumTracks.filter(arr => arr.length).length)} albums containing ${chalk.green(tracks.length)} tracks.`);
  log('Adding tracks to your playlist...');

  try {
    await spotify.addTracksToPlaylist(playlistId, tracks);
    log(chalk.green('\n\nDone.\n'));
    log(chalk.green(`Searched for ${totalAlbums} albums; ${foundAlbums} found, ${totalAlbums - foundAlbums} missing.`));
    log(chalk.green(`Added ${tracks.length} tracks to the playlist.`));
    log();
    log(chalk.green(`spotify:user:${SPOTIFY_USERNAME}:playlist:${playlistId}`));
    log(chalk.green.underline(`http://open.spotify.com/user/${SPOTIFY_USERNAME}/playlist/${playlistId}`));
  } catch (err) {
    log(err);
  }
}

// prompt the user for any options that
// aren't specified in .env
async function getOptions() {
  const options = {};
  options.pageUrl = await util.envOrAsk('PAGE_URL', 'Full URL to scrape');
  options.selector = await util.envOrAsk('QUERY_SELECTOR', 'Query selectors (comma-separated to merge)');
  options.playlistId = await util.envOrAsk('PLAYLIST_ID', 'Playlist ID (blank to create a new playlist)', true);
  if (!options.playlistId) {
    options.playlistName = await util.envOrAsk('PLAYLIST_NAME', 'Playlist name');
  }
  options.refreshToken = await util.envOrAsk('REFRESH_TOKEN', 'Spotify auth Refresh Token');
  log(); // blank line
  return options;
}


// fetch the remote url, scrape it using the selectors.
// prompt the user to confirm
async function doParseParts(options) {
  const { pageUrl } = options;

  process.stdout.write('Fetching your URL... ');
  const page = await util.fetchPage(pageUrl);
  process.stdout.write(chalk.green('Success!\n'));

  log('Scraping for search terms...');
  const searchTerms = util.scrapeSearchTerms(page, options.selector.split(','))
    .map(searchString => util.cleanSearchString(searchString));

  if (!searchTerms.length) {
    log(chalk.red('Found zero search terms using your query selectors.'));
    return process.exit(1);
  }
  log(chalk.green(`Found ${searchTerms.length} search terms:`));
  searchTerms.forEach((searchTerm) => {
    log(`  -  ${chalk.blue(searchTerm)}`);
  });

  // ask user to confirm that search terms look right
  if (!process.env.NO_CONFIRM) {
    const abort = await util.ask('Look OK? Hit enter to continue...');
    if (abort) {
      return process.exit(0);
    }
  }

  log();

  // add searchTerms to the options object and pass it on
  return Object.assign({}, options, {
    searchTerms,
  });
}


function runTheScript() {
  log(chalk.blue('Hey, it\'s Scrapify.\n'));

  return getOptions()
  .then(doParseParts)
  .then(doSpotifyParts)
  .catch(error => log(error));
}

runTheScript();
