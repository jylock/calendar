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

switch ($action) {
	case 'check':
		if(isset($_SESSION['username'])){
			echo json_encode(array('success' => true,
								   'user_id' => $_SESSION['user_id'],
			                   	   'username' => $_SESSION['username'],
			                       'token' => $_SESSION['token']));
		}else{
			echo json_encode(array('success' => false));
		}
		break;
	case 'login':
		$username = $_POST['username'];
		$password = $_POST['password'];

		$stmt = $mysqli->prepare("select user_id, password from user where username=?");
		if(!$stmt){
			printf("Query Prep Failed: %s\n", $mysqli->error);
			echo json_encode(array(
					"success" => false,
					"message" => "database error"
				));
			exit;
		}
		$stmt->bind_param('s', $username);
		$stmt->execute();
		$stmt->bind_result($user_id, $hash_password);
		$stmt->fetch();
		$stmt->close();

		// check password
		if(crypt($password, $hash_password) == $hash_password){
			  $_SESSION['user_id'] = $user_id;
			  $_SESSION['username'] = $username;

			  // create new token
			  $_SESSION['token'] = substr(md5(rand()), 0, 10);
			  echo json_encode(array('success' => true,
								     'user_id' => $_SESSION['user_id'],
			                   	     'username' => $_SESSION['username'],
			                         'token' => $_SESSION['token']));
		      exit;
		}else{
		      echo json_encode(array("success" => false, 
		      						 "message" => "Username or password is not correct"));
		      exit;
		}
		break;
	case 'signup':
		// filter input fields first
		// if required fields do not pass
    	if(!isset($_POST['username']) || 
    	   !isset($_POST['password']) || 
    	   !isset($_POST['name']) || 
    	   !isset($_POST['email']) ||
    	   !preg_match('/^[\w_\.\-]+$/', $_POST['username']) ||
    	   !preg_match('/^[\w_\.\-]+$/', $_POST['password']) ||
    	   !preg_match('/^[\w_\.\-]+$/', $_POST['name']) ||
    	   !filter_var($_POST['email'], FILTER_VALIDATE_EMAIL)){
    		echo json_encode(array("success"=>false, 
    							   "message"=>"Required fields are invalid"));
	    }
	    // else valid fields
	    else{
	    	$username = $_POST['username'];
	    	$stmt = $mysqli->prepare("select username from user where username=?");
	    	if(!$stmt){
	    		printf("Query Prep Failed: %s\n", $mysqli->error);
	    		echo json_encode(array(
					"success" => false,
					"message" => "database error"
					));
	    		exit;
	    	}
	    	$stmt->bind_param('s', $username);
	    	$stmt->execute();
	    	$stmt->bind_result($exist);

	    	// first check duplicate username
	    	if($stmt->fetch()){
	    		echo json_encode(array("success"=>false, 
	    							   "message"=>"Duplicate username exists"));
	    		exit;
	    	}
	    	$stmt->close();

	        //encrypt password
	    	$password = crypt($_POST['password'],'cse330');
	    	$name = $_POST['name'];
	    	$email = $_POST['email']; 

	    	$stmt = $mysqli->prepare("insert into user (username, password, name, email) values (?, ?, ?, ?)");
	    	if(!$stmt){
	    		printf("Query Prep Failed: %s\n", $mysqli->error);
	    		echo json_encode(array(
					"success" => false,
					"message" => "database error"
					));
	    		exit;
	    	}

	    	$stmt->bind_param('ssss', $username, $password, $name, $email);
	    	$stmt->execute();
	    	$stmt->close();

			$stmt = $mysqli->prepare("select user_id from user where username=?");
			if(!$stmt){
				printf("Query Prep Failed: %s\n", $mysqli->error);
				echo json_encode(array(
					"success" => false,
					"message" => "database error"
					));
				exit;
			}
			$stmt->bind_param('s', $username);
			$stmt->execute();
			$stmt->bind_result($user_id);
			$stmt->fetch();
			$stmt->close();

			$_SESSION['user_id'] = $user_id;
			$_SESSION['username'] = $username;

			// create new token
			$_SESSION['token'] = substr(md5(rand()), 0, 10);

	    	echo json_encode(array('success' => true,
								   'user_id' => $_SESSION['user_id'],
			                   	   'username' => $_SESSION['username'],
			                       'token' => $_SESSION['token']));
	    	exit;
	    }
		break;
	case 'logout':
		validate();
		//destroy sessions
        session_destroy();
        echo json_encode(array("success" => true));
		break;
	case 'users':
		validate();

		$stmt = $mysqli->prepare("select user_id,
										 username
								  from user
								  where user_id != ?");

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

		// $users is an array containing array elements
		// each element is a complete event record
		$users = array();
		while($row = $result->fetch_assoc()) {
			$users[] = array('user_id' => $row['user_id'],
							 'username' => $row['username']);
		}
		$stmt->close();

		echo json_encode(array(
			"success" => true,
			"users" => $users
			));
		exit;
		break;
	default:
		# code...
		break;
}




 ?>