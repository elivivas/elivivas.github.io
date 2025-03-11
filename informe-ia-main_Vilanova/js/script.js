document.addEventListener('DOMContentLoaded', function() {
    const chartContainer = document.getElementById('chart-container');
    const lineContainer = document.getElementById('line-container');
    const centerLine = document.querySelector('.center-line');
    
    let animationTriggered = false;

    function checkScroll() {
        if (animationTriggered) return;

        const chartBottom = chartContainer.offsetTop + chartContainer.offsetHeight;
        const scrollPosition = window.scrollY + window.innerHeight;

        if (scrollPosition > chartBottom) {
            centerLine.classList.add('animate');
            animationTriggered = true;
            window.removeEventListener('scroll', checkScroll);
        }
    }

    window.addEventListener('scroll', checkScroll);
    checkScroll(); // Comprueba la posición inicial por si ya estamos más abajo en la página
});