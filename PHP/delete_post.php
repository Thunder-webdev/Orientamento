<?php
header('Content-Type: application/json');
ini_set('display_errors',1);
error_reporting(E_ALL);

$data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
$id = intval($data['id'] ?? 0);

if (!$id) {
    echo json_encode(['success'=>false,'error'=>'ID mancante']);
    exit;
}

$root = realpath(__DIR__);
$deleted = false;

$it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS)
);

foreach ($it as $file) {
    if (!preg_match('/posts\.json$/i', $file->getFilename())) continue;

    $path = $file->getPathname();
    $arr = json_decode(file_get_contents($path), true);
    if (!is_array($arr)) continue;

    $new = [];
    $changed = false;

    foreach ($arr as $p) {
        if (($p['id'] ?? 0) == $id) {

            if (!empty($p['files'])) {
                foreach ($p['files'] as $f) {
                    if (!empty($f['data'])) {
                        $relative = ltrim($f['data'], '/');
                        if (strpos($relative, 'uploads/') === 0) {
                            $fp = $root . '/' . $relative;
                            if (file_exists($fp)) unlink($fp);
                        }
                    }
                }
            }

            $changed = true;
            $deleted = true;
        } else {
            $new[] = $p;
        }
    }

    if ($changed) {
        file_put_contents(
            $path,
            json_encode($new, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE)
        );
    }
}

echo json_encode(['success'=>$deleted]);
