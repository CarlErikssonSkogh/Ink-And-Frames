document.addEventListener('DOMContentLoaded', (event) => {
    const mediaDivs = document.querySelectorAll('.clickable-media');
    mediaDivs.forEach(div => {
        div.addEventListener('click', function() {
            const mediaName = this.querySelector('#mediaName').textContent;
            if(isAuthenticated){
            window.location.href = '/media?name=' + encodeURIComponent(mediaName);
        }else{
            alert("You need to be signed in to view this page")
        }
        });
    });
});
//Toggles the dropdown menu
function dropdownFunction(e) {
    e.stopPropagation();
    document.getElementById("myDropdown").classList.toggle("show");
}

//Function to add click events to the sorting options
document.addEventListener('DOMContentLoaded', (event) => {
    const sortLi = document.querySelectorAll("#sortBy li");
    sortLi.forEach(li => {
        li.addEventListener('click', function(){
            const sorting = li.textContent;
            const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({sorting:sorting})
              };
              
              fetch('/sortBy', options)
                .then(response => {
                  if (response.ok) {
                    location.reload();
                  } else {
                    throw new Error('Failed to send data');
                  }
                })
        })
    })
});

//Function to add click events to the display only options
document.addEventListener('DOMContentLoaded', (event) => {
    const onlyDisplayLi = document.querySelectorAll("#onlyDisplay li");
    onlyDisplayLi.forEach(li => {
        li.addEventListener('click', function(){
            const onlyDisplay = li.textContent;
            const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({onlyDisplay:onlyDisplay})
              };
              
              fetch('/onlyDisplay', options)
                .then(response => {
                  if (response.ok) {
                    location.reload();
                  } else {
                    throw new Error('Failed to send data');
                  }
                })
        })
    })
});

function ratingFunction() {
//Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }

document.addEventListener('DOMContentLoaded', (event) => {
    const ratingLi = document.querySelectorAll('#myDropdown li');
    ratingLi.forEach(li => {
        li.addEventListener('click',function(){
            const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({rating:li.textContent}) 
              };
              
              fetch('/rating', options)
                .then(response => {
                  if (response.ok) {
                    return response.json();
                  } else {
                    throw new Error('Failed to send data');
                  }
                })
        })
    })
});
}

function signOutFunction(){
    fetch('/signOut')
    .then(response => {
        if (response.ok) {
            location.reload();
        } else {
            console.error('Sign out failed');
        }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

//gets the search value from the searchbar
window.onload = function() {
  document.getElementById('uploadSearch').addEventListener('submit', function(event) {
      event.preventDefault();
      var searchValue = document.getElementById('uploadSearchbar').value;
      console.log(searchValue);
      uploadMedia(searchValue);
  });
}
//Function to handle the upload media search
async function uploadMedia(search){
  console.log("you searched for",search)
const url = `https://imdb8.p.rapidapi.com/auto-complete?q=${search}`;
const options = {
	method: 'GET',
	headers: {
		'X-RapidAPI-Key': 'dd7e095a77mshe11764b1ba51b5ep161722jsne5dad747c107',
		'X-RapidAPI-Host': 'imdb8.p.rapidapi.com'
	}
};

try {
  const response = await fetch(url, options);
  const result = await response.json();
  const list = result.d;
  document.querySelector('.uploadMedia').innerHTML = "";
  list.map((item) => {
      const title=item.l;
      const poster = item.i.imageUrl;
      const tag = item.q
      const stars = item.s
      const year = item.y
      const trailer = item.v
      console.log(title,poster, trailer)
      const uploadResults = document.createElement('div');
      uploadResults.innerHTML = `<h3>${title}</h3><img src="${poster}" alt="poster" width="100" height="100">`;
      uploadResults.addEventListener('click', () => {
          console.log(title, poster, tag, stars, year);
          //post all the correct information about the clicked media to the server    
          const postOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({title,poster,tag,stars,year}) 
          };

          fetch('/uploadMedia', postOptions)
            .then(response => {
              if (response.ok) {
                return response.json();
              } else {
                throw new Error('Failed to send data');
              }
            })
      });
      document.querySelector('.uploadMedia').appendChild(uploadResults);
  })
} catch (error) {
  console.error(error);
}
}