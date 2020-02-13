
// global PA object
window.PurgeAlert = {};

// render the selected state's add-registration form
function updateStateSection(){

    // get which state is selected in the dropdown
    var state = document.querySelector("#state-dropdown").value;
    if(state){

        // insert the state's logic if not already added
        if(!document.querySelectorAll("#add-registration-" + state).length){
            var stateScript = document.createElement("script");
            stateScript.id = "add-registration-" + state;
            stateScript.src = "states/" + state + "/state.js";
            document.querySelector("body").appendChild(stateScript);
        }

        // call the selected state's insertRegistrationForm()
        if(window.PurgeAlert[state] && window.PurgeAlert[state].insertRegistrationForm){
            window.PurgeAlert[state].insertRegistrationForm();
        }
        // the state's script hasn't loaded yet, so wait a bit and try again
        else {
            setTimeout(updateStateSection, 50);
        }
    }

    // no state selected
    else{
        document.querySelector("#state-section").innerHTML = "";
    }
}
updateStateSection();
document.querySelector("#state-dropdown").addEventListener("change", updateStateSection);
