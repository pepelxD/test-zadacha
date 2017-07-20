<?php
//sleep(5);
$response = array();
$response['fio'] = new stdClass();
$response['fio'] -> lastname = $_POST['lastname'];
$response['fio'] -> name = $_POST['name'];
$response['fio'] -> patronymic = $_POST['patronymic'];
//$response['error'] = 'Ошибка на сервере';

/* if($_POST['update'] == 'balans') {
    $response = array();
    $response['balans'] = mt_rand(1, 100);
} */

echo json_encode($response);