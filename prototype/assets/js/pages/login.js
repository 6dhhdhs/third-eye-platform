/* =========================================================
 * 登录 / 注册（PRD 7.2 第 1、2 条，F-01）
 * 已接入后端 /api/auth/*：注册写库，登录拿 JWT。
 * ========================================================= */
(function initAuthPage() {
  "use strict";

  var tabLogin = document.getElementById("tabLogin");
  var tabRegister = document.getElementById("tabRegister");
  var form = document.getElementById("authForm");
  var title = document.getElementById("formTitle");
  var subtitle = document.getElementById("formSubtitle");
  var nicknameField = document.getElementById("nicknameField");
  var confirmField = document.getElementById("confirmField");
  var submitBtn = document.getElementById("submitBtn");
  var errorText = document.getElementById("errorText");
  var emailInput = document.getElementById("email");
  var passwordInput = document.getElementById("password");
  var confirmInput = document.getElementById("confirm");
  var nicknameInput = document.getElementById("nickname");
  var showPassword = document.getElementById("showPassword");
  var rememberInput = document.getElementById("remember");
  var mode = "login";

  function setMode(next) {
    mode = next;
    var isLogin = mode === "login";

    tabLogin.setAttribute("aria-selected", String(isLogin));
    tabRegister.setAttribute("aria-selected", String(!isLogin));
    tabLogin.classList.toggle("is-on", isLogin);
    tabRegister.classList.toggle("is-on", !isLogin);

    title.textContent = isLogin ? "欢迎回来" : "创建账号";
    subtitle.textContent = isLogin
      ? "登录后继续你的课堂观察与 AI 评教案训练。"
      : "注册后即可开始课堂观察与 AI 评教案训练。";
    nicknameField.hidden = isLogin;
    confirmField.hidden = isLogin;
    submitBtn.textContent = isLogin ? "登录" : "注册";
    passwordInput.autocomplete = isLogin ? "current-password" : "new-password";
    errorText.hidden = true;
  }

  function showError(message) {
    errorText.textContent = message;
    errorText.hidden = false;
  }

  function fieldMessage(error) {
    if (error.details) {
      var keys = Object.keys(error.details);
      for (var i = 0; i < keys.length; i += 1) {
        if (error.details[keys[i]]) return error.details[keys[i]];
      }
    }
    return error.message || "操作失败，请稍后重试。";
  }

  function setBusy(busy, label) {
    submitBtn.disabled = busy;
    if (busy) {
      submitBtn.textContent = label;
    } else {
      submitBtn.textContent = mode === "login" ? "登录" : "注册";
    }
  }

  function validate() {
    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var nickname = nicknameInput.value.trim();
    var confirm = confirmInput.value;

    if (mode === "register" && !nickname) return "请填写昵称。";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return "请输入有效的邮箱地址。";
    if (password.length < 8) return "密码至少需要 8 位字符。";
    if (mode === "register" && password !== confirm)
      return "两次输入的密码不一致。";
    return "";
  }

  function nextPage() {
    var next = window.TE.param("next");
    if (!next) return "home.html";
    var file = next.split("?")[0];
    return /^[A-Za-z0-9_-]+\.html$/.test(file) ? file : "home.html";
  }

  tabLogin.addEventListener("click", function () {
    setMode("login");
  });

  tabRegister.addEventListener("click", function () {
    setMode("register");
  });

  showPassword.addEventListener("change", function () {
    var type = showPassword.checked ? "text" : "password";
    passwordInput.type = type;
    confirmInput.type = type;
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    if (!window.TE_AUTH) {
      showError("登录模块未加载，请刷新页面后重试。");
      return;
    }

    var message = validate();
    if (message) {
      showError(message);
      return;
    }

    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var nickname = nicknameInput.value.trim();
    var confirm = confirmInput.value;

    errorText.hidden = true;
    setBusy(true, mode === "login" ? "登录中…" : "注册中…");

    var task;
    if (mode === "login") {
      task = window.TE_AUTH
        .login(email, password, rememberInput.checked)
        .then(function (user) {
          window.TE.toast(
            "登录成功",
            "欢迎回来，" + user.nickname + "。",
            "success",
          );
          setTimeout(function () {
            window.location.href = nextPage();
          }, 500);
        });
    } else {
      task = window.TE_AUTH
        .register({
          nickname: nickname,
          email: email,
          password: password,
          confirmPassword: confirm,
        })
        .then(function (user) {
          window.TE.toast(
            "注册成功，请登录",
            "账号已写入数据库：" + user.email,
            "success",
          );
          setMode("login");
          emailInput.value = email;
          passwordInput.value = "";
          confirmInput.value = "";
          passwordInput.focus();
        });
    }

    task
      .catch(function (error) {
        var text = fieldMessage(error);
        showError(text);
        window.TE.toast(
          mode === "login" ? "登录失败" : "注册失败",
          text,
          "error",
        );
      })
      .then(function () {
        setBusy(false);
      });
  });

  document.getElementById("forgot").addEventListener("click", function (e) {
    e.preventDefault();
    window.TE.toast(
      "密码找回属 P1 规划",
      "首期可通过课程助教重置账号密码。",
      "info",
    );
  });

  setMode("login");
})();
