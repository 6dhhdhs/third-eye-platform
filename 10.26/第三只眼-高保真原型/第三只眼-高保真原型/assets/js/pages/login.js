/* =========================================================
 * 登录 / 注册（PRD 7.2 第 1、2 条）
 * 演示阶段：校验通过后直接进入首页，不连接真实后端。
 * ========================================================= */
(function initAuth() {
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
    errorText.hidden = true;
  }

  tabLogin.addEventListener("click", function () {
    setMode("login");
  });
  tabRegister.addEventListener("click", function () {
    setMode("register");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;
    var nickname = document.getElementById("nickname").value.trim();
    var confirm = document.getElementById("confirm").value;
    var message = "";

    if (mode === "register" && !nickname) message = "请填写昵称。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      message = "请输入有效的邮箱地址。";
    else if (password.length < 8) message = "密码至少需要 8 位字符。";
    else if (mode === "register" && password !== confirm)
      message = "两次输入的密码不一致。";

    if (message) {
      errorText.textContent = message;
      errorText.hidden = false;
      return;
    }

    errorText.hidden = true;
    window.TE.toast(
      mode === "login" ? "登录成功" : "注册成功，请登录",
      mode === "login" ? "正在进入学习工作台…" : "演示阶段将直接进入首页。",
      "success",
    );
    setTimeout(function () {
      window.location.href = "home.html";
    }, 800);
  });

  document.getElementById("forgot").addEventListener("click", function (e) {
    e.preventDefault();
    window.TE.toast(
      "密码找回属 P1 规划",
      "首期可通过课程助教重置演示账号密码。",
      "info",
    );
  });
})();
