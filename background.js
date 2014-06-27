// Called when the url of a tab changes.
function checkForValidUrl(tabId, changeInfo, tab) {
  if (tab.url.match(/(https?:\/\/)?([^.]+.)?vk\.com/)) {
    // ... show the page action.
    chrome.pageAction.show(tabId);
  }
};

function showPopup(tab) {
  chrome.tabs.create({
    url: "popup.html",
    index: tab.index + 1,
    openerTabId: tab.id,
    active: true
  });
}

// Listen for any changes to the URL of any tab.
chrome.tabs.onUpdated.addListener(checkForValidUrl);
chrome.pageAction.onClicked.addListener(showPopup);
chrome.contextMenus.create({
	title: 'Импорт музыки из iTunes',
	documentUrlPatterns: ['http://vk.com/*','https://vk.com/*','http://*.vk.com/*','https://*.vk.com/*'],
	onclick: function(info, tab) {
		showPopup(tab);
	}
});