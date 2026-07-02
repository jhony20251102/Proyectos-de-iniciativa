<?php
header('Content-Type: application/json');

$imagenes = glob("imagenes/*.{jpg,jpeg,png,gif}", GLOB_BRACE);
$videos = glob("videos/*.{mp4,webm,ogg}", GLOB_BRACE);

$lista = [];
// Primero las imágenes para asegurar que el show empiece con una imagen
foreach ($imagenes as $img) {
    $lista[] = ["tipo" => "imagen", "src" => $img, "duracion" => 15000];
}
// Luego los videos
foreach ($videos as $vid) {
    $lista[] = ["tipo" => "video", "src" => $vid];
}

echo json_encode($lista, JSON_UNESCAPED_SLASHES);
