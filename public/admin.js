console.log('admin.js loaded');

document.addEventListener('DOMContentLoaded', (event) => {
    const mediaDivs = document.querySelectorAll('.clickable-media');
    const confirmBtn = document.querySelector('#confirmBtn');
    let selectedMediaName = null; //variable to store mediaName

    mediaDivs.forEach(div => {
        div.addEventListener('click', function() {
            //resets background color for all divs
            mediaDivs.forEach(otherDiv => {
                otherDiv.style.backgroundColor = "";
            });

            //set background color for clicked div
            this.style.backgroundColor = "red";

            //stores mediaName of clicked div
            selectedMediaName = this.querySelector('#mediaName').textContent;
        });
    });

    //If the confirm button is clicked it is sent to the backend to be delted
    confirmBtn.addEventListener('click', function() {
        if (selectedMediaName) {
            console.log("clicked")
            const options = {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({mediaName: selectedMediaName})
            };
            fetch('/admin', options)
                .then(response => {
                    if (response.ok) {
                        location.reload();
                    } else {
                        throw new Error('Failed to send data');
                    }
                })
        }
    });
});