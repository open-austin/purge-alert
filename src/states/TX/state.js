/*
 * What gets loaded when someone chooses this state
 * in the Add Registration dropdown.
 */
"use strict"
var PurgeAlert = PurgeAlert || {};
PurgeAlert['TX'] = {

    // API: insertRegistrationForm() inserts the TX-specific add_registration
    //      form into the generic add_registration experience
    "insertRegistrationForm": function(){
        var registrationXHR = new XMLHttpRequest();
        registrationXHR.open("GET", "/states/TX/add_registration.html");
        registrationXHR.onload = function(){
            // insert html
            document.querySelector("#state-section").innerHTML = registrationXHR.responseText;
            // insert javascript
            var addRegScript = document.createElement("script");
            addRegScript.src = "/states/TX/add_registration.js";
            document.querySelector("body").appendChild(addRegScript);
        };
        registrationXHR.send();
    },

    // API: renderPopupEntry() creates an entry in the browser action
    //      dropdown
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
                <h1 class="text-warning">
                    <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-minus-circle"/></svg>
                </h1>
                <div>
                    Contact support if you see this
                </div>
            `;
        }

        // last update is still pending, so show a pending status
        else if(entry['status'] === "pending"){
            statusHtml = `
                <h1 class="text-muted">
                    <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-refresh"/></svg>
                </h1>
                <div>
                    ${historyItem['checkingMessage']}
                </div>
            `;
        }

        // last update was successful, so show when that check was
        else if(entry['status'] === "valid"){
            statusHtml = `
                <h1 class="text-success">
                    <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-check"/></svg>
                </h1>
                <div>
                    ${browser.i18n.getMessage("lastUpdateValid")}
                </div>
            `;
        }

        // last update didn't find anything (possible purge!)
        else if(entry['status'] === "empty"){
            statusHtml = `
                <h1 class="text-danger">
                    <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-times"/></svg>
                </h1>
                <div>
                    ${browser.i18n.getMessage("lastUpdateEmpty")}
                </div>
            `;
        }

        // last update needs attention for some reason
        else if(entry['status'] === "needs-attention"){
            statusHtml = `
                <h1 class="text-warning">
                    <svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-exclamation-triangle"/></svg>
                </h1>
                <div>
                    ${browser.i18n.getMessage("lastUpdateNeedsAttention")}
                </div>
                <div>
                    <a
                        href="#"
                        class="btn btn-link btn-sm"
                        data-run="openEdit"
                        data-state="TX"
                        data-entry="${entry['key']}"
                        >${browser.i18n.getMessage("lastUpdateNeedsAttentionLink")}</a>
                </div>
            `;
        }


        // last updated date
        var lastUpdatedHtml = "Contact support if you see this";
        if(historyItem !== undefined){
            var updatedDate = (new Date(historyItem['updated'])).toLocaleDateString(browser.i18n.LanguageCode, {
                "year": "numeric",
                "month": "numeric",
                "day": "numeric",
            });
            lastUpdatedHtml = `
                ${browser.i18n.getMessage("lastUpdated")}
                <span class="time-since" data-dt="${historyItem['updated']}">${updatedDate}</span>
            `;
        }

        // found one voter's registration, hooray!
        var renderedHTML = `
            <style>
                #entry-${entry['key']}-content .card-body {
                    padding: 0;
                }
                #entry-${entry['key']}-content .card-body {
                    padding: 0;
                }
                #entry-${entry['key']}-content .entry-topline {
                    padding: 0 4px;
                }
                #entry-${entry['key']}-content .entry-body {
                    margin: 0;
                    font-size: 0.8rem;
                }
                #entry-${entry['key']}-content .name {
                    font-size: 1rem;
                    font-weight: bold;
                }
                #entry-${entry['key']}-content .entry-bottomline {
                    padding: 0 4px;
                }
            </style>
            <div id="entry-${entry['key']}-content" class="card">
                <div class="card-body">
                    <div class="text-right entry-topline">
                        <a
                            href="#"
                            class="small text-muted"
                            data-run="openEdit"
                            data-state="TX"
                            data-entry="${entry['key']}"
                            aria-label="${browser.i18n.getMessage("editLink")}"
                            title="${browser.i18n.getMessage("editLink")}"
                            ><svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-pencil"/></svg></a>
                        <a
                            href="#"
                            class="small text-muted"
                            data-run="openRemove"
                            data-state="TX"
                            data-entry="${entry['key']}"
                            aria-label="${browser.i18n.getMessage("removeLink")}"
                            title="${browser.i18n.getMessage("removeLink")}"
                            ><svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-times"/></svg></a>
                    </div>
                    <div class="row entry-body">
                        <div class="col-3">
                            <div class="row align-items-center">
                                <div class="col text-center">
                                    ${statusHtml}
                                </div>
                            </div>
                        </div>
                        <div class="col-9">
                            <div class="name text-truncate">
                                TX - ${voter['name']}
                            </div>
                            <div class="text-truncate">
                                ${voter['address'].join(", ")}
                            </div>
                            <div>
                                VUID #: ${voter['vuid']}
                            </div>
                            <div>
                                ${lastUpdatedHtml}
                                <a
                                    href="#"
                                    class="check-again-button text-muted"
                                    data-run="checkAgain"
                                    data-state="TX"
                                    data-entry="${entry['key']}"
                                    aria-label="${browser.i18n.getMessage("checkAgainLink")}"
                                    title="${browser.i18n.getMessage("checkAgainLink")}"
                                    ><svg class="icon"><use href="/assets/sprite-fontawesome-4.7.0.svg#fa-repeat"/></svg></a>
                            </div>
                        </div>
                    </div>
                    <div class="text-right entry-bottomline">
                        <a
                            href="#"
                            class="small text-muted"
                            data-run="openLogs"
                            data-state="TX"
                            data-entry="${entry['key']}"
                            >${browser.i18n.getMessage("seeLogsLink")}</a>
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
                    historyItem['updated'] = (new Date).toISOString();
                    historyItem['checkingMessage'] = "Found voter!"; // TODO: i18n
                }

                // no voter found
                var errorSection = /Voter NOT found using the information provided\./mg;
                var errorMatch = errorSection.exec(lookupXHR.responseText);
                if(errorMatch){
                    entry['status'] = "empty";
                    historyItem['result'] = "no_voter_found";
                    historyItem['updated'] = (new Date).toISOString();
                    historyItem['checkingMessage'] = "Found no voters :("; // TODO: i18n
                    console.log("lookupXHR", lookupXHR); // TODO: do something with the error instead of just logging it
                }

                // blocked by cloudflare
                if(lookupXHR.status === 403
                && lookupXHR.responseText.indexOf("Cloudflare Ray ID:") !== -1){
                    entry['status'] = "needs-attention";
                    historyItem['result'] = "blocked_by_cloudflare";
                    historyItem['updated'] = (new Date).toISOString();
                    historyItem['checkingMessage'] = "Blocked by Cloudflare :("; // TODO: i18n
                    console.log("lookupXHR", lookupXHR); // TODO: do something with the error instead of just logging it
                }

                // needs permission
                if(lookupXHR.status === 0){
                    entry['status'] = "needs-attention";
                    historyItem['result'] = "need_permission";
                    historyItem['updated'] = (new Date).toISOString();
                    historyItem['checkingMessage'] = "Need your permission to lookup your voter registration"; // TODO: i18n
                    console.log("lookupXHR", lookupXHR); // TODO: do something with the error instead of just logging it
                }

                // unknown error if result still isn't set
                if(historyItem['result'] === null){
                    entry['status'] = "needs-attention";
                    historyItem['result'] = "other_error";
                    historyItem['updated'] = (new Date).toISOString();
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
        browser.windows.create({
            "type": "popup",
            "url": "states/TX/view_logs.html?entry=" + encodeURIComponent(entryId),
            "width": 500,
            "height": 500,
        });
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

        // remove the entry from the mapper
        browser.storage.local.get("entries").then(function(storageMatches){
            var entries = storageMatches['entries'] || {};
            if(entries[entryId] !== undefined){
                delete storageMatches['entries'][entryId];
                browser.storage.local.set(storageMatches).then(function(){

                    // remove the entry itself
                    browser.storage.local.remove(entryId).then(function(){
                        if(callback){
                            callback();
                        }
                    });

                });
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
                "updated": (new Date).toISOString(),
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
                entryDiv.querySelector(".check-again-button").classList.add("d-none");

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
