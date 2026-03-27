<?php
header("Content-Type: application/json");
ini_set('display_errors',1);
error_reporting(E_ALL);

$title = trim($_POST['title'] ?? '') ?: "Senza titolo";
$desc = trim($_POST['desc'] ?? '');
$section = trim($_POST['section'] ?? '');
$ownerName = trim($_POST['ownerName'] ?? 'Utente');
$ownerEmail = trim($_POST['ownerEmail'] ?? '');

if (!$section) {
    echo json_encode(['success'=>false,'error'=>'Section mancante']);
    exit;
}

[$sector, $subject] = array_pad(explode('/', $section, 2), 2, '');

// funzione JSON
function read_json($p){ return file_exists($p) ? (json_decode(file_get_contents($p), true) ?: []) : []; }
function write_json($p,$a){ file_put_contents($p,json_encode(array_values($a),JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)); }

// ID UNICO SICURO
$newId = time() . rand(100,999);

// UPLOAD FILES
$uploadedFiles = [];
$uploadsDir = __DIR__ . '/uploads';
if (!is_dir($uploadsDir)) mkdir($uploadsDir,0755,true);

if (!empty($_FILES['files'])) {
    foreach ($_FILES['files']['tmp_name'] as $i => $tmp) {
        if (!is_uploaded_file($tmp)) continue;
        $name = preg_replace('/[^a-zA-Z0-9_\.-]/','_',$_FILES['files']['name'][$i]);
        $uniq = $newId . "_" . $name;
        move_uploaded_file($tmp, "$uploadsDir/$uniq");

        $uploadedFiles[] = [
            'name'=>$name,
            'type'=>$_FILES['files']['type'][$i] ?? '',
            'data' => '/Orientamento/Orientamento/uploads/' . $uniq
        ];
    }
}

// POST OBJECT
$newPost = [
    'id'=>$newId,
    'title'=>$title,
    'text'=>$desc,
    'sector'=>$sector,
    'subject'=>$subject,
    'section'=>$subject ? "$sector/$subject" : $sector,
    'ownerName'=>$ownerName,
    'ownerEmail'=>$ownerEmail,
    'files'=>$uploadedFiles,
    'timestamp'=>time()
];

// GENERALE
$generalFile = __DIR__.'/posts.json';
$general = read_json($generalFile);
array_unshift($general,$newPost);
write_json($generalFile,$general);

// SETTORE
$sectorDir = __DIR__."/$sector";
if (!is_dir($sectorDir)) mkdir($sectorDir,0755,true);

$sectorFile = "$sectorDir/posts.json";
$sectorPosts = read_json($sectorFile);
array_unshift($sectorPosts,$newPost);
write_json($sectorFile,$sectorPosts);

// MATERIA
if ($subject) {
    $subjectFile = "$sectorDir/{$subject}_posts.json";
    $subjectPosts = read_json($subjectFile);
    array_unshift($subjectPosts,$newPost);
    write_json($subjectFile,$subjectPosts);
}

echo json_encode(['success'=>true,'id'=>$newId]);
