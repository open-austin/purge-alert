/*
 * What gets loaded when someone chooses this state
 * in the Add Registration dropdown.
 */
"use strict"
var PurgeAlert = PurgeAlert || {};
PurgeAlert['TX'] = {

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
            <h3>
                Texas ${browser.i18n.getMessage("addRegStateTitle")}
            </h3>
            <form id="tx-add-form">
                <div>
                    <label for="tx-first-name">
                        ${browser.i18n.getMessage("addRegFirstNameLabel")}:
                    </label>
                    <input id="tx-first-name" placeholder="${browser.i18n.getMessage("addRegFirstNamePlaceholder")}">
                </div>
                <div>
                    <label for="tx-last-name">
                        ${browser.i18n.getMessage("addRegLastNameLabel")}:
                    </label>
                    <input id="tx-last-name" placeholder="${browser.i18n.getMessage("addRegLastNamePlaceholder")}">
                </div>
                <div>
                    <label for="tx-date-of-birth">
                        ${browser.i18n.getMessage("addRegDateOfBirthLabel")}:
                    </label>
                    <input
                        id="tx-date-of-birth"
                        type="date"
                        min="${(new Date((new Date()).setFullYear((new Date()).getFullYear() - 150))).toISOString().substring(0,10)}"
                        max="${(new Date()).toISOString().substring(0,10)}">
                </div>
                <div>
                    <label for="tx-county">
                        ${browser.i18n.getMessage("addRegCountyLabel")}:
                    </label>
                    <select id="tx-county">
                        <option value="">${browser.i18n.getMessage("addRegCountyPlaceholder")}</option>
                        ${PurgeAlert['TX']['COUNTIES'].map((county) => `
                            <option value="${county}">${county}</option>
                        `).join('')}
                    </select>
                </div>
                <div>
                    <label for="tx-zip-code">
                        ${browser.i18n.getMessage("addRegZipCodeLabel")}:
                    </label>
                    <input id="tx-zip-code" placeholder="${browser.i18n.getMessage("addRegZipCodePlaceholder")}">
                </div>
                <div id="tx-submit-wrapper">
                    <input id="tx-submit-button" type="submit" value="${browser.i18n.getMessage("addRegSubmit")}">
                    <a id="tx-cancel" href="#">Nevermind</a>
                </div>
            </form>
            <div id="tx-results">
            </div>
        `;

        // voter registration lookup and save to storage
        function _addVoterRegistration(e){

            // submitting state
            e.preventDefault();
            document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmitting");
            document.querySelector("#tx-submit-button").setAttribute("disabled", "");

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
                    "firstName": document.querySelector("#tx-first-name").value,
                    "lastName": document.querySelector("#tx-last-name").value,
                    "dateOfBirth": document.querySelector("#tx-date-of-birth").value,
                    "county": document.querySelector("#tx-county").value,
                    "zipCode": document.querySelector("#tx-zip-code").value,
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
                        document.querySelector("#tx-results").innerHTML = historyItem['checkingMessage'];
                        break;
                    }
                }

            }, 100);

            // done trying to look up the voter
            function _processResults(entry){

                // get what voters were found (assume the lookup
                var foundVoters = entry['stateStorage']['history'][entry['stateStorage']['history'].length - 1]['foundVoters'];

                // found the voter, so save the db entry and close the window
                if(foundVoters.length === 1){

                    // change pending state to saving
                    document.querySelector("#tx-results").innerHTML = `
                        <span id="tx-voter-found">Voter found!</span>
                        <a id="tx-close-window" href="#">Close this window</a>
                    `;
                    document.querySelector("#tx-voter-found").innerText = browser.i18n.getMessage("voterFoundStatus");
                    document.querySelector("#tx-close-window").innerText = browser.i18n.getMessage("voterFoundCloseWindow");

                    // close the add-registration interface
                    document.querySelector("#tx-close-window").addEventListener("click", function(e){
                        e.preventDefault();
                        browser.windows.getCurrent().then(function(w){
                            browser.windows.remove(w.id);
                        });
                    });

                }

                // found multiple voters, so ask to select the correct one
                else if(foundVoters.length > 1){
                    document.querySelector("#tx-results").innerHTML = browser.i18n.getMessage("multipleVotersError");
                    //TODO
                }

                // couldn't find a matching voter, so ask to correct and retry
                else if(foundVoters.length === 0){
                    document.querySelector("#tx-results").innerHTML = browser.i18n.getMessage("voterNotFoundError");
                    document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
                    document.querySelector("#tx-submit-button").removeAttribute("disabled");
                    //TODO
                }

                // ran into another type of error, so package up a debug zip and offer to submit it as a bug
                //TODO
            }

            // ask for permission if don't already have it
            browser.permissions.contains({
                origins: ["*://*.sos.texas.gov/*"],
            }).then(function(hasPermission){

                // has permission, so run the checker now
                if(hasPermission){
                    PurgeAlert['TX'].checkRegistration(entry, _processResults);
                }

                // doesn't have permission, so ask the user to provide permission
                else {

                    // show message to prepare the user for the popup
                    document.querySelector("#tx-results").innerHTML = `
                        ${browser.i18n.getMessage("stateTexasPermissionAsk")}:
                        <button id="tx-grant-permission">${browser.i18n.getMessage("addRegPermissionButton")}</button>
                    `;

                    // ask for permission when the user says to show the prompt
                    document.querySelector("#tx-grant-permission").addEventListener("click", function(e){
                        e.preventDefault();

                        // extension permission request
                        browser.permissions.request({
                            origins: ["*://*.sos.texas.gov/*"],
                        }).then(function(givenPermission){

                            // given permission, so check the submitted registration
                            if(givenPermission){
                                PurgeAlert['TX'].checkRegistration(entry, _processResults);
                            }

                            // permission denied, so show the same permission prep
                            else {
                                document.querySelector("#tx-results").innerHTML = `
                                    ${browser.i18n.getMessage("stateTexasPermissionAsk")}:
                                    <button id="tx-grant-permission">${browser.i18n.getMessage("addRegPermissionButton")}</button>
                                `;
                            }
                        });
                    });
                }
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

        // status html default (should always be overwritten)
        var statusHtml = "Unknown status (if you see this, email us!)";

        // last update is still pending, so show a pending status
        if(entry['status'] === "pending"){
            statusHtml = `
                ${historyItem['checkingMessage']}
            `;
        }

        // last update was successful, so show when that check was
        else if(entry['status'] === "valid"){
            var updatedDate = (new Date(historyItem['created'])).toLocaleDateString(browser.i18n.LanguageCode, {
                "year": "numeric",
                "month": "numeric",
                "day": "numeric",
            });
            statusHtml = `
                ${browser.i18n.getMessage("lastUpdateValid").replace("[DATE]", updatedDate)}
                <a href="#" data-run="checkAgain" data-state="TX" data-entry="${entry['key']}"
                    >${browser.i18n.getMessage("checkAgainLink")}</a>
            `;
        }

        // last update didn't find anything (possible purge!)
        else if(entry['status'] === "empty"){
            var updatedDate = (new Date(historyItem['created'])).toLocaleDateString(browser.i18n.LanguageCode, {
                "year": "numeric",
                "month": "numeric",
                "day": "numeric",
            });
            statusHtml = `
                ${browser.i18n.getMessage("lastUpdateEmpty").replace("[DATE]", updatedDate)}
                <a href="#" data-run="openEdit" data-state="TX" data-entry="${entry['key']}"
                    >${browser.i18n.getMessage("lastUpdateEmptyLink")}</a>
            `;
        }

        // last update needs attention for some reason
        else if(entry['status'] === "needs-attention"){
            statusHtml = `
                ${browser.i18n.getMessage("lastUpdateNeedsAttention")}
                <a href="#" data-run="openEdit" data-state="TX" data-entry="${entry['key']}"
                    >${browser.i18n.getMessage("lastUpdateNeedsAttentionLink")}</a>
            `;
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
                        ${statusHtml}
                    </div>
                </div>
            </div>
        `;
        return renderedHTML;
    },

    ////////////////////////////////////////
    // checkRegistration(entry, callback) //
    ////////////////////////////////////////
    "checkRegistration": function(entry, callback){

        // create a new checking run in the history
        var historyItem = {
            "type": "runChecking",
            "created": (new Date).toISOString(),
            "checkingMessage": "Checking...",
            "error": {},
            "foundVoters": [],
        }
        entry['stateStorage']['history'].push(historyItem);

        // convert county to countyId
        var countyIndex = PurgeAlert['TX']['COUNTIES'].indexOf(entry['stateStorage']['county']);
        var countyId = countyIndex + 1; // it's just the index + 1

        // convert ISO date of birth to locale date (e.g. "1950-12-25" --> "12/25/1950")
        var dateOfBirth = "" +
            entry['stateStorage']['dateOfBirth'].substring(5, 7) + "/" +
            entry['stateStorage']['dateOfBirth'].substring(8, 10) + "/" +
            entry['stateStorage']['dateOfBirth'].substring(0, 4);

        // build POST request body based on voter details in the entry
        // TODO: support other types of lookups
        var lookupPayload = "" +
            "selType=" + encodeURIComponent("lfcd") +
            "&firstName=" + encodeURIComponent(entry['stateStorage']['firstName']) +
            "&lastName=" + encodeURIComponent(entry['stateStorage']['lastName']) +
            "&nmSuffix=" +
            "&county=" + encodeURIComponent(countyId) +
            "&dob=" + encodeURIComponent(dateOfBirth) +
            "&adZip5=" + encodeURIComponent(entry['stateStorage']['zipCode']) +
            "&idVoter=" +
            "&vuidDob=" +
            "&idTdl=" +
            "&tdlDob=" +
            "&popupClicker=" +
            "&popupClicker2=" +
            "&popupClicker3=" +
            "&language=" +
            "&countyName=" +
            "&currentSearch=";

        // voter lookup request function
        function doLookupRequest(thisLookupPayload){
            var lookupXHR = new XMLHttpRequest();
            lookupXHR.open("POST", "https://teamrv-mvp.sos.texas.gov/MVP/voterDetails.do");
            lookupXHR.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
            lookupXHR.onreadystatechange = function(){
                // done with the request
                if(lookupXHR.readyState === XMLHttpRequest.DONE){

                    // found a voter
                    var voterSection = /id="fullNameSpan"([\s\S]+?)<\/td>/mg;
                    var voterMatch = voterSection.exec(lookupXHR.responseText);
                    if(voterMatch){
                        var voterName = voterMatch[1].match(/>Name: ([^<]+)<\/span><br>/);
                        var voterAddress = voterMatch[1].match(/^Address: ([\s\S]+?)<\/span>/m);
                        var voterValidFrom = voterMatch[1].match(/<span>Valid From: ([0-9]{2})\/([0-9]{2})\/([0-9]{4})<\/span><br>/);
                        var voterDateRegistered = voterMatch[1].match(/<span>Effective Date of Registration: ([0-9]{2})\/([0-9]{2})\/([0-9]{4})<\/span><br>/);
                        var voterStatus = voterMatch[1].match(/<span>Voter Status: ([^<]+)<\/span><br>/);
                        var voterCounty = voterMatch[1].match(/<span>County: ([^<]+)<\/span><br>/);
                        var voterPrecinct = voterMatch[1].match(/<span>Precinct: ([^<]+)<\/span><br>/);
                        var voterVUID = voterMatch[1].match(/<span>VUID: ([^<]+)<\/span><br>/);
                        historyItem['foundVoters'].push({
                            "name": voterName[1].trim(),
                            "address": voterAddress[1].split(/<br ?\/?>/).map(function(i) { return i.trim(); }),
                            "validFrom": `${voterValidFrom[3]}-${voterValidFrom[1]}-${voterValidFrom[2]}`,
                            "dateRegistered": `${voterDateRegistered[3]}-${voterDateRegistered[1]}-${voterDateRegistered[2]}`,
                            "voterStatus": voterStatus[1].trim(),
                            "county": voterCounty[1].trim(),
                            "precinct": voterPrecinct[1].trim(),
                            "vuid": voterVUID[1].trim(),
                        });
                    }

                    // voter lookup error
                    var errorSection = /Voter NOT found using the information provided\./mg;
                    var errorMatch = errorSection.exec(lookupXHR.responseText);
                    console.log("errorMatch", errorMatch); // TODO: do something with this error instead of just logging it

                    // update the status based on the voter lookup results
                    if(historyItem['foundVoters'].length === 1){
                        entry['status'] = "valid";
                        historyItem['checkingMessage'] = "Found 1 voter!";

                        // assign a uuid if a new entry
                        if(entry['key'] === null){
                            entry['key'] = uuid4();
                        }
                    }
                    // multiple voters found
                    else if(historyItem['foundVoters'].length > 1){
                        entry['status'] = "needs-attention";
                        historyItem['checkingMessage'] = "Found multiple voters!";
                    }
                    // no voter found
                    else if(historyItem['foundVoters'].length === 0){
                        entry['status'] = "empty";
                        historyItem['checkingMessage'] = "Found no voters :(";
                    }

                    // save entry to storage and call callback (if any)
                    if(entry['key'] !== null){
                        var dbUpdates = {};
                        dbUpdates[entry['key']] = entry;
                        browser.storage.local.set(dbUpdates).then(function(){
                            // done saving to storage, so call the callback
                            if(callback){
                                callback(entry);
                            }
                        });
                    }
                    // nothing to save, so just call the callback
                    else if(callback){
                        callback(entry);
                    }
                }
            };
            lookupXHR.send(thisLookupPayload);
        }

        // can ask for permission, so try it
        browser.permissions.contains({
            origins: ["*://*.sos.texas.gov/*"],
        }).then(function(hasPermission){

            // has permission, so make the request
            if(hasPermission){
                doLookupRequest(lookupPayload);
            }

            // don't have permission, and can't ask for it, so just log an error
            else {
                // log the error
                entry['status'] = "needs-attention";
                historyItem['checkingMessage'] = "Missing browser permission";
                historyItem['error'] = {
                    "type": "permission",
                    "description": "We didn't have the browser's permission to check the Texas Secretary of State's website (sos.texas.gov).",
                };
                // save to storage
                if(entry['key'] !== null){
                    var dbUpdates = {};
                    dbUpdates[entry['key']] = entry;
                    browser.storage.local.set(dbUpdates).then(function(){
                        // done saving to storage, so call the callback
                        if(callback){
                            callback(entry);
                        }
                    });
                }
            }

        });
    },

    //////////////////////////////////////
    // other functions (state-specific) //
    //////////////////////////////////////

    "COUNTIES": [
        "ANDERSON", "ANDREWS", "ANGELINA", "ARANSAS", "ARCHER", "ARMSTRONG", "ATASCOSA", "AUSTIN", "BAILEY",
        "BANDERA", "BASTROP", "BAYLOR", "BEE", "BELL", "BEXAR", "BLANCO", "BORDEN", "BOSQUE", "BOWIE", "BRAZORIA",
        "BRAZOS", "BREWSTER", "BRISCOE", "BROOKS", "BROWN", "BURLESON", "BURNET", "CALDWELL", "CALHOUN", "CALLAHAN",
        "CAMERON", "CAMP", "CARSON", "CASS", "CASTRO", "CHAMBERS", "CHEROKEE", "CHILDRESS", "CLAY", "COCHRAN",
        "COKE", "COLEMAN", "COLLIN", "COLLINGSWORTH", "COLORADO", "COMAL", "COMANCHE", "CONCHO", "COOKE", "CORYELL",
        "COTTLE", "CRANE", "CROCKETT", "CROSBY", "CULBERSON", "DALLAM", "DALLAS", "DAWSON", "DEAF SMITH", "DELTA", "DENTON",
        "DEWITT", "DICKENS", "DIMMIT", "DONLEY", "DUVAL", "EASTLAND", "ECTOR", "EDWARDS", "ELLIS", "EL PASO", "ERATH",
        "FALLS", "FANNIN", "FAYETTE", "FISHER", "FLOYD", "FOARD", "FORT BEND", "FRANKLIN", "FREESTONE", "FRIO", "GAINES",
        "GALVESTON", "GARZA", "GILLESPIE", "GLASSCOCK", "GOLIAD", "GONZALES", "GRAY", "GRAYSON", "GREGG", "GRIMES",
        "GUADALUPE", "HALE", "HALL", "HAMILTON", "HANSFORD", "HARDEMAN", "HARDIN", "HARRIS", "HARRISON", "HARTLEY",
        "HASKELL", "HAYS", "HEMPHILL", "HENDERSON", "HIDALGO", "HILL", "HOCKLEY", "HOOD", "HOPKINS", "HOUSTON", "HOWARD",
        "HUDSPETH", "HUNT", "HUTCHINSON", "IRION", "JACK", "JACKSON", "JASPER", "JEFF DAVIS", "JEFFERSON", "JIM HOGG",
        "JIM WELLS", "JOHNSON", "JONES", "KARNES", "KAUFMAN", "KENDALL", "KENEDY", "KENT", "KERR", "KIMBLE", "KING",
        "KINNEY", "KLEBERG", "KNOX", "LAMAR", "LAMB", "LAMPASAS", "LASALLE", "LAVACA", "LEE", "LEON", "LIBERTY",
        "LIMESTONE", "LIPSCOMB", "LIVE OAK", "LLANO", "LOVING", "LUBBOCK", "LYNN", "MADISON", "MARION", "MARTIN", "MASON",
        "MATAGORDA", "MAVERICK", "MCCULLOCH", "MCLENNAN", "MCMULLEN", "MEDINA", "MENARD", "MIDLAND", "MILAM", "MILLS",
        "MITCHELL", "MONTAGUE", "MONTGOMERY", "MOORE", "MORRIS", "MOTLEY", "NACOGDOCHES", "NAVARRO", "NEWTON", "NOLAN",
        "NUECES", "OCHILTREE", "OLDHAM", "ORANGE", "PALO PINTO", "PANOLA", "PARKER", "PARMER", "PECOS", "POLK", "POTTER",
        "PRESIDIO", "RAINS", "RANDALL", "REAGAN", "REAL", "RED RIVER", "REEVES", "REFUGIO", "ROBERTS", "ROBERTSON",
        "ROCKWALL", "RUNNELS", "RUSK", "SABINE", "SAN AUGUSTINE", "SAN JACINTO", "SAN PATRICIO", "SAN SABA", "SCHLEICHER",
        "SCURRY", "SHACKELFORD", "SHELBY", "SHERMAN", "SMITH", "SOMERVELL", "STARR", "STEPHENS", "STERLING", "STONEWALL",
        "SUTTON", "SWISHER", "TARRANT", "TAYLOR", "TERRELL", "TERRY", "THROCKMORTON", "TITUS", "TOM GREEN", "TRAVIS",
        "TRINITY", "TYLER", "UPSHUR", "UPTON", "UVALDE", "VAL VERDE", "VAN ZANDT", "VICTORIA", "WALKER", "WALLER", "WARD",
        "WASHINGTON", "WEBB", "WHARTON", "WHEELER", "WICHITA", "WILBARGER", "WILLACY", "WILLIAMSON", "WILSON", "WINKLER",
        "WISE", "WOOD", "YOAKUM", "YOUNG", "ZAPATA", "ZAVALA"
    ],

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
        browser.windows.create({
            "type": "popup",
            "url": "states/TX/remove_confirm.html?entry=" + encodeURIComponent(entryId),
            "width": 300,
            "height": 200,
        });
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

        // get the entry from storage
        browser.storage.local.get(entryId).then(function(entries){

            // set entry as pending and save it to storage
            var entry = entries[entryId];
            entry['status'] = "pending";
            var dbUpdates = {};
            dbUpdates[entryId] = entry;
            browser.storage.local.set(dbUpdates).then(function(){

                // put checking state
                var entryDiv = document.querySelector("#entry-" + entryId);
                entryDiv.querySelector(".updates").innerHTML = browser.i18n.getMessage("checkAgainSubmit");

                // clear the entry diff cache so it gets reloaded
                entryDiv.removeAttribute("data-content");

                // kickoff checking the registration again
                PurgeAlert['TX'].checkRegistration(entry);
            });

        });
    },

}
