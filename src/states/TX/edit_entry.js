// language translations
document.querySelector("label[for=first-name]").innerText = browser.i18n.getMessage("editEntryFirstNameLabel");
document.querySelector("#first-name").setAttribute("placeholder", browser.i18n.getMessage("editEntryFirstNamePlaceholder"));
document.querySelector("label[for=last-name]").innerText = browser.i18n.getMessage("editEntryLastNameLabel");
document.querySelector("#last-name").setAttribute("placeholder", browser.i18n.getMessage("editEntryLastNamePlaceholder"));
document.querySelector("label[for=date-of-birth]").innerText = browser.i18n.getMessage("editEntryDateOfBirthLabel");
document.querySelector("label[for=county]").innerText = browser.i18n.getMessage("editEntryCountyLabel");
document.querySelector("label[for=zip-code]").innerText = browser.i18n.getMessage("editEntryZipCodeLabel");
document.querySelector("#zip-code").setAttribute("placeholder", browser.i18n.getMessage("editEntryZipCodePlaceholder"));
document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
document.querySelector("#cancel").innerText = browser.i18n.getMessage("editEntryCancelButton");
document.querySelector("#ask-permission").innerText = browser.i18n.getMessage("stateTexasPermissionAsk");
document.querySelector("#grant-permission").innerText = browser.i18n.getMessage("askPermissionButton");

// birthdate min/max range
document.querySelector("#date-of-birth").setAttribute("min", (new Date((new Date()).setFullYear((new Date()).getFullYear() - 150))).toISOString().substring(0,10));
document.querySelector("#date-of-birth").setAttribute("max", (new Date()).toISOString().substring(0,10));

// insert counties into dropdown
PurgeAlert['TX']['COUNTIES'].map(function(county){
    var option = document.createElement("option");
    option.value = county;
    option.innerText = county;
    document.querySelector("#county").appendChild(option);
});

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
            <div class="alert alert-secondary" role="alert">
                No checks yet
            </div>
        `; // TODO: i18n
    }

    // voter found
    if(latestHistoryItem['result'] === "success"){
        document.querySelector("#latest-status").innerHTML = `
            <div class="alert alert-success" role="alert">
                Voter found during last check!
            </div>
        `; // TODO: i18n
    }

    // voter not found in the last check
    if(latestHistoryItem['result'] === "no_voter_found"){
        document.querySelector("#latest-status").innerHTML = `
            <div class="alert alert-danger" role="alert">
                No voter registration found!
            </div>
        `; // TODO: i18n
    }

    // blocked by cloudflare
    if(latestHistoryItem['result'] === "blocked_by_cloudflare"){
        document.querySelector("#latest-status").innerHTML = `
            <div class="alert alert-warning" role="alert">
                Lookup blocked by Cloudflare (this is usually because you are using a VPN)
            </div>
        `; // TODO: i18n
    }

    // need permission
    if(latestHistoryItem['result'] === "need_permission"){
        document.querySelector("#latest-status").innerHTML = `
            <div class="alert alert-warning" role="alert">
                Need to grant permission again.
                <a
                    href="#"
                    class="alert-link"
                    data-toggle="modal"
                    data-target="#permission-modal"
                    ><u>Fix now</u></a>
            </div>
        `; // TODO: i18n
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
            "updated": (new Date).toISOString(),
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
                    document.querySelector("#results").innerHTML = `
                        <div class="text-muted">${historyItem['checkingMessage']}</div>
                    `;
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

                    // show success message
                    document.querySelector("#results").innerHTML = `
                        <h4 class="d-inline-block text-success">
                            <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-check"/></svg>
                        </h4>
                        ${browser.i18n.getMessage("editEntrySuccess")}
                        <button id="close-window" class="btn btn-link">
                            ${browser.i18n.getMessage("editEntryCloseWindow")}
                        </button>
                    `;

                    // reset the submit button
                    document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                    document.querySelector("#submit-button").removeAttribute("disabled");

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
                // show the error
                document.querySelector("#results").innerHTML = `
                    <h4 class="d-inline-block text-danger">
                        <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-times-circle"/></svg>
                    </h4>
                    ${browser.i18n.getMessage("voterNotFoundError")}
                `;
                // reset the submit button
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
            }

            // request blocked by cloudflare >:(
            else if(result === "blocked_by_cloudflare"){
                // show the error
                document.querySelector("#results").innerHTML = `
                    <h4 class="d-inline-block text-warning">
                        <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-minus-circle"/></svg>
                    </h4>
                    ${browser.i18n.getMessage("blockedByCloudflare")}
                `;
                // reset the submit button
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
                //TODO: add recovery options
            }

            // didn't have permission to access the TX SOS site >:(
            else if(result === "need_permission"){
                // show modal to prepare the user for the popup
                var permissionModal = new BSN.Modal(document.querySelector("#permission-modal"));
                permissionModal.show();
                // reset the submit button
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
            }

            // some other error occurred
            else if(result === "other_error"){
                // show the error
                document.querySelector("#results").innerHTML = `
                    <h4 class="d-inline-block text-danger">
                        <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-exclamation-triangle"/></svg>
                    </h4>
                    ${browser.i18n.getMessage("voterLookupError")}
                `;
                // reset the submit button
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
                //TODO: add recovery options
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

                // show modal to prepare the user for the popup
                var permissionModal = new BSN.Modal(document.querySelector("#permission-modal"));
                permissionModal.show();

                // reset the submit button
                document.querySelector("#results").innerHTML = "";
                document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                document.querySelector("#submit-button").removeAttribute("disabled");
            }
        });

        // ask for permission when the user says to show the prompt
        document.querySelector("#grant-permission").addEventListener("click", function(e){
            e.preventDefault();

            // extension permission request
            browser.permissions.request({
                origins: ["*://*.sos.texas.gov/*"],
            }).then(function(givenPermission){

                // close the modal
                var permissionModal = new BSN.Modal(document.querySelector("#permission-modal"));
                permissionModal.hide();

                // given permission, so check the submitted registration
                if(givenPermission){
                    PurgeAlert['TX'].checkRegistration(entry, _processResults);
                    intervalID = setInterval(_monitorStatus, 100);
                }

                // permission denied, so show the same permission prep
                else {

                    document.querySelector("#results").innerHTML = "";
                    document.querySelector("#submit-button").value = browser.i18n.getMessage("editEntryUpdateButton");
                    document.querySelector("#submit-button").removeAttribute("disabled");
                }
            });
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

