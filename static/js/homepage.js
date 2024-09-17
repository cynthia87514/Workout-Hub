window.onload = function() {
    google.accounts.id.initialize({
        client_id: "518368992996-8vt8u21k0c2456r31c185vgt7lgecd62.apps.googleusercontent.com",
        callback: handleCredentialResponse
    });

    document.getElementById("google-login-btn").addEventListener("click", function() {
        google.accounts.id.prompt();
    });
};

function handleCredentialResponse(response) {
    const googleToken = response.credential;

    fetch("/api/user/auth/google", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ token: googleToken })
    })
    .then(response => response.json())
    .then(data => {
        if (data.access_token) {
            localStorage.setItem("token", data.access_token);
            window.location.href = "/start";
        } else {
            console.error("Error logging in with Google:", data);
        }
    })
    .catch(error => {
        console.error("Error logging in with Google:", error);
    });
}

window.addEventListener("scroll", function() {
    const header = document.querySelector("header");
    if (window.scrollY > 0) {
        header.classList.add("solid-header");
        header.classList.remove("transparent-header");
    } else {
        header.classList.add("transparent-header");
        header.classList.remove("solid-header");
    }
});

// 自動播放及暫停的 IntersectionObserver
const videos = document.querySelectorAll("video");
        
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.play();
        } else {
            entry.target.pause();
        }
    });
}, {
    threshold: 0.5
});

videos.forEach(video => {
    observer.observe(video);
});