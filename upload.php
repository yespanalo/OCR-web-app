<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get JSON input
header("Content-Type: application/json; charset=UTF-8");

$data = json_decode(file_get_contents("php://input"), true);

$host = "localhost";         // or 127.0.0.1
$user = "root";
$pass = "";
$dbname = "ocr";

$conn = new mysqli($host, $user, $pass, $dbname);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Connection failed"]);
    exit();
}

// Prepare data
$stmt = $conn->prepare("
    INSERT INTO patient_visits (
        patient_name, visit_date, past_medical_history,
        medications, immunizations, surgeries,
        family_history, personal_history, physical_exam,
        normalDiagnostics,diagnosticFindings,otherFindings, assessment, recommendations, report_text
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
");

$stmt->bind_param(
    "sssssssssssssss",
    $data['patient_name'], $data['visit_date'],
    $data['past_medical_history'], $data['medications'],
    $data['immunizations'], $data['surgeries'],
    $data['family_history'], $data['personal_history'],
    $data['physical_exam'], $data['normalDiagnostics'],$data['diagnosticFindings'], $data['otherFindings'],
    $data['assessment'], $data['recommendations'],
    $data['report_text']
);

if ($stmt->execute()) {
    echo json_encode(["status" => "success"]);
} else {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>
