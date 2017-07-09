/**
 * lib/spotify
 * spotify API calls.
 */

const SpotifyWebApi = require('spotify-web-api-node');
const http = require('http');
const url = require('url');
const chalk = require('chalk');

const { log, chunk, sequentialPromises } = require('./util');

const {
  CLIENT_ID,
  CLIENT_SECRET,
  AUTH_REDIRECT_URI,
  AUTH_LISTEN_PORT,
  SPOTIFY_USERNAME,
} = process.env;
const AUTH_SCOPES = ['playlist-read-private', 'playlist-modify-private'];


// instantiate a client
const spotify = new SpotifyWebApi({
  clientId: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  redirectUri: AUTH_REDIRECT_URI,
});

/**
 * Instantiate an HTTP server that will listen for the
 * Spotify auth callback and parse the authorization code
 * from the request.
 * @return {Promise.String} Auth code
 */
function listenForCallback() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = url.parse(req.url, true);
      const parsedRedirectUri = url.parse(AUTH_REDIRECT_URI);

      // ignore any requests that aren't to the redirect uri
      if (parsedUrl.pathname !== parsedRedirectUri.pathname) {
        return res.end();
      }

      const { code } = parsedUrl.query;

      if (!code) {
        const errorString = 'Unable to parse code from Spotify auth callback request.';
        res.end(errorString);
        return reject(errorString);
      }

      res.end('Received auth code from Spotify, close this window and check the CLI.');
      resolve(code);
      return server.close();
    });

    // eslint-disable-next-line consistent-return
    server.listen(AUTH_LISTEN_PORT, (err) => {
      if (err) {
        const errorString = `HTTP server unable to listen on port ${AUTH_LISTEN_PORT}`;
        log(errorString);
        log(err);
        return reject(errorString);
      }
    });
  });
}

// prompt the user to open the authorize URL in their browser,
// start the http server to listen for the callback
function promptForAuth() {
  const authorizeUrl = spotify.createAuthorizeURL(AUTH_SCOPES, 'state');
  log(chalk.yellow('Open this URL in your browser and grant permissions:\n'));
  log(chalk.underline(authorizeUrl));
  return listenForCallback();
}


// request access & refresh tokens from an auth code
function requestToken(code) {
  return spotify.authorizationCodeGrant(code)
  .then((data) => {
    const { access_token, refresh_token } = data.body;
    spotify.setAccessToken(access_token);
    spotify.setRefreshToken(refresh_token);
    log(chalk.green('Authenticated with Spotify'));
    log();
    log(chalk.green('Your Refresh Token is:'));
    log(chalk.green.underline(refresh_token));
    log();
  })
  .catch((error) => {
    log(chalk.red('Unable to grant tokens:'));
    log(chalk.red(error));
    throw error;
  });
}

// refresh access token from a refresh token
function refreshAccessToken(refreshToken) {
  spotify.setRefreshToken(refreshToken);

  return spotify.refreshAccessToken()
  .then((data) => {
    spotify.setAccessToken(data.body.access_token);
  })
  .catch((error) => {
    log(chalk.red('Unable to refresh access token:'));
    log(chalk.red(error));
    throw error;
  });
}

// creates a playlist
function createPlaylist(playlistName) {
  return spotify.createPlaylist(SPOTIFY_USERNAME, playlistName, { public: false })
  .then(response => response.body.id)
  .catch((error) => {
    log('Error creating playlist:');
    log(error);
    throw error;
  });
}

// return an array of track uris from an album
function getAlbumTracks(albumId) {
  return spotify.getAlbumTracks(albumId, { limit: 50 })
  .then(response => response.body.items.map(track => track.uri))
  .catch((error) => {
    log('Error in getAlbumTracks():');
    log(error);
  });
}

// search for an album by a string and return an array of its tracks
function searchAlbum(text) {
  process.stdout.write(`Searching for album ${chalk.underline(text)}... `);
  return spotify.searchAlbums(text)
  .then((response) => {
    const album = response.body.albums.items[0] || null;

    // no album, no tracks
    if (!album) {
      process.stdout.write(chalk.red('Not Found\n'));
      return [];
    }

    process.stdout.write(chalk.green('Found! '));
    return getAlbumTracks(album.id)
    .then((tracks) => {
      process.stdout.write(chalk.green(`Album has ${tracks.length} tracks.\n`));
      return tracks;
    });
  });
}

// sequentially search for an array of albums
function searchManyAlbums(albums) {
  return sequentialPromises(albums.map(searchTerm => () => searchAlbum(searchTerm)));
}


function addTracksToPlaylist(playlistId, tracks) {
  // Spotify won't let you add more than 100 tracks at once...
  const chunked = chunk(tracks, 100);
  const promises = chunked.map(chunkTracks =>
    () => spotify.addTracksToPlaylist(SPOTIFY_USERNAME, playlistId, chunkTracks),
  );
  return sequentialPromises(promises);
}


// export
module.exports = {
  promptForAuth,
  requestToken,
  refreshAccessToken,
  spotify,
  createPlaylist,
  searchAlbum,
  searchManyAlbums,
  getAlbumTracks,
  addTracksToPlaylist,
};
