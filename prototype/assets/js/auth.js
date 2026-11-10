/* =========================================================
 * 第三只眼 · 登录态与用户信息
 * 职责：
 *   1. 调用后端 /api/auth/* 完成真实注册、登录、退出
 *   2. token 与用户信息按「记住我」分别存 localStorage / sessionStorage
 *   3. 受保护页面无 token 时跳转登录页
 *   4. 把当前用户昵称、头像首字、角色写回页面
 *
 * 依赖：ui.js（TE.toast / TE.confirm）
 * 引入顺序：ui.js → layout.js → auth.js → 页面脚本
 * ========================================================= */
(function (window, document) {
  "use strict";

  var TOKEN_KEY = "te.auth.token";
  var USER_KEY = "te.auth.user";

  var API_BASE = (
    window.TE_API_BASE ||
    (window.location.hostname
      ? window.location.protocol + "//" + window.location.hostname + ":3000"
      : "http://127.0.0.1:3000")
  ).replace(/\/$/, "");

  var PUBLIC_PAGES = { index: 1, login: 1, "404": 1 };
  var ROLE_LABELS = {
    student: "师范生",
    teacher: "指导教师",
    admin: "管理员",
  };

  /* ---------------- 本地存储 ---------------- */

  function readStorage(storage, key) {
    try {
      return storage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStorage(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch (error) {
      /* 隐私模式下可能被拒绝，登录态降级为本次页面 */
    }
  }

  function removeStorage(storage, key) {
    try {
      storage.removeItem(key);
    } catch (error) {
      /* ignore */
    }
  }

  function getToken() {
    return (
      readStorage(window.sessionStorage, TOKEN_KEY) ||
      readStorage(window.localStorage, TOKEN_KEY)
    );
  }

  function getStoredUser() {
    var raw =
      readStorage(window.sessionStorage, USER_KEY) ||
      readStorage(window.localStorage, USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  }

  function saveSession(token, user, remember) {
    clearSession();
    var storage = remember ? window.localStorage : window.sessionStorage;
    writeStorage(storage, TOKEN_KEY, token);
    writeStorage(storage, USER_KEY, JSON.stringify(user));
  }

  function updateStoredUser(user) {
    if (!user) return;
    if (readStorage(window.sessionStorage, TOKEN_KEY)) {
      writeStorage(window.sessionStorage, USER_KEY, JSON.stringify(user));
    } else if (readStorage(window.localStorage, TOKEN_KEY)) {
      writeStorage(window.localStorage, USER_KEY, JSON.stringify(user));
    }
  }

  function clearSession() {
    removeStorage(window.sessionStorage, TOKEN_KEY);
    removeStorage(window.sessionStorage, USER_KEY);
    removeStorage(window.localStorage, TOKEN_KEY);
    removeStorage(window.localStorage, USER_KEY);
  }

  /* ---------------- API 请求 ---------------- */

  function apiError(response, json) {
    var message =
      (json && json.error && json.error.message) || "请求失败，请稍后重试。";
    var error = new Error(message);
    error.status = response.status;
    error.code = json && json.error && json.error.code;
    error.details = json && json.error && json.error.details;
    return error;
  }

  function request(path, options) {
    options = options || {};
    var headers = { "Content-Type": "application/json" };
    var token = getToken();
    if (token) headers.Authorization = "Bearer " + token;

    return window
      .fetch(API_BASE + path, {
        method: options.method || "GET",
        headers: headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      })
      .then(function (response) {
        return response.text().then(function (text) {
          var json = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch (error) {
            json = null;
          }

          if (!response.ok || !json || json.ok !== true) {
            var error = apiError(response, json);
            if (response.status === 401 && path !== "/api/auth/login") {
              clearSession();
            }
            throw error;
          }

          return json.data;
        });
      })
      .catch(function (error) {
        if (error instanceof TypeError) {
          var networkError = new Error(
            "无法连接后端 API。请确认后端已启动（" +
              API_BASE +
              "），并通过 http://localhost:4173 打开页面。",
          );
          networkError.code = "NETWORK_ERROR";
          throw networkError;
        }
        throw error;
      });
  }

  /* ---------------- 认证接口 ---------------- */

  function login(email, password, remember) {
    return request("/api/auth/login", {
      method: "POST",
      body: { email: email, password: password, remember: Boolean(remember) },
    }).then(function (data) {
      saveSession(data.token, data.user, Boolean(remember));
      return data.user;
    });
  }

  function register(payload) {
    return request("/api/auth/register", {
      method: "POST",
      body: {
        nickname: payload.nickname,
        email: payload.email,
        password: payload.password,
        confirmPassword: payload.confirmPassword,
      },
    }).then(function (data) {
      return data.user;
    });
  }

  function fetchMe() {
    return request("/api/auth/me").then(function (data) {
      updateStoredUser(data.user);
      return data.user;
    });
  }

  function logout() {
    var token = getToken();
    var finish = function () {
      clearSession();
      window.location.replace(loginPageUrl());
    };

    if (!token) {
      finish();
      return Promise.resolve();
    }

    return window
      .fetch(API_BASE + "/api/auth/logout", {
        method: "POST",
        headers: { Authorization: "Bearer " + token },
      })
      .catch(function () {
        /* 网络失败也允许本地退出 */
      })
      .then(finish);
  }

  /* ---------------- 页面渲染 ---------------- */

  function firstChar(value) {
    var text = String(value || "").trim();
    if (!text) return "?";
    return Array.from(text)[0];
  }

  function applyUser(user) {
    if (!user || !user.nickname) return;

    var nameNodes = document.querySelectorAll("[data-user-name]");
    for (var i = 0; i < nameNodes.length; i += 1) {
      nameNodes[i].textContent = user.nickname;
    }

    var initialNodes = document.querySelectorAll("[data-user-initial]");
    for (var j = 0; j < initialNodes.length; j += 1) {
      initialNodes[j].textContent = firstChar(user.nickname);
    }

    var roleText = ROLE_LABELS[user.role] || "学习者";
    var roleNodes = document.querySelectorAll("[data-user-role]");
    for (var k = 0; k < roleNodes.length; k += 1) {
      roleNodes[k].textContent = roleText;
    }

    var emailNodes = document.querySelectorAll("[data-user-email]");
    for (var m = 0; m < emailNodes.length; m += 1) {
      emailNodes[m].textContent = user.email || "—";
    }
  }

  /* ---------------- 路由守卫 ---------------- */

  function loginPageUrl() {
    return window.location.pathname.indexOf("/pages/") !== -1
      ? "login.html"
      : "pages/login.html";
  }

  function redirectToLogin() {
    var file = window.location.pathname.split("/").pop() || "home.html";
    var next = file + window.location.search;
    window.location.replace(
      loginPageUrl() + "?next=" + encodeURIComponent(next),
    );
  }

  function guardPage() {
    var page = document.body.getAttribute("data-page") || "";
    if (PUBLIC_PAGES[page]) {
      // 已登录用户打开登录页时给出提示，但不强制跳转，方便切换账号
      if (page === "login" && getToken()) {
        fetchMe()
          .then(function (user) {
            window.TE.toast(
              "当前已登录",
              "账号：" + user.nickname + "，可直接进入首页。",
              "info",
            );
          })
          .catch(function () {
            /* token 失效时 request 已清理，停留登录页即可 */
          });
      }
      return;
    }

    if (!getToken()) {
      redirectToLogin();
      return;
    }

    var cached = getStoredUser();
    if (cached) applyUser(cached);

    fetchMe()
      .then(function (user) {
        applyUser(user);
      })
      .catch(function (error) {
        if (error.code === "NETWORK_ERROR") {
          window.TE.toast(
            "后端未连接",
            "当前显示的是缓存账号信息，请启动 API 服务。",
            "error",
          );
          return;
        }
        if (!getToken()) redirectToLogin();
      });
  }

  /* ---------------- 退出按钮 ---------------- */

  function bindLogoutButtons() {
    var buttons = document.querySelectorAll("[data-logout]");
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].addEventListener("click", function (event) {
        event.preventDefault();
        var run = function () {
          logout();
        };
        if (window.TE && window.TE.confirm) {
          window.TE
            .confirm({
              title: "退出登录",
              message: "退出后需要重新输入邮箱和密码。",
              confirmText: "退出",
              danger: true,
            })
            .then(function (ok) {
              if (ok) run();
            });
        } else {
          run();
        }
      });
    }
  }

  /* ---------------- 初始化 ---------------- */

  window.TE_AUTH = {
    API_BASE: API_BASE,
    login: login,
    register: register,
    logout: logout,
    fetchMe: fetchMe,
    getToken: getToken,
    getUser: getStoredUser,
    applyUser: applyUser,
    clearSession: clearSession,
  };

  guardPage();

  // layout.js 在 DOMContentLoaded 时才注入顶栏，因此要在它之后
  // 再写一次昵称并绑定顶栏的退出按钮。
  function afterLayoutReady() {
    var cached = getStoredUser();
    if (cached) applyUser(cached);
    bindLogoutButtons();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", afterLayoutReady);
  } else {
    afterLayoutReady();
  }
})(window, document);
