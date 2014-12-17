// content.js has access to DOM

// background.js:chrome.pageAction.onClicked calls this function
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    //console.log("unsubscribe-button:content.js:onRequest");
    tryToUnsubscribe();
});
function UnsubscribeButton() {
}
UnsubscribeButton.timeoutRef = null;

function tryToUnsubscribe() {
    var topButton = getGmailUnsubscribeTopButton();
    if (topButton) {
        console.log("unsubscribe-button:topButton found");
        clickGmailUnsubscribeButtons(topButton);
        unsubSuccess();
    } else {
        console.log("unsubscribe-button:topButton NOT found");
        openBestUnsubLinkInEmailBody();
    }
}


function getUnsubLinks() {
    var unsubLinks = getLinksMatching(/unsub|optout|opt out|opt-out/i);
    if (unsubLinks.length === 0) {
        // less likely to work than above, but nice fallback
        unsubLinks = getLinksMatching(/click here|clickhere/i); 
    }
    if (unsubLinks.length === 0) {
        // EVEN less likely to work than above, but another  fallback
        unsubLinks = getLinksMatching(/here/i); 
    }
    return unsubLinks;
}

function getGmailUnsubscribeTopButton() {
/*
 * Unsub Gmail top:
   <h3 class="iw">
       <span email="Expedia@expediamail.com" name="Expedia.com" class="gD"> Expedia.com</span>
       <span class="go">
           <span aria-hidden="true"> &lt;</span> Expedia@expediamail.com<span aria-hidden="true"> &gt;</span>
       </span>
       <span class="Ca" idlink="" tabindex="0">Unsubscribe</span>
   </h3>
   */
    var nodes = getNodesMatching("span", /^Unsubscribe$/);
    if (nodes) {
        return nodes[0];
    } else {
        return null;
    }
}

function getGmailUnsubscribeDialogButton() {
    /*
     * unsub button:
     <div class="Kj-JD-Jl">
         <button name="s" class="J-at1-auR J-at1-atl">Unsubscribe</button>
         <button name="cancel">Cancel</button>
     </div>
     */
    var nodes = getNodesMatching("button", /^Unsubscribe$/);
    if (nodes) {
        return nodes[0];
    } else {
        return null;
    }
}

function getNodesMatching(tagName, innerTextPattern, className) {
    /*
     * tagName: "a", "span", "div", etc
     * innerTextPattern: regexp to match innerText of node
     * className: optional, if supplied nodes that match innerTextPattern must also be of className
     */
    className = className || false;
    console.log("unsubscribe-button:className:");
    console.log(className);
    var nodes = document.getElementsByTagName(tagName);
    var matchedNodes = [];
    for (var i in nodes) {
        if (nodes[i].innerText && nodes[i].innerText.match(innerTextPattern)) {
            console.log("unsubscribe-button:pattern matched node: " + tagName + " : " + innerTextPattern.toString() + " : " + nodes[i].innerText);
            if (!className || hasClass(nodes[i], className)) {
                console.log("unsubscribe-button:className matched");
                matchedNodes.push(nodes[i]);
            } else {
                console.log("unsubscribe-button:className failed match");
            }

        }
    }
    return matchedNodes;
}

function hasClass(element, className) {
    return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
}

function causeEventToFire(element, eventType){
    if (element.fireEvent) {
        element.fireEvent('on' + eventType);
    } else {
        var evObj = document.createEvent('Events');
        evObj.initEvent(eventType, true, false);
        element.dispatchEvent(evObj);
    }
}

function getLinksMatching(pattern) {
    return getNodesMatching("a", pattern);
}

function chooseBestUnsubLink(unsubLinks) {
    for (var i = unsubLinks.length - 1; i >= 0; i--) { // start at end, as unsub link typically at bottom
        if (unsubLinks[i].href) {
            return unsubLinks[i];
        }
    }
    return null;
}

function openBestUnsubLinkInEmailBody() {
    var unsubLinks = getUnsubLinks();
    var link = chooseBestUnsubLink(unsubLinks);
    if (link) {
        unsubSuccess();
        console.log("unsubscribe-button:unsub link found: " + link.href.toString());
        var win = window.open(link.href, '_blank');
        win.focus();
    } else {
        console.log("unsubscribe-button:unsub link NOT found");
        displayModalForTime("Couldn't find unsubscribe link.<br />Use the \"!\" shortcut to report spam.<br /><br />¯\\_(ツ)_/¯", 5000);
    }
}

function clickGmailUnsubscribeButtons(topButton) {
    console.log("unsubscribe-button:clickGmailUnsubscribeButtons");
    causeEventToFire(topButton, "click");
    setTimeout(clickGmailDialogButton, 500);
}

function clickGmailDialogButton() {
    console.log("unsubscribe-button:clickGmailDialogButton");
    var dialogButton = getGmailUnsubscribeDialogButton();
    if (dialogButton) {
        console.log("unsubscribe-button:dialogButton found");
        causeEventToFire(dialogButton, "click");
        displayModalForTime("Unsubscribed!", 2000);
    } else {
        console.log("unsubscribe-button:dialogButton NOT found");
        openBestUnsubLinkInEmailBody();
    }
}

function removeModalElement() {
    var modal = document.getElementById('unsubscribe-button-chrome');
    if (modal) {
        document.body.removeChild(modal);
    }
}
function createModalElement(modalText) {
    var modal = document.createElement("div");
    modal.setAttribute("id", "unsubscribe-button-chrome");
    modal.style['z-index'] = '99999999';
    modal.style.top = '50px';
    modal.style.position = 'absolute';
    modal.style.left = '50%';

    var modalInner = document.createElement("div");
    modalInner.setAttribute("id", "unsubscribe-button-chrome-modal-inner");
    modalInner.style.position = 'relative';
    modalInner.style.left = '-50%';
    modalInner.style.padding = '15px';
    modalInner.style['background-color'] = 'rgba(0,0,0,0.7)';
    modalInner.style['text-align'] = 'center';
    modalInner.style['font-size'] = '16px';
    modalInner.style.color = '#fff';
    modalInner.innerHTML = modalText;

    modal.appendChild(modalInner);
    return modal;

}

function displayModalForTime(modalText, millisecondsToDisplay) {
    var modal = createModalElement(modalText);
    document.body.appendChild(modal);
    setTimeout(function() { removeModalElement(); }, millisecondsToDisplay);
}

function shouldNotRespondToKeyboardShortcut(element) {
    if (!element) return false;
    if (element.nodeName == "INPUT" || element.nodeName == "TEXTAREA") return true;
    // check class of special elements, like message body
    var cls = element.getAttribute('class');
    if (cls && cls.indexOf && cls.indexOf('editable') != -1) return true; // message body field
    return false;
}

// Use "$" as a keyboard shortcut you can use instead of clicking button in
// address bar
function unsubscribeKeyboardShortcutListener(e) {
    if (shouldNotRespondToKeyboardShortcut(document.activeElement)) return;
    if (e.shiftKey && e.keyCode ==  52) { // shift + 4 = $
        tryToUnsubscribe();
    }
}

function urlIsGmail(url) {
    return url.match(/mail\.google\.com/i);
}

function registerUnsubscribeKeyboardShortcutListener(reregister) {
    if (!urlIsGmail(document.URL)) return;
    if (!reregister && unsubscribeKeyboardShortcutListener.isSet === true) return;
    document.addEventListener('keyup', unsubscribeKeyboardShortcutListener, false);
    unsubscribeKeyboardShortcutListener.isSet = true;
}

function getUnsubCount(callback) {
    chrome.storage.sync.get({"UNSUBSCRIBE_BUTTON_COUNT": 0}, function (obj) {
        console.log('unsubscribe-button:sync.get', obj);
        callback(obj["UNSUBSCRIBE_BUTTON_COUNT"]);
    });
}

function incrementUnsubCount() {
    getUnsubCount(function(unsubCount) {
        console.log("unsubscribe-button:UNSUBSCRIBE_BUTTON_COUNT", unsubCount);
        var data = {"UNSUBSCRIBE_BUTTON_COUNT": unsubCount + 1};
        chrome.storage.sync.set(data, function() {console.log('unsubscribe-button:sync.set', data);});
    });
}

function unsubSuccess() {
    incrementUnsubCount();
    addUnsubShareNode();
}

// Find the Google+ node near top right of page.
// We'll append an Unsub Count to the left of this.
function getPlusNameNode() {
    var plusLinks = getLinksMatching(/^\+/);
    console.log("unsubscribe-button:plusLinks", plusLinks);
    for (var i = 0; i < plusLinks.length; i++) {
        var l = plusLinks[i];
        if (l.href.match(/plus\.google\.com/)) {
            console.log("unsubscribe-button:Plus Node", l);
            return l;
        }
    }
    return null;
}

function removeUnsubShareNode() {
    var n = document.getElementById("unsubShareNode");
    if (n) {
        n.parentNode.removeChild(n);
    }
}

function addUnsubShareNode() {
    getUnsubCount(function(unsubCount) {
        var unsubShareNode = document.createElement("div");
        unsubShareNode.id = "unsubShareNode";
        unsubShareNode.innerHTML = unsubShareNodeHtml(unsubCount);
        var plusNode = getPlusNameNode();
        removeUnsubShareNode();
        plusNode.parentNode.parentNode.parentNode.insertBefore(unsubShareNode, plusNode.parentNode.parentNode);
        if (UnsubscribeButton.timeoutRef) {
            clearTimeout(UnsubscribeButton.timeoutRef);
        }
        var removeUnsubShareNodeAfterSeconds = 60;
        removeUnsubShareNodeAfterSeconds *= 1000;
        UnsubscribeButton.timeoutRef = setTimeout(removeUnsubShareNode, removeUnsubShareNodeAfterSeconds);
    });
}

function unsubShareNodeHtml(unsubCount) {
    var fburl = "https://www.facebook.com/dialog/feed";
    fburl += "?app_id=" + encodeURIComponent("301361186739498");
    fburl += "&display=" + encodeURIComponent("page");
    fburl += "&name=" + encodeURIComponent("Unsubscribed from " + unsubCount + " email newsletters");
    fburl += "&caption=" + encodeURIComponent("Using Unsubscribe Button for Chrome");
    fburl += "&link=" + encodeURIComponent("https://chrome.google.com/webstore/detail/unsubscribe-button/hopdblcmcfipdidllgkjflmaopndofmp?hl=en");
    fburl += "&redirect_uri=" + encodeURIComponent("http://kortina.net/work/thanks-for-sharing");

    var html = "<span>" + unsubCount + " Unsubs!</span>";
    html += " <a href=\"" + fburl + "\" target=\"_blank\">Share</a>";
    html += "&nbsp;&nbsp;";
    return html;
}

registerUnsubscribeKeyboardShortcutListener(false);
