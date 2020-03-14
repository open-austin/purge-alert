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
                        document.querySelector("#tx-results").innerHTML = historyItem['checkingMessage'];
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
                    entry['key'] = uuid4();
                    dbUpdates[entry['key']] = entry;
                    browser.storage.local.set(dbUpdates).then(function(){

                        // change pending state to saving
                        document.querySelector("#tx-results").innerHTML = `
                            <span id="tx-voter-found">Voter found!</span>
                            <a id="tx-close-window" href="#">Close this window</a>
                        `;
                        document.querySelector("#tx-voter-found").innerText = browser.i18n.getMessage("addRegSuccess");
                        document.querySelector("#tx-close-window").innerText = browser.i18n.getMessage("addRegCloseWindow");

                        // close the add-registration interface
                        document.querySelector("#tx-close-window").addEventListener("click", function(e){
                            e.preventDefault();
                            browser.windows.getCurrent().then(function(w){
                                browser.windows.remove(w.id);
                            });
                        });

                    });
                }

                // couldn't find a matching voter, so ask to correct and retry
                else if(result === "no_voter_found"){
                    document.querySelector("#tx-results").innerHTML = browser.i18n.getMessage("voterNotFoundError");
                    document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
                    document.querySelector("#tx-submit-button").removeAttribute("disabled");
                }

                // request blocked by cloudflare >:(
                else if(result === "blocked_by_cloudflare"){
                    document.querySelector("#tx-results").innerHTML = browser.i18n.getMessage("blockedByCloudflare");
                    document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
                    document.querySelector("#tx-submit-button").removeAttribute("disabled");
                    //TODO: add recovery options
                }

                // didn't have permission to access the TX SOS site >:(
                else if(result === "need_permission"){
                    document.querySelector("#tx-results").innerHTML = browser.i18n.getMessage("needPermissionError");
                    document.querySelector("#tx-submit-button").value = browser.i18n.getMessage("addRegSubmit");
                    document.querySelector("#tx-submit-button").removeAttribute("disabled");
                    //TODO: add recovery options
                }

                // some other error occurred
                else if(result === "other_error"){
                    document.querySelector("#tx-results").innerHTML = browser.i18n.getMessage("voterLookupError");
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

                    // show message to prepare the user for the popup
                    document.querySelector("#tx-results").innerHTML = `
                        ${browser.i18n.getMessage("stateTexasPermissionAsk")}:
                        <button id="tx-grant-permission">${browser.i18n.getMessage("askPermissionButton")}</button>
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
                                intervalID = setInterval(_monitorStatus, 100);
                            }

                            // permission denied, so show the same permission prep
                            else {
                                document.querySelector("#tx-results").innerHTML = `
                                    ${browser.i18n.getMessage("stateTexasPermissionAsk")}:
                                    <button id="tx-grant-permission">${browser.i18n.getMessage("askPermissionButton")}</button>
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

        // get entry's current voter details
        var voter = entry['stateStorage']['voter'];

        // get entry's most recent check in its history
        var historyItem = undefined;
        for(var i = (entry['stateStorage']['history'].length - 1); i >= 0; i--){
            var thisHistoryItem = entry['stateStorage']['history'][i];
            if(thisHistoryItem['type'] === "runChecking"){
                historyItem = entry['stateStorage']['history'][i];
                break;
            }
        }

        // status html default (should always be overwritten)
        var statusHtml = "Unknown status (if you see this, email us!)";

        // no history items
        if(historyItem === undefined){
            statusHtml = `
                No checks yet.
            `;
        }

        // last update is still pending, so show a pending status
        else if(entry['status'] === "pending"){
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
                        TX - ${voter['name']}
                        <a href="#" data-run="openEdit" data-state="TX" data-entry="${entry['key']}"
                            >${browser.i18n.getMessage("editLink")}</a>
                    </h4>
                    <div class="address">
                        ${voter['address'].join(", ")}
                    </div>
                    <div class="vuid">
                        VUID #: ${voter['vuid']}
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

        // assume the last history item for this checkRegistration call
        var historyItem = entry['stateStorage']['history'][entry['stateStorage']['history'].length - 1];

        // convert county to countyId
        var countyIndex = PurgeAlert['TX']['COUNTIES'].indexOf(historyItem['lookup']['county']);
        var countyId = countyIndex + 1; // it's just the index + 1

        // convert ISO date of birth to locale date (e.g. "1950-12-25" --> "12/25/1950")
        var dateOfBirth = "" +
            historyItem['lookup']['dateOfBirth'].substring(5, 7) + "/" +
            historyItem['lookup']['dateOfBirth'].substring(8, 10) + "/" +
            historyItem['lookup']['dateOfBirth'].substring(0, 4);

        // build POST request body based on voter details in the entry
        // TODO: support other types of lookups
        var lookupPayload = "" +
            "selType=" + encodeURIComponent("lfcd") +
            "&firstName=" + encodeURIComponent(historyItem['lookup']['firstName']) +
            "&lastName=" + encodeURIComponent(historyItem['lookup']['lastName']) +
            "&nmSuffix=" +
            "&county=" + encodeURIComponent(countyId) +
            "&dob=" + encodeURIComponent(dateOfBirth) +
            "&adZip5=" + encodeURIComponent(historyItem['lookup']['zipCode']) +
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

                    // extract voter details
                    var voterName = voterMatch[1].match(/>Name: ([^<]+)<\/span><br>/);
                    var voterAddress = voterMatch[1].match(/^Address: ([\s\S]+?)<\/span>/m);
                    var voterValidFrom = voterMatch[1].match(/<span>Valid From: ([0-9]{2})\/([0-9]{2})\/([0-9]{4})<\/span><br>/);
                    var voterDateRegistered = voterMatch[1].match(/<span>Effective Date of Registration: ([0-9]{2})\/([0-9]{2})\/([0-9]{4})<\/span><br>/);
                    var voterStatus = voterMatch[1].match(/<span>Voter Status: ([^<]+)<\/span><br>/);
                    var voterCounty = voterMatch[1].match(/<span>County: ([^<]+)<\/span><br>/);
                    var voterPrecinct = voterMatch[1].match(/<span>Precinct: ([^<]+)<\/span><br>/);
                    var voterVUID = voterMatch[1].match(/<span>VUID: ([^<]+)<\/span><br>/);
                    historyItem['voter'] = {
                        "name": voterName[1].trim(),
                        "address": voterAddress[1].split(/<br ?\/?>/).map(function(i) { return i.trim(); }),
                        "validFrom": `${voterValidFrom[3]}-${voterValidFrom[1]}-${voterValidFrom[2]}`,
                        "dateRegistered": `${voterDateRegistered[3]}-${voterDateRegistered[1]}-${voterDateRegistered[2]}`,
                        "voterStatus": voterStatus[1].trim(),
                        "county": voterCounty[1].trim(),
                        "precinct": voterPrecinct[1].trim(),
                        "vuid": voterVUID[1].trim(),
                    };

                    // lookup was a success!
                    entry['status'] = "valid";
                    entry['stateStorage']['lookup'] = historyItem['lookup'];
                    entry['stateStorage']['voter'] = historyItem['voter'];
                    historyItem['result'] = "success";
                    historyItem['checkingMessage'] = "Found voter!"; // TODO: i18n
                }

                // no voter found
                var errorSection = /Voter NOT found using the information provided\./mg;
                var errorMatch = errorSection.exec(lookupXHR.responseText);
                if(errorMatch){
                    entry['status'] = "empty";
                    historyItem['result'] = "no_voter_found";
                    historyItem['checkingMessage'] = "Found no voters :("; // TODO: i18n
                    console.log("lookupXHR", lookupXHR); // TODO: do something with the error instead of just logging it
                }

                // blocked by cloudflare
                if(lookupXHR.status === 403
                && lookupXHR.responseText.indexOf("Cloudflare Ray ID:") !== -1){
                    entry['status'] = "needs-attention";
                    historyItem['result'] = "blocked_by_cloudflare";
                    historyItem['checkingMessage'] = "Blocked by Cloudflare :("; // TODO: i18n
                    console.log("lookupXHR", lookupXHR); // TODO: do something with the error instead of just logging it
                }

                // needs permission
                if(lookupXHR.status === 0){
                    entry['status'] = "needs-attention";
                    historyItem['result'] = "need_permission";
                    historyItem['checkingMessage'] = "Need your permission to lookup your voter registration"; // TODO: i18n
                    console.log("lookupXHR", lookupXHR); // TODO: do something with the error instead of just logging it
                }

                // unknown error if result still isn't set
                if(historyItem['result'] === null){
                    entry['status'] = "needs-attention";
                    historyItem['result'] = "other_error";
                    historyItem['checkingMessage'] = "An error occurred during lookup :("; // TODO: i18n
                    console.log("lookupXHR", lookupXHR); // TODO: do something with the error instead of just logging it
                }

                // done checking, so call the callback
                if(callback){
                    callback(entry);
                }
            }
        };
        lookupXHR.send(lookupPayload);
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
        browser.windows.create({
            "type": "popup",
            "url": "states/TX/edit_entry.html?entry=" + encodeURIComponent(entryId),
            "width": 500,
            "height": 500,
        });
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

            // add a new pending history item
            var entry = entries[entryId];
            entry['status'] = "pending";
            entry['stateStorage']['history'].push({
                "type": "runChecking",
                "created": (new Date).toISOString(),
                "checkingMessage": "Checking...", // TODO: i18n
                "lookup": entry['stateStorage']['lookup'],
                "result": null,
                "error": {},
                "voter": {},
            });

            // set entry as pending and save it to storage
            var dbUpdates = {};
            dbUpdates[entryId] = entry;
            browser.storage.local.set(dbUpdates).then(function(){

                // put checking state
                var entryDiv = document.querySelector("#entry-" + entryId);
                entryDiv.querySelector(".updates").innerHTML = browser.i18n.getMessage("checkAgainSubmit");

                // clear the entry diff cache so it gets reloaded
                entryDiv.removeAttribute("data-content");

                // kickoff checking the registration again
                PurgeAlert['TX'].checkRegistration(entry, function(updatedEntry){
                    var dbUpdates = {};
                    dbUpdates[updatedEntry['key']] = updatedEntry;
                    browser.storage.local.set(dbUpdates);
                });
            });

        });
    },

}
