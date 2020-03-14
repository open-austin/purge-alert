// load the entry from storage
var pageParams = (new URL(window.location.href)).searchParams;
var entryId = pageParams.get("entry");
browser.storage.local.get(entryId).then(function(entries){
    var entry = entries[entryId];

    // starting and ending indexs for this page of logs
    var startingIndex = 0;
    if(pageParams.get("before")){
        startingIndex = parseInt(pageParams.get("i"));
    }
    var maxPerPage = 20;
    var endingIndex = entry['stateStorage']['history'].length - 1;
    if(endingIndex > startingIndex + maxPerPage){
        endingIndex = startingIndex + maxPerPage;
    }

    // loop through the history items most recent first
    for(var i = startingIndex; i <= endingIndex; i++){
        var historyItem = entry['stateStorage']['history'][entry['stateStorage']['history'].length - 1 - i];

        // registration lookup record
        if(historyItem['type'] === "runChecking"){
            var historyItemHtml = `
                <div>
                    <div>
                        ${historyItem['created']}
                        - Looked up registration
                    </div>
                    <div>
                        Result:
                        ${historyItem['result'] ? historyItem['result'] : "pending"}
                    </div>
                </div>
            `; // TODO: make this better
            document.querySelector("#logs").insertAdjacentHTML("beforeend", historyItemHtml);
        }
    }

});

// bind close window
document.querySelector("#close-window").addEventListener("click", function(e){
    e.preventDefault();
    browser.windows.getCurrent().then(function(w){
        browser.windows.remove(w.id);
    });
});
