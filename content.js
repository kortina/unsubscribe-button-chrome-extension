// content.js has access to DOM

// background.js:chrome.pageAction.onClicked calls this function
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    //console.log("unsubscribe-button:content.js:onRequest");
    var links = getUnsubLinks();
    openBestUnsubLink(links);
});

function getUnsubLinks() {
    var unsubLinks = getLinksMatching(/unsub|optout|opt out/i);
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
    }
}
