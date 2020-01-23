console.log("add_registration.js loaded!");

window.PurgeAlert = {};

function updateStateSection(){
    var state = document.querySelector("#state-dropdown").value;
    console.log("updateStateSection called!", state);
    if(state){
        if(!document.querySelectorAll("#add-registration-" + state).length){
            var stateScript = document.createElement("script");
            stateScript.id = "add-registration-" + state;
            stateScript.src = "states/" + state + "/add_registration.js";
            document.querySelector("body").appendChild(stateScript);
        }
        var intervalID = window.setInterval(function(state){
            if(window.PurgeAlert[state] && window.PurgeAlert[state].insertRegistrationForm){
                window.PurgeAlert[state].insertRegistrationForm();
                clearInterval(intervalID);
            }
        }, 100, state);
        
    }
    else{
        document.querySelector("#state-section").innerHTML = "";
    }
}
updateStateSection();
document.querySelector("#state-dropdown").addEventListener("change", updateStateSection);
