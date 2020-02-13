// global PA object
window.PurgeAlert = {};

// language translations
document.querySelector("#popup-title").innerText = browser.i18n.getMessage("popupTitle");
document.querySelector("#blank-state span").innerText = browser.i18n.getMessage("popupBlankStateMessage");
document.querySelector("#add-registration span").innerText = browser.i18n.getMessage("popupAddRegistrationButton");
document.querySelector("#footer-link").innerText = browser.i18n.getMessage("popupFooterLink");
document.querySelector("#footer-message").innerText = browser.i18n.getMessage("popupFooterMessage");

// add registration click listener
document.querySelector("#add-registration").addEventListener("click", function(e){
    e.preventDefault();
    window.open("add_registration.html", "purge-alert", "width=500,height=500,dependent,menubar=no,toolbar=no,personalbar=no");
});

// function for updating each entry
function updateEntry(key){

    // get or add entry list item to entries list
    var entryLI = document.querySelector("#entry-" + key);
    if(!entryLI){
        entryLI = document.createElement("li");
        entryLI.id = "entry-" + key;
        document.querySelector("#entries").appendChild(entryLI);
    }

    // lookup the entry in storage
    browser.storage.local.get(key).then(function(entries){
        var entry = entries[key];

        // found the entry
        if(entry){

            // populate the entry html with latest html from storage
            document.querySelector("#entry-" + key).innerHTML = entry['popupEntry'];

            // insert the state's logic if not already added
            if(!document.querySelectorAll("#popup-" + entry['state']).length){
                var stateScript = document.createElement("script");
                stateScript.id = "popup-" + entry['state'];
                stateScript.src = "states/" + entry['state'] + "/state.js";
                document.querySelector("body").appendChild(stateScript);
            }

            // set a timeout to refresh the entry if still pending
            if(entry['status'] === "pending"){
                setTimeout(updateEntry, 1000, key);
            }
        }

        // couldn't find entry so remove the list item
        else {
            document.querySelector("#entry-" + key).outerHTML = "";
        }
    });

}

// lookup all the current voter registration entries
browser.storage.local.get(null).then(function(entries){

    // loop through entries in storage and update its html
    var numEntries = 0;
    for(var k in entries){
        updateEntry(k);
        numEntries += 1;
    }

    // show/hide entries or blank state
    if(numEntries > 0){
        document.querySelector("#entries").style.display = "block";
        document.querySelector("#blank-state").style.display = "none";
    } else {
        document.querySelector("#entries").style.display = "none";
        document.querySelector("#blank-state").style.display = "block";
    }

});

// clicks should call the functions listed in the data-run tag
document.querySelector("body").addEventListener("click", function(e){
    var curTarget = e.target;
    var runFn = curTarget.dataset['run'];
    var runState = curTarget.dataset['state'];
    while(curTarget.tagName !== "BODY" && curTarget.parentNode && !runFn){
        curTarget = curTarget.parentNode;
        runFn = curTarget.dataset['run'];
        runState = curTarget.dataset['state'];
    }
    if(runFn && runState){
        window.PurgeAlert[runState][runFn](e);
    }
});

