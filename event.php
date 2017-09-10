<?php 

include_once '../../secure_files/calendar_db_access.php';

//http-only session cookie
ini_set('session.cookie_httponly', 1);
session_start();
header('Content-Type: application/json');

$action = $_POST['action'];

// custom check and validation for security
function validate()
{
	if(!isset($_SESSION['user_id']) ||
	   !isset($_SESSION['username'])) {
		echo json_encode(array(
			"success" => false,
			"message" => "Not logged in"
			));
        exit;
	}
	if(!isset($_SESSION['token'])){
		echo json_encode(array(
			"success" => false,
			"message" => "token not set Request forgery detected"
			));
        exit;
	}
	if($_SESSION['token'] != $_POST['token']) {
		echo json_encode(array(
			"success" => false,
			"message" => "tokens not equal Request forgery detected"
			));
        exit;
	}
}


// main logic
switch ($action) {
	// create a new event
	case 'create':
		validate();

		$event_title = $_POST['event_title'];
		$event_date = $_POST['event_date'];
		$event_time = $_POST['event_time'];
		$event_note = $_POST['event_note'];
		$event_tag = $_POST['event_tag'];
		
		// create event for current user first
		$stmt = $mysqli->prepare("insert into event (user_id, 
													 event_title, 
													 event_date, 
													 event_time, 
													 event_tag,
													 event_note) values (?, ?, ?, ?, ?, ?)");
		if(!$stmt){
			printf("Query Prep Failed: %s\n", $mysqli->error);
			echo json_encode(array(
				"success" => false,
				"message" => "database error"
				));
			exit;
		}
        
		$stmt->bind_param('ssssss',  
						  $_SESSION['user_id'], 
						  $event_title, 
						  $event_date, 
						  $event_time, 
						  $event_tag,
						  $event_note);
	    $stmt->execute();
		$stmt->close();

		// create event for shared users;
		$shared_users = explode(',',$_POST['shared_users']);
		$event_title = "SHARED:" . $event_title;
		$event_note = $_SESSION['username'] . " shared with you: " . $event_note;

		foreach($shared_users as $shared_user){
			$stmt = $mysqli->prepare("insert into event (user_id, 
														 event_title, 
														 event_date, 
														 event_time, 
														 event_tag,
														 event_note) values (?, ?, ?, ?, ?, ?)");
			if(!$stmt){
				printf("Query Prep Failed: %s\n", $mysqli->error);
				echo json_encode(array(
					"success" => false,
					"message" => "database error"
					));
				exit;
			}
	        
			$stmt->bind_param('ssssss',  
							  $shared_user, 
							  $event_title, 
							  $event_date, 
							  $event_time, 
							  $event_tag,
							  $event_note);
		    $stmt->execute();
			$stmt->close();
		}
		echo json_encode(array("success" => true));
		exit;
		break;
	case 'fetch':
		validate();

		$currentMonth = $_POST['currentMonth'];

		$stmt = $mysqli->prepare("select event_date, 
										 count(*) as count,
										 group_concat(distinct event_tag) as tags 
										 from event 
										 where month(event_date)=? 
										 and 
										 user_id=?
										 group by event_date");
		if(!$stmt){
			printf("Query Prep Failed: %s\n", $mysqli->error);
			echo json_encode(array(
				"success" => false,
				"message" => "database error"
				));
			exit;
		}

		$stmt->bind_param('ss', $currentMonth, $_SESSION['user_id']);            
		$stmt->execute();     
		$result = $stmt->get_result();

		// $events is an array containing array elements
		// each element is a complete event record
		$events = array();
		while($row = $result->fetch_assoc()) {
			// array_push($events,array('event_date' => $row['event_date'],'count' => $row['count']) );
			$events[] = array('event_date' => $row['event_date'],
							  'count' => $row['count'],
							  'tags' => $row['tags']);
		}
		$stmt->close();

		echo json_encode(array(
			"success" => true,
			"events" => $events
			));
		exit;
		break;
	case 'display':
		validate();

		$event_date = $_POST['event_date'];

		$stmt = $mysqli->prepare("select event_id,
										 user_id, 
										 event_title,
										 event_date,
										 event_time,
										 event_tag, 
										 event_note from event 
										 where user_id = ? and event_date = ?");

		if(!$stmt){
			printf("Query Prep Failed: %s\n", $mysqli->error);
			echo json_encode(array(
				"success" => false,
				"message" => "database error"
				));
			exit;
		}

		$stmt->bind_param('ss', $_SESSION['user_id'], $event_date);            
		$stmt->execute();
		$result = $stmt->get_result();

		// $events is an array containing array elements
		// each element is a complete event record
		$events = array();
		while($row = $result->fetch_assoc()) {
			// array_push($events,array('event_date' => $row['event_date'],'count' => $row['count']) );
			$events[] = array('event_id' => $row['event_id'],
							  'event_title' => $row['event_title'],
							  'event_time' => $row['event_time'],
							  'event_tag' => $row['event_tag'],
							  'event_note' => $row['event_note']);
		}
		$stmt->close();

		echo json_encode(array(
			"success" => true,
			"events" => $events
			));
		exit;
		break;
	case 'delete':
		validate();

		$event_id = $_POST['event_id'];
        
		$stmt = $mysqli->prepare("delete from event where event_id = ?");
		if(!$stmt){
			printf("Query Prep Failed: %s\n", $mysqli->error);
			echo json_encode(array(
				"success" => false,
				"message" => "database error"
				));
			exit;
		}

		$stmt->bind_param('s', $event_id);
		$stmt->execute();
		$stmt->close();

		echo json_encode(array(
			"success" => true
			));
		exit;
		break;
	case 'edit':
		validate();

		$event_id = $_POST['event_id'];
		$new_event_title = $_POST['new_event_title'];
		$new_event_date = $_POST['new_event_date'];
		$new_event_time = $_POST['new_event_time'];
		$new_event_tag = $_POST['new_event_tag'];
		$new_event_note = $_POST['new_event_note'];
        
		$stmt = $mysqli->prepare("update event 
								  set event_title = ?, 
								  	  event_date = ?,
								  	  event_time = ?,
								  	  event_tag = ?,
								  	  event_note = ? 
								  where event_id = ?");
		if(!$stmt){
			printf("Query Prep Failed: %s\n", $mysqli->error);
			echo json_encode(array(
				"success" => false,
				"message" => "database error"
				));
			exit;
		}
        
		$stmt->bind_param('ssssss', $new_event_title, 
									$new_event_date,
									$new_event_time,
									$new_event_tag,
									$new_event_note,
									$event_id);
		$stmt->execute();
		$stmt->close();
		echo json_encode(array(
			"success" => true
		));
		exit;
		break;
	case 'manage':
		validate();

		$stmt = $mysqli->prepare("select event_id,
										 user_id, 
										 event_title,
										 event_date,
										 event_time,
										 event_tag, 
										 event_note from event 
										 where user_id = ?
										 order by event_date, event_time");

		if(!$stmt){
			printf("Query Prep Failed: %s\n", $mysqli->error);
			echo json_encode(array(
				"success" => false,
				"message" => "database error"
				));
			exit;
		}

		$stmt->bind_param('s', $_SESSION['user_id']);            
		$stmt->execute();
		$result = $stmt->get_result();

		// $events is an array containing array elements
		// each element is a complete event record
		$events = array();
		while($row = $result->fetch_assoc()) {
			// array_push($events,array('event_date' => $row['event_date'],'count' => $row['count']) );
			$events[] = array('event_id' => $row['event_id'],
							  'event_title' => $row['event_title'],
							  'event_date' => $row['event_date'],
							  'event_time' => $row['event_time'],
							  'event_tag' => $row['event_tag'],
							  'event_note' => $row['event_note']);
		}
		$stmt->close();

		echo json_encode(array(
			"success" => true,
			"events" => $events
			));
		exit;
		break;
	default:
		# code...
		break;
}

 ?>