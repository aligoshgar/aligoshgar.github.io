const textContainer = document.getElementById("typed-text");
const phrases = ["Yüksək keyfiyyət!", "Nəticəyə zəmanət!", "Əyani tədris!", "Onlayn tədris!", "Münasib qiymət!"];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    let currentPhrase = phrases[phraseIndex];
    if (isDeleting) {
        textContainer.textContent = currentPhrase.substring(0, charIndex--);
    } else {
        textContainer.textContent = currentPhrase.substring(0, charIndex++);
    }

    if (!isDeleting && charIndex === currentPhrase.length) {
        setTimeout(() => isDeleting = true, 1000);
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
    }

    setTimeout(typeEffect, isDeleting ? 50 : 100);
}

typeEffect();