document.addEventListener('DOMContentLoaded', (event) => {
    const mediaDivs = document.querySelectorAll('.clickable-media');
    //Adds a click event to all the clickable media divs
    mediaDivs.forEach(div => {
        div.addEventListener('click', function() {
          //Gets the title of the clicked media
            const mediaName = this.querySelector('#mediaName').textContent;
            //If the user is logged in they are transported to media.hbs
            if(isAuthenticated){
            window.location.href = '/media?name=' + encodeURIComponent(mediaName);
        }else{
          window.location.href = '/signIn'
        }
        });
    });
});

//Toggles the dropdown menu
function dropdownFunction(e) {
  //Close the dropdown menu if the user clicks outside of it
    e.stopPropagation();
    document.getElementById("myDropdown").classList.toggle("show");
}

//Function to add click events to the sorting options
document.addEventListener('DOMContentLoaded', (event) => {
    const sortLi = document.querySelectorAll("#sortBy li");
    //Adds click event to all the sortLi elements
    sortLi.forEach(li => {
        li.addEventListener('click', function(){
          //gets the text content of the sortLi that was clicked
            const sorting = li.textContent;
            const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({sorting:sorting})
              };
              //Sends the text content of the sortLi that was clicked to the server
              fetch('/sortBy', options)
                .then(response => {
                  if (response.ok) {
                    //If the response was successful, reload the page to apply the changes
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
          //Gets the textcontent (what the media should be filtered by)
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
                    //If the response was successful, reload the page to apply the changes
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
  //If the user clicked outside of the dropdown button, close the window
    if (!event.target.matches('.dropbtn')) {
      var dropdowns = document.getElementsByClassName("dropdown-content");
      for (var i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        //If the dropdown is open, close it
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
  }

//selects all the dropdown elements
document.addEventListener('DOMContentLoaded', (event) => {
    const ratingLi = document.querySelectorAll('#myDropdown li');
    //Loops through them and adds click event to all of them
    ratingLi.forEach(li => {
        li.addEventListener('click',function(){
            const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({rating:li.textContent}) 
              };
              //Sends the text content of the clicked rating li to the server
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

//Function to handle the sign out button
function signOutFunction(){
    fetch('/signOut')
    .then(response => {
        if (response.ok) {
          window.location.href = "/";
        } else {
            console.error('Sign out failed');
        }
    })
    .catch((error) => {
      console.error('Error:', error);
    });
}

//gets the search value from the upload searchbar
window.onload = function() {
  document.getElementById('/uploadSearch').addEventListener('submit', function(event) {
      event.preventDefault();
      var searchValue = document.getElementById('uploadSearchbar').value;
      //Calls the upload media function with the searchValue
      uploadMedia(searchValue);
  });
}

//Function to handle the upload media search
async function uploadMedia(search){
  const searchOption ={
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
      body: JSON.stringify({search}) 
    };
try{
  //Sends the search to the server
  const response = await fetch('/uploadSearch', searchOption)
  if (!response.ok){
    throw new Error('Failed to send data');
  }
  //Waits for a response
  const data = await response.json();
  //Converts the response to a list
  const mediaList = data.list;
  console.log("you searched for",search);
  document.querySelector('.uploadMedia').innerHTML = "";

  
  //Maps through the list and creates all the needed variables
  mediaList.map(async (item) => {
      const title=item.l;
      const poster = item.i.imageUrl;
      const tag = item.q;
      const stars = item.s;
      const year = item.y;
      const id = item.id

      //Creates a div for every iteration
      const uploadResults = document.createElement('div');
      //Adds the title and poster to the divs
      uploadResults.innerHTML = `<h3>${title}</h3><img src="${poster}" alt="poster" width="100" height="100">`;
      uploadResults.style.cursor = 'pointer';

      //add event listener to the search results
      uploadResults.addEventListener('click', async () => {
        const plotOption ={
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
            body: JSON.stringify({id}) 
          };

          //Requests the plot of the clicked media from the server
          const plotResponse = await fetch('/getPlot', plotOption)
          const plotData = await plotResponse.json();
          const plot = plotData.plot

          //Post all the correct information about the clicked media to the server    
          const postOptions = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({title,poster,tag,stars,year,plot}) 
          };

          //Sends all the relevant data from the clicked media to the server to be added to the database
          fetch('/uploadMedia', postOptions)
          .then(response => {
            if (response.redirected) {
                window.location.href = response.url;
            }
        })
        .catch(error => console.error('Error:', error));
      });
      
      //Appends the div to the document
      document.querySelector('.uploadMedia').appendChild(uploadResults);
    }
)
}catch(error){
  console.error('Error:', error);
}
};
