// 定義變數及初始化
let currentUserInfo = null; // 全局變量，保存使用者資料
const workoutHubButton = document.querySelector(".left");
const startButton = document.querySelector(".start");
const recordsButton = document.querySelector(".records");
const dietButton = document.querySelector(".diet");
const profileButton = document.querySelector(".profile");
const logoutButton = document.querySelector(".logout");
const loginButton = document.querySelector(".login");

// 定義函數
// 檢查使用者登入狀態
async function checkAuth() {
    const token = localStorage.getItem("token");

    if (token) {
        try {
            const response = await fetch("/api/user/auth", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.is_token_valid) {
                    currentUserInfo = data; // 將使用者資料保存到全局變量
                    renderAuthPage();
                } else {
                    alert("Your session has expired. Please log in again.");
                    logoutUser();
                }
            } else {
                alert("Your session has expired. Please log in again.");
                logoutUser();
            }
        } catch (error) {
            console.error("Error checking token status:", error);
            logoutUser();
        }
    } else {
        if (window.location.pathname !== "/") {
            window.location.href = "/";
        } else {
            renderUnauthPage();
        }
    }
}
// 畫面渲染
function renderAuthPage() {
    startButton.classList.remove("hide");
    recordsButton.classList.remove("hide");
    dietButton.classList.remove("hide");
    profileButton.classList.remove("hide");
    logoutButton.classList.remove("hide");
    loginButton.classList.add("hide");
}
function renderUnauthPage() {
    startButton.classList.add("hide");
    recordsButton.classList.add("hide");
    dietButton.classList.add("hide");
    profileButton.classList.add("hide");
    logoutButton.classList.add("hide");
    loginButton.classList.remove("hide");
}
// 登出
function logoutUser() {
    localStorage.removeItem("token");
    sessionStorage.removeItem("recentLogin");
    // 清除全局變量中的使用者資訊
    currentUserInfo = null;

    if (window.location.pathname === "/") {
        window.location.reload();
    } else {
        window.location.href = "/";
    }
}
// Dialog 相關功能
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.style.display = "flex";
    setTimeout(() => {
        modal.classList.add("show");
    }, 10);
}
function closeModal() {
    const modals = document.querySelectorAll(".auth-modal");
    modals.forEach(modal => {
        modal.classList.remove("show");
        setTimeout(() => {
            modal.style.display = "none";
        }, 500);
    });
}
function switchModal(targetModalId) {
    const currentModal = document.querySelector(".auth-modal.show");
    const targetModal = document.getElementById(targetModalId);

    currentModal.classList.remove("show");
    setTimeout(() => {
        currentModal.style.display = "none";
        targetModal.style.display = "flex";
        setTimeout(() => {
            targetModal.classList.add("show");
        }, 10);
    }, 500);
}
// 驗證相關功能
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}
function validatePassword(password) {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return re.test(password);
}
function validateSignupForm() {
    const email = document.getElementById("registerEmail").value;
    const password = document.getElementById("registerPassword").value;

    if (!validateEmail(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    if (!validatePassword(password)) {
        alert("Password must be at least 8 characters long and include at least one number, one uppercase letter, and one lowercase letter.");
        return false;
    }

    return true;
}
// 登入及註冊相關功能
async function registerUser(event) {
    event.preventDefault();
    if (!validateSignupForm()) return;

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("/api/user/auth", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert("Registration failed: " + errorData.detail);
        } else {
            alert("Registration successful");
            switchModal("loginDialog");
        }
    } catch (error) {
        alert("An error occurred: " + error.message);
    }
}
async function loginUser(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("/api/user/auth", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert("Login failed: " + errorData.detail);
        } else {
            const result = await response.json();
            localStorage.setItem("token", result.access_token);
            closeModal();
            checkAuth();
            window.location.href = "/start";
        }
    } catch (error) {
        alert("An error occurred: " + error.message);
    }
}

// 主邏輯和事件監聽
// 檢查使用者登入狀態
document.addEventListener("DOMContentLoaded", async function() {
    await checkAuth(); // 等待 checkAuth 完成

    // 在 checkAuth 完成後，初始化頁面
    if (window.location.pathname === "/profile") {
        initializeProfilePage();
    }
});

// 定義 header 上每個按鍵的功能
workoutHubButton.addEventListener("click", () => {
    window.location.href = "/";
});

startButton.addEventListener("click", () => {
    window.location.href = "/start";
});

recordsButton.addEventListener("click", () => {
    window.location.href = "/records";
})

dietButton.addEventListener("click", () => {
    window.location.href = "/diet";
})

profileButton.addEventListener("click", () => {
    window.location.href = "/profile";
})

logoutButton.addEventListener("click", () => {
    logoutUser();
});

loginButton.addEventListener("click", () => {
    openModal("loginDialog");
});

// Dialog 相關功能
document.querySelectorAll(".auth-close").forEach(btn => {
    btn.addEventListener("click", () => {
        closeModal();
    });
});

window.addEventListener("click", event => {
    if (event.target.classList.contains("auth-modal")) {
        closeModal();
    }
});

document.querySelectorAll(".switch-modal").forEach(btn => {
    btn.addEventListener("click", (event) => {
        const targetModalId = event.target.dataset.target;
        switchModal(targetModalId);
    });
});