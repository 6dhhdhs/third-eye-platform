/* =========================================================
 * 第三只眼 · 通用交互工具
 * 提供：轻提示（toast）、确认弹窗（confirm）、URL 参数读取
 * 依赖：无。所有页面在 layout.js 之前引入。
 * ========================================================= */
(function (window, document) {
  "use strict";

  /* ---------- 轻提示 ---------- */
  function toast(title, detail, tone) {
    var host = document.getElementById("te-toast-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "te-toast-host";
      host.className = "fixed right-4 top-20 z-[80] flex flex-col gap-2";
      host.setAttribute("aria-live", "polite");
      host.setAttribute("aria-atomic", "true");
      document.body.appendChild(host);
    }

    var toneMap = {
      success: {
        icon: "verified",
        color: "text-tertiary",
        bg: "bg-tertiary/10",
      },
      info: { icon: "info", color: "text-primary", bg: "bg-primary/10" },
      error: { icon: "error", color: "text-error", bg: "bg-error/10" },
    };
    var t = toneMap[tone] || toneMap.success;

    var node = document.createElement("div");
    node.className =
      "flex max-w-sm items-start gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-floating border border-outline-variant/60 transition-all duration-300 translate-y-[-8px] opacity-0";
    node.innerHTML =
      '<span class="material-symbols-outlined ' +
      t.color +
      ' text-[20px]">' +
      t.icon +
      "</span>" +
      '<div class="flex flex-col gap-0.5">' +
      '<span class="font-label-lg text-label-lg text-on-surface"></span>' +
      (detail
        ? '<span class="font-label-sm text-label-sm text-on-surface-variant"></span>'
        : "") +
      "</div>";
    node.querySelector("span.font-label-lg").textContent = title;
    if (detail) node.querySelector("span.font-label-sm").textContent = detail;

    host.appendChild(node);
    requestAnimationFrame(function () {
      node.classList.remove("translate-y-[-8px]", "opacity-0");
    });

    setTimeout(function () {
      node.classList.add("translate-y-[-8px]", "opacity-0");
      setTimeout(function () {
        node.remove();
      }, 300);
    }, 3200);

    return node;
  }

  /* ---------- 确认弹窗 ---------- */
  function confirmDialog(options) {
    var opts = Object.assign(
      {
        title: "确认操作",
        message: "",
        confirmText: "确认",
        cancelText: "取消",
        danger: false,
      },
      options || {},
    );

    return new Promise(function (resolve) {
      var lastFocus = document.activeElement;

      var overlay = document.createElement("div");
      overlay.className =
        "fixed inset-0 z-[90] flex items-center justify-center bg-on-surface/30 p-4 backdrop-blur-[2px]";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "te-confirm-title");

      overlay.innerHTML =
        '<div class="w-full max-w-md rounded-2xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-floating">' +
        '<h2 id="te-confirm-title" class="font-headline-sm text-headline-sm font-bold text-on-surface"></h2>' +
        '<p class="mt-2 font-body-md text-body-md text-on-surface-variant"></p>' +
        '<div class="mt-6 flex justify-end gap-3">' +
        '<button type="button" data-cancel class="btn-secondary"></button>' +
        '<button type="button" data-ok class="' +
        (opts.danger ? "btn-danger" : "btn-primary") +
        '"></button>' +
        "</div></div>";

      overlay.querySelector("h2").textContent = opts.title;
      overlay.querySelector("p").textContent = opts.message;
      overlay.querySelector("[data-cancel]").textContent = opts.cancelText;
      overlay.querySelector("[data-ok]").textContent = opts.confirmText;

      if (opts.danger) {
        overlay.querySelector("[data-ok]").className =
          "inline-flex items-center justify-center gap-2 rounded-xl border border-error bg-surface-container-lowest px-4 py-2.5 font-label-lg text-label-lg text-error transition-colors hover:bg-error/5 active:scale-[0.98]";
      }

      function close(result) {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
        if (lastFocus && lastFocus.focus) lastFocus.focus();
        resolve(result);
      }

      function onKey(e) {
        if (e.key === "Escape") close(false);
        if (e.key === "Tab") {
          var focusables = overlay.querySelectorAll("button");
          var first = focusables[0];
          var last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }

      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close(false);
      });
      overlay
        .querySelector("[data-cancel]")
        .addEventListener("click", function () {
          close(false);
        });
      overlay.querySelector("[data-ok]").addEventListener("click", function () {
        close(true);
      });
      document.addEventListener("keydown", onKey);

      document.body.appendChild(overlay);
      overlay.querySelector("[data-ok]").focus();
    });
  }

  /* ---------- URL 参数 ---------- */
  function param(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  window.TE = { toast: toast, confirm: confirmDialog, param: param };
})(window, document);
