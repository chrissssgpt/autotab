js
document.querySelector("#clearHistory").addEventListener("click", () => {
  chrome.storage.local.set({tabGroupHistory: {}});
});  

document.querySelector("#resetToDefault").addEventListener("click", () => {
  chrome.storage.sync.set({defaultTabGroups: {}});
  chrome.tabs.setDefaultGroup(null);  
}); 