<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$host = "localhost";
$user = "root";
$pass = "";
$dbname = "ocr";

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed"]);
    exit();
}

$sql = "SELECT id, patient_name, visit_date, createdAt FROM patient_visits ORDER BY id DESC"; // adjust table name
$result = $conn->query($sql);

$records = [];
while ($row = $result->fetch_assoc()) {
    $records[] = $row;
}

echo json_encode(["status" => "success", "data" => $records]);
$conn->close();
