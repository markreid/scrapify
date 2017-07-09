# Scrapify: Installation and Configuration

## Installing

You will need **Node 8+**.
Clone the repo, run `npm run install` and copy `.env.example` to `.env`.


## Create a Spotify Developer App

To get started, you'll need to create a Spotify App:

* Login to https://developer.spotify.com/my-applications/
* 'Create An App'
* Provide an application name and description
* Copy the values of `Client ID` and `Client Secret` for the steps below.
* Add a `Redirect URI`. You probably just need the default, `http://localhost:3000` (see below)
* Save your App.


## Configure Scrapify

Config lives in `.env`. The _spotify credentials_ and _auth callback_ sections are both mandatory, everything else is optional.

If you don't provide the optional values, you'll be prompted when you run the CLI. Pre-fill them to run it without any user prompting.


## Authentication

To allow your Spotify Developer App to create a playlist for you, you need to authorize the app. You'll be prompted to do this the first time you run the app, and on success you'l see a **Refresh Token** logged to the console. Put that in your `.env` to bypass the auth workflow in the future, but remember to keep it safe!
