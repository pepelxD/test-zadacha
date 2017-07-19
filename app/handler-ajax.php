<?php
sleep(5);
$response = array();
$respose['fio'] = new stdClass();
$respose['fio'] -> lastname = $_POST['lastname'];
$respose['fio'] -> name = $_POST['name'];
$respose['fio'] -> patronymic = $_POST['patronymic'];
//$respose['error'] = 'Ошибка на сервере';

if($_POST['update'] == 'balans') {
    $response = array();
    $response['balans'] = mt_rand(1, 100);
}

print(json_encode($response));