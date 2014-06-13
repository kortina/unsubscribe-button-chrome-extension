// content.js has access to DOM

// background.js:chrome.pageAction.onClicked calls this function
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    //console.log("unsubscribe-button:content.js:onRequest");
    tryToUnsubscribe();
});

function tryToUnsubscribe() {
    var links = getUnsubLinks();
    openBestUnsubLink(links);
}

function getUnsubLinks() {
    var unsubLinks = getLinksMatching(/unsub|optout|opt out|opt-out/i);
    if (unsubLinks.length === 0) {
        unsubLinks = getLinksMatching(/click here/i); // less likely to work than above, but nice fallback
    }
    return unsubLinks;
}

function getLinksMatching(pattern) {
    var links = document.getElementsByTagName("a");
    var matchedLinks = [];
    for (var i in links) {
        console.log(links[i].innerText);
        if (links[i].innerText && links[i].innerText.match(pattern)) {
            matchedLinks.push(links[i]);
        }
    }
    return matchedLinks;
}

function chooseBestUnsubLink(unsubLinks) {
    for (var i = unsubLinks.length - 1; i >= 0; i--) { // start at end, as unsub link typically at bottom
        if (unsubLinks[i].href) {
            return unsubLinks[i];
        }
    }
    return null;
}

function openBestUnsubLink(unsubLinks) {
    var link = chooseBestUnsubLink(unsubLinks);
    if (link) {
        console.log("unsubscribe-button:unsub link found: " + link.href.toString());
        var win = window.open(link.href, '_blank');
        win.focus();
    } else {
        console.log("unsubscribe-button:unsub link NOT found");
        displayModalForTime("Couldn't find unsubscribe link.<br /><br />¯\_(ツ)_/¯", 5000);
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

function registerUnsubscribeKeyboardShortcutListener(reregister) {
    if (!reregister && unsubscribeKeyboardShortcutListener.isSet === true) return;
    document.addEventListener('keyup', unsubscribeKeyboardShortcutListener, false);
    unsubscribeKeyboardShortcutListener.isSet = true;
}

registerUnsubscribeKeyboardShortcutListener(false);
