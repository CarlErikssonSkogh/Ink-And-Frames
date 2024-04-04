document.addEventListener('DOMContentLoaded', (event) => {
    const mediaDivs = document.querySelectorAll('.clickable-media');
    mediaDivs.forEach(div => {
        div.addEventListener('click', function() {
            const mediaName = this.querySelector('#mediaName').textContent;
            console.log(mediaName)
            window.location.href = '/media?name=' + encodeURIComponent(mediaName);
        });
    });
});