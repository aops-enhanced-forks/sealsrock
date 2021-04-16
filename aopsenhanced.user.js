// ==UserScript==
// @name         AoPS Enhanced sealsrock version
// @author       happycupcake/epiccakeking, sealsrock12/sealsrock
// @description  Custom AoPS UserScript.
// @version      0.1
// @namespace    https://toad39.dev
// @match        https://artofproblemsolving.com/*
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

//Add custom stylesheet
var sheet = document.createElement("style");
sheet.innerHTML = `#feed-topic .cmty-topic-moderate{
  display: inline !important;
}
#feed-wrapper .aops-scroll-inner{
  overscroll-behavior: contain;
}
.cmty-post .cmty-post-username{ display: none !important; }

.cmty-post .cmty-phone-poster{
  display: inline-block;
  float: left;
  font-size: 10pt;
	line-height: 12pt;
	margin-right: 5px;
}
.cmty-post-top{
	display: contents;
}
.cmty-post .cmty-avatar{
  height: 40px;
  width: 40px;
}
.cmty-post-left{
  width: 50px !important;
  padding: 5px;
}
.cmty-post-num-posts{
  display: none !important;
}
.cmty-post-html{
	margin-right: -50px !important;
}

#top-bar{
	display: none;
}
#header{
	margin: 0px !important;
}
#small-footer-wrapper{
	display: none !important;
}
`;
document.documentElement.appendChild(sheet);

// Credit to @happycupcake for hide/quote unblocker.

function hideunblocker(post_text) {
  let ret = "";
  let depth = -1;
  post_text.split("[hide").forEach((fragment) => {
    if (depth == 3) {
      ret += "$\\phantom{[/hide]}$[hide" + fragment;
    } else if (depth == -1) {
      ret += fragment;
    } else {
      ret += "[hide" + fragment;
      depth++;
    }
    for (var i of fragment.matchAll(/\[\/hide]/g)) {
      depth--;
    }
    if (depth < 0) {
      depth = 0;
    }
  });
  return ret;
}

function quoteunblocker(post_text) {
  let ret = "";
  let depth = -1;
  post_text.split("[quote").forEach((fragment) => {
    if (depth == 3) {
      ret += "$\\phantom{[/quote]}$[quote" + fragment;
    } else if (depth == -1) {
      ret += fragment;
    } else {
      ret += "[quote" + fragment;
      depth++;
    }
    for (var i of fragment.matchAll(/\[\/quote]/g)) {
      depth--;
    }
    if (depth < 0) {
      depth = 0;
    }
  });
  return ret;
}

function hbunblocker(text) {
    return hideunblocker(quoteunblocker(text));
}

// Wait until document is ready.
document.addEventListener("DOMContentLoaded", function () {
  // Safety first!
  if (AoPS && AoPS.Community) {
    // Better quotes
    AoPS.Community.Views.Post.prototype.onClickQuote = function (e) {
      if (e.ctrlKey) {
        this.topic.appendToReply(
          `[url=https://aops.com/community/p${this.model.get(
            "post_id"
          )}]${this.model.get("username")} (${this.model.get("topic_id")}:${this.model.get(
            "post_number"
          )})[/url]`);
      } else if (e.shiftKey) {
        this.topic.appendToReply(hbunblocker(`[quote name="${this.model.get(
          "username"
        )}" url="/community/p${this.model.get("post_id")}"]
${this.model.get("post_canonical").trim()}
[/quote]\n\n`));
      } else {
          this.topic.appendToReply(hbunblocker(`[hide=${this.model.get(
            "username"
          )} (#${this.model.get("post_number")})]
[url="https://artofproblemsolving.com/community/p${this.model.get(
            "post_id"
          )}"]Original Post[/url]
${this.model.get("post_canonical").trim()}\n[/hide]\n\n`));
      }
    };

    // Copy links
    AoPS.Community.Views.Post.prototype.onClickDirectLink = function (e) {
      navigator.clipboard.writeText(
        "https://aops.com/community/p" + this.model.get("post_id")
      );
      AoPS.Ui.Flyout.display(
        "Url copied (https://aops.com/community/p" +
          this.model.get("post_id") +
          ")."
      );
    };

    //Notifications
    Notification.requestPermission().then((permission) => {
      if (permission == "granted") {
        AoPS.Ui.Flyout.display = function (x) {
          var textextract = document.createElement("div");
          textextract.innerHTML = x.replace("<br>", "\n");
          var y = $(textextract).text();
          var notification = new Notification("AoPS", {
            body: y,
            icon: "https://artofproblemsolving.com/online-favicon.ico",
            tag: y
          });
          setTimeout(notification.close.bind(notification), 4000);
        };
      }
    });
    //Change post deleted action
    AoPS.Community.Views.Post.prototype.removePostFromTopic =
      AoPS.Community.Views.Post.prototype.setVisibility;

    //Allow editing in locked topics
    AoPS.Community.Views.Post.prototype["render"] = new Function(
      "a",
      AoPS.Community.Views.Post.prototype["render"]
        .toString()
        .replace(/^function[^{]+{/i, "var e=AoPS.Community.Lang;")
        .replace(
          "can_edit:",
          "can_edit: this.topic.model.attributes.permissions.c_can_edit ||"
        )
        .replace(/}[^}]*$/i, "")
    );
  }
});
