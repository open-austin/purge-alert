// language translations
document.querySelector("#tx-add-title").innerText = browser.i18n.getMessage("addRegStateTitle");
document.querySelector("label[for=tx-first-name]").innerText = browser.i18n.getMessage("addRegFirstNameLabel");
document.querySelector("#tx-first-name").setAttribute("placeholder", browser.i18n.getMessage("addRegFirstNamePlaceholder"));
document.querySelector("label[for=tx-last-name]").innerText = browser.i18n.getMessage("addRegLastNameLabel");
document.querySelector("#tx-last-name").setAttribute("placeholder", browser.i18n.getMessage("addRegLastNamePlaceholder"));
document.querySelector("label[for=tx-date-of-birth]").innerText = browser.i18n.getMessage("addRegDateOfBirthLabel");
document.querySelector("label[for=tx-county]").innerText = browser.i18n.getMessage("addRegCountyLabel");
document.querySelector("#tx-county-placeholder").innerText = browser.i18n.getMessage("addRegCountyPlaceholder");
document.querySelector("label[for=tx-zip-code]").innerText = browser.i18n.getMessage("addRegZipCodeLabel");
document.querySelector("#tx-zip-code").setAttribute("placeholder", browser.i18n.getMessage("addRegZipCodePlaceholder"));
document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
document.querySelector("#tx-cancel").innerText = browser.i18n.getMessage("addRegCancel");
document.querySelector("#tx-ask-permission").innerText = browser.i18n.getMessage("stateTexasPermissionAsk");
document.querySelector("#tx-grant-permission").innerText = browser.i18n.getMessage("askPermissionButton");
document.querySelector("#tx-voter-found").innerText = browser.i18n.getMessage("addRegSuccess");
document.querySelector("#tx-close-window").innerText = browser.i18n.getMessage("addRegCloseWindow");

// date limits for date-of-birth
document.querySelector("#tx-date-of-birth").setAttribute("min", (new Date((new Date()).setFullYear((new Date()).getFullYear() - 150))).toISOString().substring(0,10));
document.querySelector("#tx-date-of-birth").setAttribute("max", (new Date()).toISOString().substring(0,10));

// insert counties into dropdown
PurgeAlert['TX']['COUNTIES'].map(function(county){
    var option = document.createElement("option");
    option.value = county;
    option.innerText = county;
    document.querySelector("#tx-county").appendChild(option);
});

// voter registration lookup and save to storage
function _addVoterRegistration(e){

    // submitting state
    e.preventDefault();
    document.querySelector("#tx-results").innerHTML = "";
    document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmitting");
    document.querySelector("#tx-submit-button").setAttribute("disabled", "");

    // validate registration lookup fields
    //TODO

    // build registration entry
    var entry = {
        "key": null,
        "created": (new Date).toISOString(),
        "status": "pending", // "pending|valid|empty|needs-attention"
        "state": "TX",
        "stateStorage": {
            "lookup": null, //{
            //    "firstName": "Jane",
            //    "lastName": "Doe",
            //    "dateOfBirth": "1980-01-01",
            //    "county": "TRAVIS",
            //    "zipCode": "12345",
            //},
            "voter": null, //{
            //    "name": "JANE ANN DOE",
            //    "address": ["123 MAIN ST", "AUSTIN TX 77777"],
            //    "validFrom": "2020-01-01",
            //    "dateRegistered": "2018-10-18",
            //    "voterStatus": "ACTIVE",
            //    "county": "TRAVIS",
            //    "precinct": "200",
            //    "vuid": "123456789",
            //},
            "history": [
                {
                    "type": "runChecking",
                    "created": (new Date).toISOString(),
                    "updated": (new Date).toISOString(),
                    "checkingMessage": "Checking...", // TODO: i18n
                    "lookup": {
                        "firstName": document.querySelector("#tx-first-name").value,
                        "lastName": document.querySelector("#tx-last-name").value,
                        "dateOfBirth": document.querySelector("#tx-date-of-birth").value,
                        "county": document.querySelector("#tx-county").value,
                        "zipCode": document.querySelector("#tx-zip-code").value,
                    },
                    "result": null, // "success|no_voter_found|need_permission|blocked_by_cloudflare|other_error"
                    "error": {
                    //    TODO: figure out what should be stored in here
                    },
                    "voter": {
                    //    "name": "JANE ANN DOE",
                    //    "address": ["123 MAIN ST", "AUSTIN TX 77777"],
                    //    "validFrom": "2020-01-01",
                    //    "dateRegistered": "2018-10-18",
                    //    "voterStatus": "ACTIVE",
                    //    "county": "TRAVIS",
                    //    "precinct": "200",
                    //    "vuid": "123456789",
                    },
                },
            ]
        },
    }

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
                document.querySelector("#tx-results").innerHTML = `
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

            // generate new entryId for the new registration
            entry['key'] = uuid4();

            // load the global entries map (so we can add the new entry id to it)
            browser.storage.local.get("entries").then(function(storageMatch){
                var dbUpdates = {};
                dbUpdates['entries'] = storageMatch['entries'] || {};
                dbUpdates['entries'][entry['key']] = true;
                dbUpdates[entry['key']] = entry;
                browser.storage.local.set(dbUpdates).then(function(){

                    // show success modal
                    var successModal = new BSN.Modal(document.querySelector("#tx-success-modal"));
                    successModal.show();

                    // reset the submit button
                    document.querySelector("#tx-results").innerHTML = "";
                    document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
                    document.querySelector("#tx-submit-button").removeAttribute("disabled");
                });
            });

        }

        // couldn't find a matching voter, so ask to correct and retry
        else if(result === "no_voter_found"){
            // no voter error message
            document.querySelector("#tx-results").innerHTML = `
                <h4 class="d-inline-block text-danger">
                    <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-times-circle"/></svg>
                </h4>
                ${browser.i18n.getMessage("voterNotFoundError")}
            `;
            // reset the submit button
            document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
            document.querySelector("#tx-submit-button").removeAttribute("disabled");
        }

        // request blocked by cloudflare >:(
        else if(result === "blocked_by_cloudflare"){
            // cloudflare error message
            document.querySelector("#tx-results").innerHTML = `
                <h4 class="d-inline-block text-warning">
                    <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-minus-circle"/></svg>
                </h4>
                ${browser.i18n.getMessage("blockedByCloudflare")}
            `;
            // reset the submit button
            document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
            document.querySelector("#tx-submit-button").removeAttribute("disabled");
            //TODO: add recovery options
        }

        // didn't have permission to access the TX SOS site >:(
        else if(result === "need_permission"){
            // show modal to prepare the user for the popup
            var permissionModal = new BSN.Modal(document.querySelector("#tx-permission-modal"));
            permissionModal.show();
            // reset the submit button
            document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
            document.querySelector("#tx-submit-button").removeAttribute("disabled");
        }

        // some other error occurred
        else if(result === "other_error"){
            // fallback error message
            document.querySelector("#tx-results").innerHTML = `
                <h4 class="d-inline-block text-danger">
                    <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-exclamation-triangle"/></svg>
                </h4>
                ${browser.i18n.getMessage("voterLookupError")}
            `;
            // reset the submit button
            document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
            document.querySelector("#tx-submit-button").removeAttribute("disabled");
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

            // show modal to prepare the user for the popup
            var permissionModal = new BSN.Modal(document.querySelector("#tx-permission-modal"));
            permissionModal.show();

            // reset the submit button
            document.querySelector("#tx-results").innerHTML = "";
            document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
            document.querySelector("#tx-submit-button").removeAttribute("disabled");
        }
    });

    // ask for permission when the user says to show the prompt
    document.querySelector("#tx-grant-permission").addEventListener("click", function(e){
        e.preventDefault();

        // extension permission request
        browser.permissions.request({
            origins: ["*://*.sos.texas.gov/*"],
        }).then(function(givenPermission){

            // close the modal
            var permissionModal = new BSN.Modal(document.querySelector("#tx-permission-modal"));
            permissionModal.hide();

            // given permission, so check the submitted registration
            if(givenPermission){
                PurgeAlert['TX'].checkRegistration(entry, _processResults);
                intervalID = setInterval(_monitorStatus, 100);
            }

            // permission denied, so just go back to state where user can submit again
            else {
                document.querySelector("#tx-results").innerHTML = "";
                document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
                document.querySelector("#tx-submit-button").removeAttribute("disabled");
            }
        });
    });
}

// run lookup and save when form is submitted
document.querySelector("#tx-add-form").addEventListener("submit", _addVoterRegistration);

// cancel the lookup and close the window
document.querySelector("#tx-cancel").addEventListener("click", function(e){
    e.preventDefault();
    browser.windows.getCurrent().then(function(w){
        browser.windows.remove(w.id);
    });
});

// close the add-registration interface
document.querySelector("#tx-close-window").addEventListener("click", function(e){
    e.preventDefault();
    browser.windows.getCurrent().then(function(w){
        browser.windows.remove(w.id);
    });
});

