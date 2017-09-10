// Global variables
var today = new Date();
var currentMonth = new Month(today.getFullYear(), today.getMonth());
var months = ["January", "February", "March", "April", "May", "June",
			  "July", "August", "September", "October", "November", "December"];
// bool val indicating if a user is logged in
var is_logged_in = false;
// session token
var token = "";
// array of array elements,containing current month events
var month_events = null;
// array of array elements,containing selected date's events
var date_events = null;
// array of array elements,containing all of user's events
var all_events = null;
// array of array elements,containing all registered users
var all_users = null;
// date of mouse selected calendar box
var selected_date = "";
// username and id of currently logged in user
var username = "";
var user_id = "";

// Update cqlender
function updateCalendar()
{
	$("#month_info").text( months[currentMonth.month] + " " + currentMonth.year );
	$("#calendar_table").html("<tr class='info' id='calendar_header'>" +
							  "<th>Sunday</th>" +
							  "<th>Monday</th>" + 
							  "<th>Tuesday</th>" +
							  "<th>Wednesay</th>" +
							  "<th>Thursday</th>" +
							  "<th>Friday</th>" +
							  "<th>Satday</th></tr>");
	var first_day_of_month = false;
	var tr = "";
	var weeks = currentMonth.getWeeks();
	var id = "";
	for(var w in weeks) {
		var days = weeks[w].getDates();
		tr += "<tr>";
		for(var d in days) {
			id = days[d].getFullYear() + '-' + 
				 ("0" + (days[d].getMonth() + 1)).slice(-2) + '-' + 
				 ("0" + days[d].getDate()).slice(-2);
			// if it's in current month
			if(days[d].getMonth() == currentMonth.month ) {
				// if it is today's date
				if(days[d].getDate() == today.getDate() &&
				   days[d].getMonth() == today.getMonth() &&
				   days[d].getFullYear() == today.getFullYear()) {
					tr += "<td class='today' id='" + id +
						  "'>" + 
						  days[d].getDate() + "</td>";
				}
				// else it is not today's date
				else {
					tr += "<td class='days_in_month' id='" + id +
						  "''>" + 
						  days[d].getDate() + "</td>";
				}
			}
			// else it is not in current month
			else {
				tr += "<td class='days_not_in_month' id='" + id +
					  "''>" + 
					  days[d].getDate() + "</td>";
			}
		}
		tr += "</tr>";
	}
	$("#calendar_table").append(tr);


	if(is_logged_in){
		// console.log("1. inside is_logged_in");
		fetchEvents();
	}
}


// Rendering buttons for visitors (not logged in)
function state_not_login() {
	$("#nav-btns").empty();
	$("#sidebar").empty();
	$("#events_panel").html("");

	// console.log("inside state_not_login()");

	is_logged_in = false;
	updateCalendar();   
	//display signup and login buttons
	$("#nav_header").text("JavaScript Calendar");
	
	$("#nav-btns").append("<button class='btn btn-primary' data-toggle='modal' data-target='#signup_modal'>Signup</button>");
	$("#nav-btns").append("<button class='btn btn-primary' data-toggle='modal' data-target='#login_modal'>Login</button>");
	

	// Add event listener for login
	// User Login
	$("#login_btn").off().click(login);


	// Add event listener for Signup
	// User Signup
	$("#signup_btn").off().click(signup);
}



// Rendering buttons for registered users (logged in)
function state_login() {
	
	//change state and record session token
	is_logged_in = true;
	updateCalendar();
	// console.log("state_login()  token = " + token);

	// update Username
	$("#nav_header").text(username + "'s Calendar");

	// manage events button
	$("#nav-btns").html("<button class='btn btn-primary'  data-toggle='modal' data-target='#manage_modal' id='manage_btn'>Manage</button>");
	// Add event listener to manage_modal
	$('#manage_btn').click(manage);

	// log out button
	$("#nav-btns").append("<button class='btn btn-primary' id='logout_btn'>Log out</button>");
	// Add event listener to logout_btn
	$("#logout_btn").off().click(logout);

	// Create new event button
	$("#sidebar").html("<button class='btn btn-danger btn-sm' data-toggle='modal' data-target='#event_modal' id='create_modal'>Create New Event</button>");
	// Add event listener to create new event btn
	$('#create_modal').click(fetchAllUsers);

	// Toggle tags button
	$("#sidebar").append("&nbsp;<button class='btn btn-danger btn-sm' id='tag_btn'>Toggle Tags</button>");

	// Add event listener to Toggle Tags button
	$('#tag_btn').click(function(){ $(".tag").toggle(); });

	// Add event listener to event_date
	$("#event_date").datepicker();
	$("#event_date").datepicker("option","dateFormat", "yy-mm-dd");

	// Add event listener to new_event_date
	$("#new_event_date").datepicker();
	$("#new_event_date").datepicker("option","dateFormat", "yy-mm-dd");

	// Add event listener to create_btn
	$("#create_btn").off().click(create);

	// console.log("inside state_login()");
}


// Check current session state, if a user is logged in or not
function check_login_state() {
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", "user.php", true);
	xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlHttp.addEventListener("load", check_login_state_callback, false);
	xmlHttp.send("action=check");
	// console.log("inside check_login_state()");
}


// callback function for check_login_state()
function check_login_state_callback(event) {
	var jsonData = JSON.parse(event.target.responseText);
	user_id = jsonData.user_id;
	username = jsonData.username;
	token = jsonData.token;
	// console.log("inside callback check_login_state");
    // not logged in
 	if(!jsonData.success){
 		state_not_login();
	}
	// logged in
	else{
		state_login();
	}
}





/* Event Listener Functions */


// Display next month
$("#next_month_btn").click( function()
{
	currentMonth = currentMonth.nextMonth(); 
	updateCalendar(); 
});


// Display previous month
$("#prev_month_btn").click( function()
{
	currentMonth = currentMonth.prevMonth(); 
	updateCalendar(); 
});


// Display today
$("#today_btn").click( function()
{
	currentMonth = new Month(today.getFullYear(), today.getMonth());
	updateCalendar(); 
});


// Event listener func for login_btn
function login() {
	var lusername = $("#login_username").val();
	var lpassword = $("#login_password").val();

	var dataString = "action=login&username=" + encodeURIComponent(lusername) + 
					 "&password=" + encodeURIComponent(lpassword);

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", "user.php", true);
	xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlHttp.addEventListener("load", function(event){
		var jsonData = JSON.parse(event.target.responseText);
		if(jsonData.success){
			// alert("You've been logged in!");
			$("#login_username").val("");
			$("#login_password").val("");
			$(".modal").modal('hide');

			is_logged_in = true;
			user_id = jsonData.user_id;
			username = jsonData.username;
			token = jsonData.token;

			// console.log("after login, token = " + token);
			state_login();
		}
		else{
			alert("Login failed: " + jsonData.message);
			// console.log("at 2");
		}
	},false);
	xmlHttp.send(dataString);
}


// Event listener func for signup_btn
function signup() {
	// console.log("inside signup_btn event listener");
	var susername = $("#signup_username").val();
	var spassword = $("#signup_password").val();
	var name = $("#signup_name").val();
	var email = $("#signup_email").val();

	var dataString = "action=signup&username=" + encodeURIComponent(susername) +
					 "&password=" + encodeURIComponent(spassword) +
					 "&name=" + encodeURIComponent(name) +
					 "&email=" + encodeURIComponent(email);

	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", "user.php", true);
	xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
	xmlHttp.addEventListener("load", function(event)
	{
		var jsonData = JSON.parse(event.target.responseText);
		if(jsonData.success){
			// alert("Sign up successfully");
			$("#signup_username").val("");
			$("#signup_password").val("");
			$("#signup_name").val("");
			$("#signup_email").val("");
			$(".modal").modal('hide');

			is_logged_in = true;
			user_id = jsonData.user_id;
			username = jsonData.username;
			token = jsonData.token;

			
			state_login();
		}
		else{
			alert("Signup failed: " + jsonData.message);
		}
	},false);
	xmlHttp.send(dataString);
}


// Event listener func for logout_btn
function logout() {
	var dataString = "action=logout&token=" + encodeURIComponent(token);
	var xmlHttp = new XMLHttpRequest();
	xmlHttp.open("POST", "user.php", true);
	xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

	xmlHttp.addEventListener("load", function(event){
		var jsonData = JSON.parse(event.target.responseText);
		if(jsonData.success){
			// alert("Logout successfully");

			is_logged_in = false;
			user_id = "";
			username = "";
			token = "";
			selected_date = "";
			month_events = null;
			date_events = null;
			all_events = null;
			all_users = null;
			
			state_not_login();
			
		}
		else{
			alert("Logout failed: " + jsonData.message);
		}
	},false);

	xmlHttp.send(dataString);
}

// Event listener func for create_btn
function create() {
	// console.log("inside creat()");

	var event_title = $("#event_title").val();
	var event_date = $("#event_date").val();
	var event_time = $("#event_time").val();
	var event_tag = $("#event_tag").val();
	var event_note = $("#event_note").val();

	var shared_users = $('input:checkbox:checked').map(function() {
    return this.value;
	}).get();

    var dataString = "action=create" + 
    				 "&event_title=" + encodeURIComponent(event_title) + 
    				 "&event_date=" + encodeURIComponent(event_date) +
    				 "&event_time=" + encodeURIComponent(event_time) + 
    				 "&event_tag=" + encodeURIComponent(event_tag) + 
    				 "&event_note=" + encodeURIComponent(event_note) +
    				 "&shared_users=" + encodeURIComponent(shared_users.toString()) + 
    				 "&token=" + encodeURIComponent(token);

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "event.php", true);
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
	xmlHttp.addEventListener("load", function(event)
	{
		var jsonData = JSON.parse(event.target.responseText); 
		if(jsonData.success){  
			// alert("Event created");
			$("#event_title").val("");
			$("#event_date").val("");
			$("#event_time").val("");
			$("#event_tag").val("");
			$("#event_note").val("");

			
			$(".modal").modal('hide');
			// update events panel
			$('#'+selected_date).trigger('click');
			updateCalendar();
		}else{
			alert("Fail to create event: "+jsonData.message);
		}
	}, false); 
	xmlHttp.send(dataString);
}


// display all the events for selected date
function displayEvents() {
	// console.log("inside fetchEvents()");
	// id is the date of the selected event
	var id = $(this).attr('id');
	selected_date = id;

	var dataString = "action=display&event_date=" + encodeURIComponent(id) + 
					 "&token=" + encodeURIComponent(token);
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "event.php", true);
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
	xmlHttp.addEventListener("load", function(event){
		var jsonData = JSON.parse(event.target.responseText); 
		if(jsonData.success){
			// alert("Displaying events successful");
			date_events = jsonData.events;
			
			// displayEventsPanel() has to be put here, it runs only 
			// after load complete
			displayEventsPanel(id);
		}else{
			alert("Fail to display events: "+jsonData.message);
		}
	},true);
	xmlHttp.send(dataString);
}


// edit selected event
function editEvent() {
	// console.log("inside EditEvent()");
	// get the event obj selected for editing
	var event_id = $(this).val();
	var e = null;
	for(var i in date_events){
		if(date_events[i].event_id == event_id){
			e = date_events[i];
			break;
		}
	}
	// update event info in edit modal for nicer accessibility
	$('#new_event_title').val(e.event_title);
	$('#new_event_date').val(selected_date);
	$('#new_event_time').val(e.event_time);
	$('#new_event_tag').val(e.event_tag);
	$('#new_event_note').val(e.event_note);

	// Event listener func for edit_btn
	$('#edit_btn').off().click(function(){
		var new_event_title = $("#new_event_title").val();
		var new_event_date = $("#new_event_date").val();
		var new_event_time = $("#new_event_time").val();
		var new_event_tag = $("#new_event_tag").val();
		var new_event_note = $("#new_event_note").val();

	    var dataString = "action=edit" + 
	    				 "&event_id=" + encodeURIComponent(event_id) +
	    				 "&new_event_title=" + encodeURIComponent(new_event_title) + 
	    				 "&new_event_date=" + encodeURIComponent(new_event_date) +
	    				 "&new_event_time=" + encodeURIComponent(new_event_time) + 
	    				 "&new_event_tag=" + encodeURIComponent(new_event_tag) + 
	    				 "&new_event_note=" + encodeURIComponent(new_event_note) + 
	    				 "&token=" + encodeURIComponent(token);

	    var xmlHttp = new XMLHttpRequest();
	    xmlHttp.open("POST", "event.php", true);
	    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
		xmlHttp.addEventListener("load", function(event)
		{
			var jsonData = JSON.parse(event.target.responseText); 
			if(jsonData.success){  
				// alert("Event edit successful");
				$("#new_event_title").val("");
				$("#new_event_date").val("");
				$("#new_event_time").val("");
				$("#new_event_tag").val("");
				$("#new_event_note").val("");			
				$(".modal").modal('hide');

				// update events panel
				$('#'+selected_date).trigger('click');
				updateCalendar();
			}else{
				alert("Fail to create event: "+jsonData.message);
			}
		}, false); 
		xmlHttp.send(dataString);
	});
}


// In manage panel edit event
function mngEditEvent() {
	// console.log("inside mngEditEvent()");
	// get the event obj selected for editing
	var event_id = $(this).val();
	var e = null;
	for(var i in all_events){
		if(all_events[i].event_id == event_id){
			e = all_events[i];
			break;
		}
	}
	// update event info in edit modal for nicer accessibility
	$('#new_event_title').val(e.event_title);
	$('#new_event_date').val(e.event_date);
	$('#new_event_time').val(e.event_time);
	$('#new_event_tag').val(e.event_tag);
	$('#new_event_note').val(e.event_note);

	// Event listener func for edit_btn
	$('#edit_btn').off().click(function(){
		var new_event_title = $("#new_event_title").val();
		var new_event_date = $("#new_event_date").val();
		var new_event_time = $("#new_event_time").val();
		var new_event_tag = $("#new_event_tag").val();
		var new_event_note = $("#new_event_note").val();

	    var dataString = "action=edit" + 
	    				 "&event_id=" + encodeURIComponent(event_id) +
	    				 "&new_event_title=" + encodeURIComponent(new_event_title) + 
	    				 "&new_event_date=" + encodeURIComponent(new_event_date) +
	    				 "&new_event_time=" + encodeURIComponent(new_event_time) + 
	    				 "&new_event_tag=" + encodeURIComponent(new_event_tag) + 
	    				 "&new_event_note=" + encodeURIComponent(new_event_note) + 
	    				 "&token=" + encodeURIComponent(token);

	    var xmlHttp = new XMLHttpRequest();
	    xmlHttp.open("POST", "event.php", true);
	    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
		xmlHttp.addEventListener("load", function(event)
		{
			var jsonData = JSON.parse(event.target.responseText); 
			if(jsonData.success){  
				// alert("Event edit successful");
				$("#new_event_title").val("");
				$("#new_event_date").val("");
				$("#new_event_time").val("");
				$("#new_event_tag").val("");
				$("#new_event_note").val("");			
				$("#edit_modal").modal('hide');

				// update events panel
				if(selected_date !== "") {
					$('#'+selected_date).trigger('click');
				}
				// update manage panel
				manage();
				updateCalendar();
			}else{
				alert("Fail to create event: "+jsonData.message);
			}
		}, false); 
		xmlHttp.send(dataString);
	});
}

// delete selected event
function deleteEvent() {
	// console.log("inside deleteEvent()");
	var event_id = $(this).val();
	var dataString = "action=delete&event_id=" + encodeURIComponent(event_id) + 
				     "&token=" + encodeURIComponent(token);
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "event.php", true);
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
	xmlHttp.addEventListener("load", function(event){
		var jsonData = JSON.parse(event.target.responseText); 
		if(jsonData.success){
			// alert("Event deleted");
			// update events panel
			$('#'+selected_date).trigger('click');
			updateCalendar();
			// console.log("selected_date = " + selected_date);
		}else{
			alert("Fail to delete event: " + jsonData.message);
		}
	},true);
	xmlHttp.send(dataString);
}


// In manage panel delete selected event
function mngDeleteEvent() {
	// console.log("inside mngDeleteEvent()");
	var event_id = $(this).val();
	var dataString = "action=delete&event_id=" + encodeURIComponent(event_id) + 
				     "&token=" + encodeURIComponent(token);
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "event.php", true);
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
	xmlHttp.addEventListener("load", function(event){
		var jsonData = JSON.parse(event.target.responseText); 
		if(jsonData.success){
			// alert("Event deleted");
			// update events panel
			if(selected_date !== "") {
				$('#'+selected_date).trigger('click');
			}
			// update manage panel
			manage();
			updateCalendar();
			// console.log("selected_date = " + selected_date);
		}else{
			alert("Fail to delete event: " + jsonData.message);
		}
	},true);
	xmlHttp.send(dataString);
}


// Manage: fetch all of user's events, called when manage_btn is pressed
function manage() {
	// console.log("inside fetchAllEvents()");
	var dataString = "action=manage&&token=" + encodeURIComponent(token);
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "event.php", true);
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
	xmlHttp.addEventListener("load", function(event){
		var jsonData = JSON.parse(event.target.responseText); 
		if(jsonData.success){
			// alert("Fetching all events successful");
			all_events = jsonData.events;
			displayManagePanel();
		}else{
			alert("Fail to fetch all events: "+jsonData.message);
		}
	},true);
	xmlHttp.send(dataString);
}


// Fetch all the user_id and usernames
function fetchAllUsers(){
	// console.log("inside fetchAllUsers()");
	var dataString = "action=users&&token=" + encodeURIComponent(token);
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "user.php", true);
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
	xmlHttp.addEventListener("load", function(event){
		var jsonData = JSON.parse(event.target.responseText); 
		if(jsonData.success){
			// alert("Fetching all users successful");
			all_users = jsonData.users;
			displayAllUsers();
		}else{
			alert("Fail to fetch all users: "+jsonData.message);
		}
	},true);
	xmlHttp.send(dataString);
}






/* Helper functions */


// display all users
function displayAllUsers(){
	var html = "";
	for(var i in all_users){
		html += "<div class='checkbox'><label><input type='checkbox' value='" + 
				all_users[i].user_id + "'>&nbsp;" + all_users[i].username + "</label></div>";
	}
	$('#share').html(html);
}

// display all the events in manage modal
function displayManagePanel(){
	// console.log("1. insdie displayManagePanel()");
	$('#manage_modal').find('.modal-body').html("<div id='accordion_mng'></div>");
	for(var i in all_events){
		$('#accordion_mng').append("<h5>" + 
										"<span class='label label-" + all_events[i].event_tag + "'>" + 
											all_events[i].event_title + '&nbsp;' + 
											all_events[i].event_date + '&nbsp;' + 
											all_events[i].event_time +
										"</span>" + 
								   "</h5>" +
								   "<div>" + 
								   		"<p>" + all_events[i].event_note + "</p>" +
								   		"<button type='button' value='" + all_events[i].event_id + "' class='btn btn-" + all_events[i].event_tag + " btn-xs mng_edit' data-toggle='modal' data-target='#edit_modal'>Edit</button>" +
								   		'&nbsp;' +
								   		"<button type='button' value='" + all_events[i].event_id + "' class='btn btn-" + all_events[i].event_tag + " btn-xs mng_delete'>Delete</button>" +
								   "</div>");
		$('#accordion_mng').append();
	}
	// Add event listener to accordion_mng
	$("#accordion_mng").accordion({heightStyle: "content"});
	// Add Event listener to edit and delete buttons
	$('.mng_edit').click(mngEditEvent);
	$('.mng_delete').click(mngDeleteEvent);
	// console.log("2. insdie displayManagePanel()");
}



// fetch and update current month's events on calender
function fetchEvents() {
	// console.log("inside fetchEvents(), token = " + token);
	var dataString = "action=fetch&currentMonth=" + encodeURIComponent(currentMonth.month+1) + 
					 "&token=" + encodeURIComponent(token);
	var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "event.php", true);
    xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"); 
	xmlHttp.addEventListener("load", function(event){
		var jsonData = JSON.parse(event.target.responseText); 
		if(jsonData.success){
			// alert("Fetching events successful");
			month_events = jsonData.events;
			
			// displayTags() has to be put here, it runs only 
			// after load complete
			displayTags();
		}else{
			alert("Fail to fetch events: "+jsonData.message);
		}
	},true);
	xmlHttp.send(dataString);
}

// display current month events
function displayTags() {
	// console.log("inside displayTags()");
	var id = '';
	// console.log("events = " + month_events);
	for(var i in month_events) {
		id = '#' + month_events[i].event_date;

		// rendering tags
		var tags = month_events[i].tags.split(',');
		var html = "";
		for(var j in tags){
			switch(tags[j]){
				case "danger":
					html += "<svg height='10' width='10' class='tag'>" + 
							"<circle cx='5' cy='5' r='4' fill='rgb(201,48,44)'/></svg>";
					break;
				case "warning":
					html += "<svg height='10' width='10' class='tag'>" + 
							"<circle cx='5' cy='5' r='4' fill='rgb(240,173,78)'/></svg>";
					break;
				case "info":
					html += "<svg height='10' width='10' class='tag'>" + 
							"<circle cx='5' cy='5' r='4' fill='rgb(91,192,222)'/></svg>";
					break;
				case "success":
					html += "<svg height='10' width='10' class='tag'>" + 
							"<circle cx='5' cy='5' r='4' fill='rgb(92,184,92)'/></svg>";
					break;
				case "primary":
					html += "<svg height='10' width='10' class='tag'>" + 
							"<circle cx='5' cy='5' r='4' fill='rgb(51,122,183)'/></svg>";
					break;
				default:
					break;
			}
		}
		$(id).append("&nbsp;<span class='badge'>" + 
					     month_events[i].count + 
					     "</span><br>" +
					     html);
		// console.log(id);
		// add event listener to only dates with events
		$(id).off().click(displayEvents);
		// $(id).off().click(function(){
		// 	displayEvents(month_events[i].event_date);
		// });
	}
	// console.log("not in for loop");
}

// display selected date's events on events_panel
function displayEventsPanel(date){
	// console.log("1. insdie displayEventsPanel()");
	$('#events_panel').html("<h4>" + date + "</h4>");
	$('#events_panel').append("<div id='accordion'></div>");
	for(var i in date_events){
		$('#accordion').append("<h5>" + 
									"<span class='label label-" + date_events[i].event_tag + "'>" + 
										date_events[i].event_title + 
									"</span>" + 
							   "</h5>" +
							   "<div>" + 
							   		"<p>" + date_events[i].event_time + "</p>" +
							   		"<p>" + date_events[i].event_note + "</p>" +
							   		"<button type='button' value='" + date_events[i].event_id + "' class='btn btn-" + date_events[i].event_tag + " btn-xs edit' data-toggle='modal' data-target='#edit_modal'>Edit</button>" +
							   		'&nbsp;' +
							   		"<button type='button' value='" + date_events[i].event_id + "' class='btn btn-" + date_events[i].event_tag + " btn-xs delete'>Delete</button>" +
							   "</div>");
	}
	// Add event listener to accordion
	$("#accordion").accordion();
	// Add Event listener to edit and delete buttons
	$('.edit').click(editEvent);
	$('.delete').click(deleteEvent);
	// console.log("2. insdie displayEventsPanel()");
}