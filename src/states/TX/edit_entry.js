// language translations
document.querySelector("#first-name-label").innerText = browser.i18n.getMessage("editEntryFirstNameLabel");
document.querySelector("#first-name").setAttribute("placeholder", browser.i18n.getMessage("editEntryFirstNamePlaceholder"));
document.querySelector("#last-name-label").innerText = browser.i18n.getMessage("editEntryLastNameLabel");
document.querySelector("#last-name").setAttribute("placeholder", browser.i18n.getMessage("editEntryLastNamePlaceholder"));
document.querySelector("#date-of-birth-label").innerText = browser.i18n.getMessage("editEntryDateOfBirthLabel");
document.querySelector("#county-label").innerText = browser.i18n.getMessage("editEntryCountyLabel");
document.querySelector("#zip-code-label").innerText = browser.i18n.getMessage("editEntryZipCodeLabel");
document.querySelector("#zip-code").setAttribute("placeholder", browser.i18n.getMessage("editEntryZipCodePlaceholder"));
document.querySelector("#submit-button").setAttribute("value", browser.i18n.getMessage("editEntryUpdateButton"));
document.querySelector("#cancel").innerText = browser.i18n.getMessage("editEntryCancelButton");

// birthdate min/max range
document.querySelector("#date-of-birth").setAttribute("min", (new Date((new Date()).setFullYear((new Date()).getFullYear() - 150))).toISOString().substring(0,10));
document.querySelector("#date-of-birth").setAttribute("max", (new Date()).toISOString().substring(0,10));

// add counties to select dropdown
var countyOptions = `${PurgeAlert['TX']['COUNTIES'].map((county) => `
    <option value="${county}">${county}</option>
`).join('')}`;
document.querySelector("#county").innerHTML = countyOptions;

// load the entry from storage
var entryId = (new URL(window.location.href)).searchParams.get("entry");
browser.storage.local.get(entryId).then(function(entries){
    var entry = entries[entryId];

    // populate the voter registration lookup edit form
    var lookupValues = entry['stateStorage']['lookup'];
    document.querySelector("#first-name").value = lookupValues['firstName'];
    document.querySelector("#last-name").value = lookupValues['lastName'];
    document.querySelector("#date-of-birth").value = lookupValues['dateOfBirth'];
    document.querySelector("#county").value = lookupValues['county'];
    document.querySelector("#zip-code").value = lookupValues['zipCode'];

    // render the latest status alert
    var latestHistoryItem = undefined;
    for(var i = (entry['stateStorage']['history'].length - 1); i >= 0; i--){
        if(entry['stateStorage']['history'][i]['type'] === "runChecking"){
            latestHistoryItem = entry['stateStorage']['history'][i];
            break;
        }
    }

    // no checks, so show blank state
    if(latestHistoryItem === undefined){
        document.querySelector("#latest-status").innerHTML = `
            <b>No checks yet</b>
        `;// TODO: make this better
    }

    // voter not found in the last check
    if(latestHistoryItem['result'] === "no_voter_found"){
        document.querySelector("#latest-status").innerHTML = `
            <b>No voter registration found!</b>
        `;// TODO: make this better and i18n
    }

    // blocked by cloudflare
    if(latestHistoryItem['result'] === "blocked_by_cloudflare"){
        document.querySelector("#latest-status").innerHTML = `
            <b>Lookup blocked by Cloudflare (this is usually because you are using a VPN)</b>
        `;// TODO: make this better and i18n
    }

    // need permission
    if(latestHistoryItem['result'] === "need_permission"){
        var renderedHTML = `
            <b>Need to grant permission again.</b>
        `;// TODO: make this better and i18n
        return renderedHTML;
    }


    // voter registration lookup and save updates to storage
    function _editVoterRegistration(e){

        // submitting state
        e.preventDefault();
        document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdating");
        document.querySelector("#submit-button").setAttribute("disabled", "");

        // validate registration lookup fields
        //TODO

        // add new history item
        entry['status'] = "pending";
        entry['stateStorage']['history'].push({
            "type": "runChecking",
            "created": (new Date).toISOString(),
            "checkingMessage": "Checking...", // TODO: i18n
            "lookup": {
                "firstName": document.querySelector("#first-name").value,
                "lastName": document.querySelector("#last-name").value,
                "dateOfBirth": document.querySelector("#date-of-birth").value,
                "county": document.querySelector("#county").value,
                "zipCode": document.querySelector("#zip-code").value,
            },
            "result": null,
            "error": {},
            "voter": {},
        });

        // status updates while running
        var intervalID = null;
        function _monitorStatus(){
            // stop monitoring when no longer listening
            if(entry['status'] !== "pending"){
                clearInterval(intervalID);
                return;
            }

            // still running, so show the latest status message
            for(var i = (entry['stateStorage']['history'].length - 1); i >= 0; i--){
                var historyItem = entry['stateStorage']['history'][i];
                if(historyItem['type'] === "runChecking"){
                    document.querySelector("#results").innerHTML = historyItem['checkingMessage'];
                    break;
                }
            }
        }

        // done trying to look up the voter
        function _processResults(entry){

            // get what voters were found (assume the lookup
            var result = entry['stateStorage']['history'][entry['stateStorage']['history'].length - 1]['result'];
            var voter = entry['stateStorage']['history'][entry['stateStorage']['history'].length - 1]['voter'];

            // found the voter, so save the db entry and close the window
            if(result === "success"){
                var dbUpdates = {};
                dbUpdates[entry['key']] = entry;
                browser.storage.local.set(dbUpdates).then(function(){

                    // change pending state to saving
                    document.querySelector("#results").innerHTML = `
                        <span id="voter-found">Voter found!</span>
                        <a id="close-window" href="#">Close this window</a>
                    `;
                    document.querySelector("#voter-found").innerText = browser.i18n.getMessage("editEntrySuccess");
                    document.querySelector("#close-window").innerText = browser.i18n.getMessage("editEntryCloseWindow");

                    // close the add-registration interface
                    document.querySelector("#close-window").addEventListener("click", function(e){
                        e.preventDefault();
                        browser.windows.getCurrent().then(function(w){
                            browser.windows.remove(w.id);
                        });
                    });

                });
            }

            // couldn't find a matching voter, so ask to correct and retry
            else if(result === "no_voter_found"){
                document.querySelector("#results").innerHTML = browser.i18n.getMessage("voterNotFoundError");
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
            }

            // request blocked by cloudflare >:(
            else if(result === "blocked_by_cloudflare"){
                document.querySelector("#results").innerHTML = browser.i18n.getMessage("blockedByCloudflare");
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
                //TODO: add recovery options
            }

            // didn't have permission to access the TX SOS site >:(
            else if(result === "need_permission"){
                document.querySelector("#results").innerHTML = browser.i18n.getMessage("needPermissionError");
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
                //TODO: add recovery options
            }

            // some other error occurred
            else if(result === "other_error"){
                document.querySelector("#results").innerHTML = browser.i18n.getMessage("voterLookupError");
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
                //TODO: add retry/debug/support options
            }
        }

        // ask for permission if don't already have it
        browser.permissions.contains({
            origins: ["*://*.sos.texas.gov/*"],
        }).then(function(hasPermission){

            // has permission, so run the checker now
            if(hasPermission){
                PurgeAlert['TX'].checkRegistration(entry, _processResults);
                intervalID = setInterval(_monitorStatus, 100);
            }

            // doesn't have permission, so ask the user to provide permission
            else {

                // show message to prepare the user for the popup
                document.querySelector("#results").innerHTML = `
                    ${browser.i18n.getMessage("stateTexasPermissionAsk")}:
                    <button id="grant-permission">${browser.i18n.getMessage("askPermissionButton")}</button>
                `;

                // ask for permission when the user says to show the prompt
                document.querySelector("#grant-permission").addEventListener("click", function(e){
                    e.preventDefault();

                    // extension permission request
                    browser.permissions.request({
                        origins: ["*://*.sos.texas.gov/*"],
                    }).then(function(givenPermission){

                        // given permission, so check the submitted registration
                        if(givenPermission){
                            PurgeAlert['TX'].checkRegistration(entry, _processResults);
                            intervalID = setInterval(_monitorStatus, 100);
                        }

                        // permission denied, so show the same permission prep
                        else {
                            document.querySelector("#results").innerHTML = `
                                ${browser.i18n.getMessage("stateTexasPermissionAsk")}:
                                <button id="grant-permission">${browser.i18n.getMessage("askPermissionButton")}</button>
                            `;
                        }
                    });
                });
            }
        });
    }

    // run lookup and save when form is submitted
    document.querySelector("#edit-form").addEventListener("submit", _editVoterRegistration);

    // cancel the lookup and close the window
    document.querySelector("#cancel").addEventListener("click", function(e){
        e.preventDefault();
        browser.windows.getCurrent().then(function(w){
            browser.windows.remove(w.id);
        });
    });

});

