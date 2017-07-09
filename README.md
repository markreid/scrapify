# Scrapify

Scrapify is a simple CLI that scrapes album names from a webpage using CSS selectors and turns them into a Spotify playlist.


## Installation & Configuration

See [INSTALL.md](INSTALL.md).


## Usage

Run the tool with `npm start`.

You'll be asked for a full URL and a CSS-style query selector to find your album titles.

You can provide an existing playlist ID to add the tracks to, or the name of a new playlist to create.


## Example

Let's say we want to scrape Pitchfork's Best New Albums.

Our URL is [http://pitchfork.com/best/](http://pitchfork.com/best/), and our query selector is `#best-new-albums .title`. Easy.

To fine-tune our search terms, we can add multiple selectors (comma-separated) that get merged together, like:
```
#best-new-albums .artist-list, #best-new-albums .title
```
This will find the artist name and album title and merge them together, so our Spotify search is a little more specific.


### Credits

All the heavy lifting here is done by [Spotify Web API Node](https://github.com/thelinmichael/spotify-web-api-node), [Cheerio](https://github.com/cheeriojs/cheerio) and [Chalk](https://github.com/chalk/chalk), so shout out to the owners and contributors of those projects.

