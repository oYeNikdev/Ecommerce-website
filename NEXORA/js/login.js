const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login-form-submit");
const btnText = document.getElementById("btn-text");
const loginErrorMsg = document.getElementById("login-error-msg");
const togglePasswordBtn = document.getElementById("toggle-password");
const rememberMe = document.getElementById("remember-me");
const capsWarning = document.getElementById("caps-warning");
const forgotLink = document.getElementById("forgot-link");
const themeToggle = document.getElementById("theme-toggle");

const validUser = { username: "user", password: "web_dev" };
const maxAttempts = 5;
const lockoutSeconds = 30;
const redirectUrl = "index.html";
const lockKey = "nexoraLockUntil";

let loginAttempts = 0;
let lockTimer = null;

function showMessage(text, type = "error") {
  loginErrorMsg.textContent = text;
  loginErrorMsg.className = type;
}

function hideMessage() {
  loginErrorMsg.textContent = "";
  loginErrorMsg.className = "";
}

function setButton(label, disabled = false, loading = false) {
  btnText.textContent = label;
  loginButton.disabled = disabled;
  loginButton.classList.toggle("loading", loading);
}

function shake() {
  loginForm.classList.remove("shake");
  void loginForm.offsetWidth;
  loginForm.classList.add("shake");
}

function startLockout(until) {
  clearInterval(lockTimer);
  showMessage("Too many failed attempts. Please try again later.");

  const tick = () => {
    const secondsLeft = Math.ceil((until - Date.now()) / 1000);
    if (secondsLeft <= 0) {
      clearInterval(lockTimer);
      localStorage.removeItem(lockKey);
      loginAttempts = 0;
      setButton("Login");
      hideMessage();
      return;
    }
    setButton(`Try again in ${secondsLeft}s`, true);
  };

  tick();
  lockTimer = setInterval(tick, 1000);
}

const savedLock = Number(localStorage.getItem(lockKey));
if (savedLock > Date.now()) startLockout(savedLock);

function handleSuccess(username) {
  loginAttempts = 0;
  const storage = rememberMe.checked ? localStorage : sessionStorage;
  storage.setItem("isLoggedIn", "true");
  storage.setItem("username", username);
  showMessage("Login successful. Redirecting...", "success");
  setTimeout(() => { window.location.href = redirectUrl; }, 1000);
}

function handleFailure() {
  loginAttempts++;
  passwordInput.value = "";
  passwordInput.focus();
  shake();

  if (loginAttempts >= maxAttempts) {
    const until = Date.now() + lockoutSeconds * 1000;
    localStorage.setItem(lockKey, until);
    startLockout(until);
    return;
  }

  showMessage(`Invalid username or password. ${maxAttempts - loginAttempts} attempt(s) remaining.`);
  setButton("Login");
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (loginButton.disabled) return;

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  hideMessage();
  usernameInput.classList.remove("invalid");
  passwordInput.classList.remove("invalid");

  if (!username || !password) {
    if (!username) usernameInput.classList.add("invalid");
    if (!password) passwordInput.classList.add("invalid");
    showMessage("Please enter your username and password.");
    shake();
    (username ? passwordInput : usernameInput).focus();
    return;
  }

  setButton("Logging in...", true, true);
  setTimeout(() => {
    if (username === validUser.username && password === validUser.password) {
      handleSuccess(username);
    } else {
      handleFailure();
    }
  }, 800);
});

[usernameInput, passwordInput].forEach((input) => {
  input.addEventListener("input", () => {
    input.classList.remove("invalid");
    if (!loginButton.disabled) hideMessage();
  });
});

togglePasswordBtn.addEventListener("click", () => {
  const showing = passwordInput.type === "password";
  passwordInput.type = showing ? "text" : "password";
  togglePasswordBtn.textContent = showing ? "Hide" : "Show";
  togglePasswordBtn.setAttribute("aria-label", showing ? "Hide password" : "Show password");
  togglePasswordBtn.setAttribute("aria-pressed", String(showing));
});

passwordInput.addEventListener("keyup", (event) => {
  capsWarning.hidden = !event.getModifierState("CapsLock");
});
passwordInput.addEventListener("blur", () => { capsWarning.hidden = true; });

forgotLink.addEventListener("click", (event) => {
  event.preventDefault();
  showMessage("Password reset is not set up in this demo yet.", "info");
});

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
});
