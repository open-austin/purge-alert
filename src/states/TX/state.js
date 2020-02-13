/*
 * What gets loaded when someone chooses this state
 * in the Add Registration dropdown.
 */
"use strict"
window.PurgeAlert['TX'] = {

    //////////////////////////////
    // insertRegistrationForm() //
    //////////////////////////////
    "insertRegistrationForm": function(){

        // template
        document.querySelector("#state-section").innerHTML = `
            <style>
                #submit-wrapper {
                    margin-top: 10px;
                }
            </style>
            <h3>Texas Voter Lookup</h3>
            <form id="tx-add-form">
                <div>
                    <label for="first-name">
                        First Name:
                    </label>
                    <input id="first-name" placeholder="(e.g. Jane)">
                </div>
                <div>
                    <label for="last-name">
                        Last Name:
                    </label>
                    <input id="last-name" placeholder="(e.g. Doe)">
                </div>
                <div>
                    <label for="date-of-birth">
                        Date of Birth:
                    </label>
                    <input id="date-of-birth" placeholder="(e.g. 12/25/2000)">
                </div>
                <div>
                    <label for="county">
                        County:
                    </label>
                    <select id="county">
                        <option value="travis">Travis</option>
                    </select>
                </div>
                <div id="submit-wrapper">
                    <input id="submit-button" type="submit" value="Submit">
                </div>
            </form>
            <div id="results">
            </div>
        `;

        // language translations
        document.querySelector("#submit-button").value = browser.i18n.getMessage("addRegSubmit");

        // voter registration lookup and save to storage
        function _addVoterRegistration(e){

            // submitting state
            e.preventDefault();
            document.querySelector("#submit-button").value = browser.i18n.getMessage("addRegSubmitting");
            document.querySelector("#submit-button").setAttribute("disabled", "");

            // validate registration lookup fields
            //TODO

            // build registration entry
            var entry = {
                "key": null,
                "created": (new Date).toISOString(),
                "status": "pending",
                "popupEntry": "Entry: sadfasdfasdlfjasdlkfasldf",
                "state": "TX",
                "stateStorage": {
                    "firstName": document.querySelector("#first-name").value,
                    "lastName": document.querySelector("#last-name").value,
                    "dateOfBirth": document.querySelector("#date-of-birth").value,
                    "county": document.querySelector("#county").value,
                    "vuid": null,
                    "history": [
                        //{
                        //    "type": "runChecking",
                        //    "created": "2020-01-01T00:00:00+00:00",
                        //    "checkingMessage": "",
                        //    "error": {...},
                        //    "foundVoters": [
                        //        {
                        //            "name": "JANE ANN DOE",
                        //            "address": ["123 MAIN ST", "AUSTIN TX 77777"],
                        //            "validFrom": "2020-01-01",
                        //            "dateRegistered": "2018-10-18",
                        //            "voterStatus": "ACTIVE",
                        //            "county": "TRAVIS",
                        //            "precinct": "200",
                        //            "vuid": "123456789",
                        //        },
                        //        ...
                        //    ],
                        //},
                    ],
                },
            }

            // status updates while running
            var intervalID = setInterval(function(){

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

            }, 100);

            // done trying to look up the voter
            function _processResults(entry){

                // get the latest found voters lookup
                var foundVoters = [];
                for(var i = (entry['stateStorage']['history'].length - 1); i >= 0; i--){
                    var historyItem = entry['stateStorage']['history'][i];
                    if(historyItem['type'] === "runChecking"){
                        foundVoters = historyItem['foundVoters'];
                    }
                }

                // found the voter, so save the db entry and close the window
                if(foundVoters.length === 1){

                    // change pending state to saving
                    document.querySelector("#results").innerHTML = `
                        <span id="voter-found">Voter found!</span>
                        <a id="close-window" href="#">Close this window</a>
                    `;
                    document.querySelector("#voter-found").innerText = browser.i18n.getMessage("voterFoundStatus");
                    document.querySelector("#close-window").innerText = browser.i18n.getMessage("voterFoundCloseWindow");

                    // close the add-registration interface
                    document.querySelector("#close-window").addEventListener("click", function(e){
                        e.preventDefault();
                        window.close();
                    });

                }

                // found multiple voters, so ask to select the correct one
                else if(foundVoters.length > 1){
                    document.querySelector("#results").innerHTML = browser.i18n.getMessage("multipleVotersError");
                    //TODO
                }

                // couldn't find a matching voter, so ask to correct and retry
                else if(foundVoters.length === 0){
                    document.querySelector("#results").innerHTML = browser.i18n.getMessage("voterNotFoundError");
                    document.querySelector("#submit-button").value = browser.i18n.getMessage("addRegSubmit");
                    document.querySelector("#submit-button").removeAttribute("disabled");
                    //TODO
                }

                // ran into another type of error, so package up a debug zip and offer to submit it as a bug
                //TODO
            }

            // run the checker (using the mocked db entry)
            window.PurgeAlert['TX'].checkRegistration(entry, true, _processResults);
        }

        // run lookup and save when form is submitted
        document.querySelector("#tx-add-form").addEventListener("submit", _addVoterRegistration);
    },

    //////////////////////////////
    // insertRegistrationForm() //
    //////////////////////////////
    "renderPopupEntry": function(entry){

        // get entry's most recent check in its history
        var historyItem = undefined;
        for(var i = (entry['stateStorage']['history'].length - 1); i >= 0; i--){
            var thisHistoryItem = entry['stateStorage']['history'][i];
            if(thisHistoryItem['type'] === "runChecking"){
                historyItem = entry['stateStorage']['history'][i];
                break;
            }
        }

        // no checks, so show blank state
        if(historyItem === undefined){
            return `
                <b>No checks yet</b>
            `;// TODO: make this better
        }

        // locale-specific date
        var updated = new Date(historyItem['created']);
        var updatedStr = updated.toLocaleDateString(browser.i18n.LanguageCode, {
            year: "numeric",
            month: "numeric",
            day: "numeric"
        })

        // zero voters found in the last check
        if(historyItem['foundVoters'].length === 0){
            var renderedHTML = `
                <b>No voter registration found!</b>
            `;// TODO: make this better
            return renderedHTML;
        }

        // more than one voters found in the last check
        if(historyItem['foundVoters'].length >= 2){
            var renderedHTML = `
                <b>Multiple matching voter registrations found!</b>
            `;// TODO: make this better
            return renderedHTML;
        }

        // found one voter's registration, hooray!
        var renderedHTML = `
            <style>
                #entry-${entry['key']}-content {
                    border: 1px solid #aaa;
                    padding: 0px 10px 10px 10px;
                    margin-top: 5px;
                }
                #entry-${entry['key']}-content .see-logs {
                    float: right;
                }
                #entry-${entry['key']}-content .checkmark {
                    color: #009900;
                }
            </style>
            <div id="entry-${entry['key']}-content">
                <div>
                    <div class="see-logs">
                        <a href="#" data-run="openLogs" data-state="TX" data-entry="${entry['key']}"
                            >${browser.i18n.getMessage("seeLogsLink")}</a>
                        <br>
                        <a href="#" data-run="openRemove" data-state="TX" data-entry="${entry['key']}"
                            >${browser.i18n.getMessage("removeLink")}</a>
                    </div>
                    <h4 class="name">
                        TX - ${historyItem['foundVoters'][0]['name']}
                        <a href="#" data-run="openEdit" data-state="TX" data-entry="${entry['key']}"
                            >${browser.i18n.getMessage("editLink")}</a>
                    </h4>
                    <div class="address">
                        ${historyItem['foundVoters'][0]['address'].join(", ")}
                    </div>
                    <div class="vuid">
                        VUID #: ${historyItem['foundVoters'][0]['vuid']}
                    </div>
                    <div class="status">
                        <b class="checkmark">✓</b>
                        ${browser.i18n.getMessage("regStatusValid")}
                    </div>
                    <div class="updates">
                        <span>${browser.i18n.getMessage("lastUpdatedPrefix")}</span>
                        <span>${updatedStr}</span>
                        <a href="#" data-run="checkAgain" data-state="TX" data-entry="${entry['key']}"
                            >${browser.i18n.getMessage("checkAgainLink")}</a>
                    </div>
                </div>
            </div>
        `;
        return renderedHTML;
    },

    ////////////////////////////////////////
    // checkRegistration(entry, callback) //
    ////////////////////////////////////////
    "checkRegistration": function(entry, canAskForUrlPermission, callback){

        // create a new checking run in the history
        var historyItem = {
            "type": "runChecking",
            "created": (new Date).toISOString(),
            "checkingMessage": "Starting...",
            "error": {},
            "foundVoters": [],
        }
        entry['stateStorage']['history'].push(historyItem);

        // mock a "lookup" TODO: make this real
        for(var i = 1; i <= 3; i++){
            setTimeout(function(index, thisEntry, thisHistoryItem){

                // update status message
                if(index < 3){
                    thisHistoryItem['checkingMessage'] = "Running " + index + "...";
                }

                // last iteration
                if(index === 3){
                    // populate found voters
                    var foundVoters = [
                        {
                            "name": "JANE ANN DOE",
                            "address": ["123 MAIN ST", "AUSTIN TX 77777"],
                            "validFrom": "2020-01-01",
                            "dateRegistered": "2018-10-18",
                            "voterStatus": "ACTIVE",
                            "county": "TRAVIS",
                            "precinct": "200",
                            "vuid": "123456789",
                        },
                    ]; //TODO: make this real
                    thisHistoryItem['foundVoters'] = foundVoters;

                    // update the status based on the voter lookup results
                    if(foundVoters.length === 1){
                        thisEntry['status'] = "valid";

                        // assign a uuid if a new entry
                        if(thisEntry['key'] === null){
                            thisEntry['key'] = uuid4();
                        }
                    }
                    // multiple voters found
                    else if(foundVoters.length > 1){
                        thisEntry['status'] = "needs-attention";
                    }
                    // no voter found
                    else if(foundVoters.length === 0){
                        thisEntry['status'] = "empty";
                    }

                    // save entry to storage and call callback (if any)
                    if(thisEntry['key'] !== null){
                        var dbUpdates = {};
                        dbUpdates[thisEntry['key']] = entry;
                        browser.storage.local.set(dbUpdates).then(function(){
                            if(callback){
                                callback(entry);
                            }
                        });
                    }
                }

            }, i * 1000, i, entry, historyItem);
        }
    },

    //////////////////////////////////////
    // other functions (state-specific) //
    //////////////////////////////////////

    // open the log explorer for an entry
    "openLogs": function(e, entryId){
        e.preventDefault();
        console.log("openLogs!"); //TODO
    },

    // open the edit interface for an entry
    "openEdit": function(e, entryId){
        e.preventDefault();
        console.log("openEdit!"); //TODO
    },

    // open the remove confirmation interface for an entry
    "openRemove": function(e, entryId){
        e.preventDefault();
        window.open(
            "states/TX/remove_confirm.html?entry=" + encodeURIComponent(entryId),
            "purge-alert-TX-remove",
            "width=500,height=500,dependent,menubar=no,toolbar=no,personalbar=no"
        );
    },

    // remove an entry
    "removeEntry": function(entryId, callback){
        browser.storage.local.remove(entryId).then(function(){
            if(callback){
                callback();
            }
        });
    },

    // open the edit interface for an entry
    "checkAgain": function(e, entryId){
        e.preventDefault();
        console.log("checkAgain!"); //TODO
    },

}
