import "./App.css";
import { useState, useEffect } from "react";
import SpotifyWebAbi from "spotify-web-api-js";

const spotifyApi = new SpotifyWebAbi();

let seed_tracks = [];
let seed_artists = [];
let seed_genres = []; //TODO implement genre stuff

let recSongs = [];

//Takes the user's top tracks and artists and gets the ids from
//the tracks, the ids from the artists, and the genres from the
//artists. Artists have a lot more genres than the api's
//available-genre-seeds so we use them
const processUserTracks = () => {
  spotifyApi.getMyTopTracks().then((response) => {
    response.items.forEach((track) => {
      seed_tracks.push(track.id);
    });
  });
  spotifyApi.getMyTopArtists().then((response) => {
    response.items.forEach((artist) => {
      seed_artists.push(artist.id);

      artist.genres.forEach((genre) => {
        if (seed_genres.includes(genre) === false) {
          seed_genres.push(genre);
        }
      });
    });
  });
};

//Helper function, returns 0-max inclusive
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

//Something to do with authentication
const getTokenFromURL = () => {
  return window.location.hash
    .substring(1)
    .split("&")
    .reduce((initial, item) => {
      let parts = item.split("=");
      initial[parts[0]] = decodeURIComponent(parts[1]);
      return initial;
    }, {});
};

function App() {
  const [spotifyToken, setSpotifyToken] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [currSong, setCurrSong] = useState();

  const nextSong = () => {
    if (recSongs.length === 0) {
      getNewRecommendations();
    }

    setCurrSong(recSongs.pop());

    // //TODO player needs work, somehow come after this render? maybe just add another button
    // and send stop when "next song" is clicked?
    // if (currSong) {
    //   var data = {
    //     context_uri: "spotify:album:5ht7ItJgpBH7W6vJ5BqpPr",
    //     offset: {
    //       position: 5,
    //     },
    //     position_ms: 0,
    //   };
    //   spotifyApi.play(data);
    // }
  };

  //Gets random number that sum to < 5
  //Creates object to be passed into getRecommendations, can have
  //up to 5 seeds of combination of track ids, artist ids, and genres
  const getNewRecommendations = () => {
    console.log("NEW REC");
    // console.log(seed_genres);
    var max = 4; //TODO Refactor and set catch for sum > 5 after adjust
    var num1 = getRandomInt(max);
    var num2 = getRandomInt(max);
    var num3 = getRandomInt(max);
    var total = num1 + num2 + num3;
    var adjust = max / total;
    num1 = Math.round(num1 * adjust);
    num2 = Math.round(num2 * adjust);
    num3 = Math.round(num3 * adjust);

    //Maybe need to implement this if allow removal of things
    // if (
    //   seed_tracks.length === 0 ||
    //   seed_artists.length === 0 ||
    //   seed_genres.length === 0
    // ) {
    //   processUserTracks();
    // }

    var data = {
      limit: 10,
      seed_tracks: [
        [...seed_tracks].sort(() => 0.5 - Math.random()).slice(0, num1),
      ],
      seed_artists: [
        [...seed_artists].sort(() => 0.5 - Math.random()).slice(0, num2),
      ],
      seed_genres: [
        [...seed_genres].sort(() => 0.5 - Math.random()).slice(0, num3),
      ],
      max_popularity: 25,
    };

    spotifyApi
      .getRecommendations(data)
      .then((response) => {
        recSongs = response.tracks;
        setCurrSong(recSongs.pop());
      })
      .catch((e) => {
        console.log(e);
      });
  };

  useEffect(() => {
    const spotifyToken = getTokenFromURL().access_token;
    window.location.hash = "";

    if (spotifyToken) {
      setSpotifyToken(spotifyToken);
      spotifyApi.setAccessToken(spotifyToken);
      spotifyApi.getMe().then((user) => {});
      setLoggedIn(true);
      processUserTracks();
    }
  }, []);

  const logout = () => {
    setSpotifyToken("");
    spotifyApi.setAccessToken("");
    setLoggedIn(false);
  };

  const test = () => {
    console.log(seed_genres);

    console.log(recSongs);
    console.log(currSong);
  };

  return (
    <div className="App">
      {loggedIn ? (
        <>
          <div>Logged in</div>

          <button onClick={getNewRecommendations}>Generate Songs</button>
          <button onClick={nextSong}>Next Song</button>
          <button onClick={test}>print</button>
          <button onClick={logout}>Log out</button>
          {currSong ? (
            <>
              <div>Now playing: {currSong.name}</div>
              <div>
                <img src={currSong.album.images[0].url} alt="art" />
              </div>
              {/* RD: remove artist and tracks of artist and one genre?
              D: remove artist
              L: add artist, 
              RL: add artist and track and one genre, add to playlist or library?
          */}
              <button>Really dislike</button>
              <button>Dislike</button>
              <button>Like</button>
              <button>Really Like</button>
            </>
          ) : null}
          <div>Songs left in this batch: {recSongs.length}</div>
        </>
      ) : (
        <a href="http://localhost:8888">Login to spotify</a>
      )}
    </div>
  );
}

export default App;
