let apiURL = 'https://api.tvmaze.com/';
let epURL = 'https://api.tvmaze.com/episodes/';

window.onload = function() {
  closeLightBox();  
  document.getElementById("button").onclick = function () {
    searchTvShows();
  };
  document.getElementById("lightbox").onclick = function () {
    closeLightBox();
  };

  fetchLatestEpisodes();
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('Service Worker registered with scope:', registration.scope);
    }, function(error) {
      console.log('Service Worker registration failed:', error);
    });
  });
}  

async function searchTvShows() {
  document.getElementById("main").innerHTML = "";
  document.getElementById("episodes-list").innerHTML = ""; 
  document.getElementById("latest-episodes").style.display = "none"; 

  let search = document.getElementById("search").value;

  try {
    const response = await fetch(apiURL + 'search/shows?q=' + search);
    const data = await response.json();
    console.log(data);
    showSearchResults(data);
  } catch (error) {
    console.error('Error fetching tv show:', error);
  }
}

function showSearchResults(data) {
  for (let tvshow in data) {
    createTVShow(data[tvshow]);
  }
}

function showGenres(genres) {
  let output = "<ul>";
  for (let g of genres) { 
    output += `<li>${g}</li>`;
  }
  output += "</ul>";
  return output;
}

function createTVShow(tvshowJSON) {
  var elemMain = document.getElementById("main");
  var showDetail = document.createElement("div");
  showDetail.className = "show-detail";

  var elemImage = document.createElement("img");
  elemImage.src = tvshowJSON.show.image ? tvshowJSON.show.image.medium : 'https://via.placeholder.com/210x295?text=No+Image';
  elemImage.className = "show-image";

  var showContent = document.createElement("div");
  showContent.className = "show-content";

  var elemShowTitle = document.createElement("h1");
  elemShowTitle.className = "show-title";
  elemShowTitle.textContent = tvshowJSON.show.name;

  var rating = document.createElement("div");
  rating.className = "rating";
  var rateValue = document.createElement("span");
  rateValue.className = "rate-value";
  rateValue.textContent = tvshowJSON.show.rating.average ? tvshowJSON.show.rating.average + "/10" : "No rating";
  rating.appendChild(rateValue);

  var releaseDate = document.createElement("p");
  releaseDate.className = "release-date";
  releaseDate.textContent = "Release Date: Information not available";

  var elemGenre = document.createElement("p");
  elemGenre.innerHTML = "Genres: " + showGenres(tvshowJSON.show.genres);
  
  var elemSummary = document.createElement("p");
  elemSummary.className = "show-description";
  elemSummary.innerHTML = tvshowJSON.show.summary || 'No summary available.';

  showContent.appendChild(elemShowTitle);
  showContent.appendChild(rating);
  showContent.appendChild(releaseDate);
  showContent.appendChild(elemGenre);
  showContent.appendChild(elemSummary);

  showDetail.appendChild(elemImage);
  showDetail.appendChild(showContent);

  var episodesContainer = document.createElement("div");
  episodesContainer.className = "episodes-container";
  showContent.appendChild(episodesContainer);

  elemMain.appendChild(showDetail);

  let showId = tvshowJSON.show.id;
  fetchEpisodes(showId, episodesContainer);
}


async function fetchEpisodes(showId, elemDiv) {
  console.log("fetching episodes for showId: " + showId);
  try {
    const response = await fetch(apiURL + 'shows/' + showId + '/episodes');  
    const data = await response.json();
    console.log("episodes");
    console.log(data);
    showEpisodes(data, elemDiv);
  } catch(error) {
    console.error('Error fetching episodes:', error);
  }
}

function showEpisodes (data, elemDiv) {
  let elemEpisodes = document.createElement("div");  
  let output = "<ol>";
  for (episode in data) {
    output += "<li><a href='javascript:showLightBox(" + data[episode].id + ")'>" + data[episode].name + "</a></li>";
  }
  output += "</ol>";
  elemEpisodes.innerHTML = output;
  elemDiv.appendChild(elemEpisodes);  
}

function showLightBox(episodeId){
  document.getElementById("lightbox").style.display = "block";
  epInfo(episodeId);
}

function closeLightBox(){
  document.getElementById("lightbox").style.display = "none";
}

async function epInfo(id) {
  try {
      const response = await fetch(epURL + id);
      const data = await response.json();
      const lightboxContent = `
          <img src="${data.image ? data.image.medium : 'https://via.placeholder.com/210x295?text=No+Image'}" alt="${data.name}">
          <h2>${data.name}</h2>
          <p>Season: ${data.season}, Episode: ${data.number}</p>
          <p>${data.summary || 'No description available.'}</p>
      `;
      document.getElementById("message").innerHTML = lightboxContent;
  } catch (error) {
      console.error('Error fetching episode info:', error);
      document.getElementById("message").innerHTML = "<p>Error trying to fetch episode info</p>";
  }
}

async function fetchLatestEpisodes() {
  try {
    const response = await fetch('http://api.tvmaze.com/schedule');
    const episodes = await response.json();
    if (episodes.length > 0) {
      document.getElementById("latest-episodes").style.display = "block";
      const episodesList = document.getElementById('episodes-list');
      episodes.slice(0, 9).forEach(episode => {
        const episodeDiv = document.createElement('div');
        episodeDiv.className = 'episode';
        episodeDiv.innerHTML = `
          <img src="${episode.show.image ? episode.show.image.medium : 'https://via.placeholder.com/210x295?text=No+Image'}" alt="${episode.show.name}">
          <a href="${episode.show.url}" target="_blank"><h3>${episode.show.name}</h3></a>
          <p>${episode.name} - Season ${episode.season} Episode ${episode.number}</p>
        `;
        episodesList.appendChild(episodeDiv);
      });
    } else {
      document.getElementById("latest-episodes").style.display = "none";
    }
  } catch (error) {
    console.error('Failed to fetch latest episodes:', error);
  }
}


// handle install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const installButton = document.getElementById('installButton');
  installButton.style.display = 'block';

  installButton.addEventListener('click', () => {
    installButton.style.display = 'none';
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      deferredPrompt = null;
    });
  });
});   
