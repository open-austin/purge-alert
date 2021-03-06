// global purge alert object
var PurgeAlert = PurgeAlert || {};

// language translations
document.querySelector("#blank-state-link").innerText = browser.i18n.getMessage("popupBlankStateLink");
document.querySelector("#add-additional-link").innerText = browser.i18n.getMessage("popupAddAdditionalLink");
document.querySelector("#footer-link").innerText = browser.i18n.getMessage("popupFooterLink");
document.querySelector("#footer-message").innerText = browser.i18n.getMessage("popupFooterMessage");

// add registration click listener
var addRegistrationLinks = document.querySelectorAll(".add-registration");
for(var i = 0; i < addRegistrationLinks.length; i++){
    addRegistrationLinks[i].addEventListener("click", function(e){
        e.preventDefault();
        browser.windows.create({
            "type": "popup",
            "url": "add_registration.html",
            "width": 500,
            "height": 700,
        });
    });
}

// function for rendering an entry
function renderEntry(entry){

    // insert the state's logic if not already added
    if(!document.querySelectorAll("#popup-" + entry['state']).length){
        var stateScript = document.createElement("script");
        stateScript.id = "popup-" + entry['state'];
        stateScript.src = "states/" + entry['state'] + "/state.js";
        document.querySelector("body").appendChild(stateScript);
    }

    // call the entry's state's renderPopupEntry()
    if(PurgeAlert
    && PurgeAlert[entry['state']]
    && PurgeAlert[entry['state']].renderPopupEntry
    && document.querySelector("#entry-" + entry['key'])){

        // only replace old with new if changed
        var oldContent = document.querySelector("#entry-" + entry['key']).getAttribute("data-content");
        var newContent = PurgeAlert[entry['state']].renderPopupEntry(entry);
        if(oldContent !== newContent){
            // replace the entry
            document.querySelector("#entry-" + entry['key']).innerHTML = newContent;
            // also need to set as an attribute for future content comparisons
            // (since innerHTML can change the content slightly)
            document.querySelector("#entry-" + entry['key']).setAttribute("data-content", newContent);
        }
    }
    // the state's script hasn't loaded yet, so wait a bit and try again
    else {
        setTimeout(renderEntry, 50, entry);
    }
}

// function for updating each entry
function updateEntry(key){

    // get or add entry item to entries container
    var entryDiv = document.querySelector("#entry-" + key);
    if(!entryDiv){
        entryDiv = document.createElement("div");
        entryDiv.id = "entry-" + key;
        entryDiv.classList.add("entry");
        document.querySelector("#entries").appendChild(entryDiv);
    }

    // lookup the entry in storage
    browser.storage.local.get(key).then(function(entries){
        var entry = entries[key];

        // insert the entry's html
        if(entry){
            renderEntry(entry);
        }

        // couldn't find entry so remove the list item
        else {
            document.querySelector("#entry-" + key).outerHTML = "";
        }
    });

}

// lookup all the current voter registration entries
// storage['entries'] = {"<entryId>": true, ...}
// storage['<entryId>'] = {...}
function rebuildEntriesList(){
    browser.storage.local.get("entries").then(function(storageMatches){
        var entries = storageMatches['entries'] || {};

        // loop through entries in storage and update its html
        var numEntries = 0;
        for(var k in entries){
            if(entries[k] !== undefined){
                updateEntry(k);
                numEntries += 1;
            }
        }

        // remove any entries that don't exist anymore
        var entryDivs = document.querySelectorAll(".entry");
        for(var i = 0; i < entryDivs.length; i++){
            var entryKey = entryDivs[i].id.replace(/entry-/, "");
            if(entries[entryKey] === undefined){
                entryDivs[i].outerHTML = "";
            }
        }

        // show/hide entries or blank state
        if(numEntries > 0){
            document.querySelector("#entries-wrapper").classList.remove("d-none");
            document.querySelector("#blank-state").classList.add("d-none");
        } else {
            document.querySelector("#entries-wrapper").classList.add("d-none");
            document.querySelector("#blank-state").classList.remove("d-none");
        }

        // re-render every half-second
        setTimeout(rebuildEntriesList, 500);
    });
}
rebuildEntriesList();

// clicks should call the functions listed in the data-run tag
document.querySelector("body").addEventListener("click", function(e){
    var curTarget = e.target;
    var runFn = curTarget.dataset['run'];
    var runState = curTarget.dataset['state'];
    var runEntryId = curTarget.dataset['entry'];
    while(curTarget.tagName !== "BODY" && curTarget.parentNode && !runFn){
        curTarget = curTarget.parentNode;
        runFn = curTarget.dataset['run'];
        runState = curTarget.dataset['state'];
        runEntryId = curTarget.dataset['entry'];
    }
    if(runFn && runState){
        var runArgs = [e];
        if(runEntryId){
            runArgs.push(runEntryId);
        }
        PurgeAlert[runState][runFn].apply(this, runArgs);
    }
});

