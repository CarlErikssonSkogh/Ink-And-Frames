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

function dropdownFunction(e) {
    e.stopPropagation();
    document.getElementById("myDropdown").classList.toggle("show");
}

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