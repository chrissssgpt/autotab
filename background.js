js
let tabs = await chrome.tabs.query({currentWindow: true});
let activeTab = await chrome.tabs.getSelected();  

let keywords = [];     
let tabGroups = {};
let tabGroupHistory = {};    
let groupScores = {};  
let defaultTabGroups;

function getKeywords(tab) {
  let titleWords = tab.title.toLowerCase().split(" ");
  let urlWords = new URL(tab.url).hostname.split(".");
  keywords = [...titleWords, ...urlWords];
}   

for (let tab of tabs) {
  getKeywords(tab);   
  
  for (let group of defaultTabGroups) {
    if (keywords.some(word => group.words.includes(word))) {
      tab.groupId = group.id; 
    } 
  }  
}  

setInterval(() => {   
  for (let groupId in tabGroups) {
    groupScores[groupId]++;
    for (let tab of tabGroups[groupId].tabs) {
      keywords = [...keywords, ...getKeywords(tab)]; 
    }
  }  
}, 60000);   

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.title) {
    getKeywords(tab);
    let currentGroup = tabGroups[tab.groupId];
    delete currentGroup.tabs[tab.index];
    currentGroup.tabs.push(tab);
  }  
}); 
js
// Análisis de contenido de la pestaña activa
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    let pageContent = tab.content; 
    let topicWords = analyzePageContent(pageContent); 
    
    if (!tab.groupId && topicWords.length > 0) {  
      for (let group of defaultTabGroups) {
        if (topicWords.some(word => group.words.includes(word))) {
          chrome.tabs.group({tabIds: [tab.id], groupId: group.id});
        } 
      }
    }
  });  
});

function analyzePageContent(content) {
  let nlp = spacy.load("en_core_web_md"); 
  let doc = nlp(content);
  let topicWords = [];
  
  for (let token of doc) {
    if (token.pos == "NOUN" || token.pos == "ADJ") {
      topicWords.push(token.text);
    }
  }
  return topicWords;  
} 
js
// Sincronizar grupos al iniciar sesión con cuenta de Google
chrome.identity.onSignInChanged.addListener((account) => {
  if (account.signedIn) {
    chrome.storage.sync.get("tabGroups", (items) => {
      tabGroups = items.tabGroups;
    });
  }
});  

// Actualizar grupos en la nube al cambiar
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.groupId) { 
    chrome.storage.sync.set({tabGroups}); 
  }
});

// Escuchar para cambios en submenús anidados 
chrome.tabs.onMoved.addListener((tabId, moveInfo) => {
  let group = tabGroups[tab.groupId];
  let oldParent = group.parent;  
  
  if (moveInfo.fromIndex < moveInfo.toIndex) {
    group.parent = group.submenus[moveInfo.toIndex - 1]; 
  } else if (moveInfo.fromIndex > moveInfo.toIndex) {  
    group.parent = oldParent; 
  } 
  
  chrome.storage.sync.set({tabGroups}); 
});  

function createSubmenu(groupId, title) {
  let group = tabGroups[groupId];
  group.submenus.push({
    title,
    tabs: []
  });
  
  chrome.storage.sync.set({tabGroups});   
} 